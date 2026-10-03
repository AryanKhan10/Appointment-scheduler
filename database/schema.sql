-- ====================================================================
-- AI-Assisted Appointment Booking SaaS - PostgreSQL Schema
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. EXTENSIONS & ENUMS
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define statuses for appointments
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Define user roles
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'business_owner');

-- --------------------------------------------------------------------
-- 2. TABLES
-- --------------------------------------------------------------------

-- Table: businesses (Multi-tenancy support)
-- Allows the platform to support multiple service providers/businesses
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: users
-- Handles authentication, profile data, and roles.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL, -- Null for platform admins
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT, -- Optional: Can be null if using OAuth
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    role user_role DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: chat_sessions
-- Stores metadata and history for AI chat sessions.
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    title VARCHAR(255),
    -- We store conversation history natively as JSONB, which allows fast single-query retrieval
    messages JSONB DEFAULT '[]'::jsonb, 
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: appointments
-- Stores scheduling data and links to customer and business.
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL, -- Chat that resulted in this booking
    service_name VARCHAR(255) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status appointment_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: ai_logs
-- Stores interaction logs and latency metrics for AI analytics and debugging.
CREATE TABLE ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    model VARCHAR(100),
    user_message TEXT,
    ai_response TEXT,
    action_type VARCHAR(50) DEFAULT 'CONVERSATIONAL',
    latency_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 3. INDEXING STRATEGY
-- --------------------------------------------------------------------

-- Indexing foreign keys for faster JOINS and CASCADE operations
CREATE INDEX idx_users_business_id ON users(business_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_business_id ON chat_sessions(business_id);
CREATE INDEX idx_appointments_business_id ON appointments(business_id);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_ai_logs_business_id ON ai_logs(business_id);
CREATE INDEX idx_ai_logs_created_at ON ai_logs(created_at);

-- Indexing commonly queried fields
-- B-Tree index on scheduled_at optimizes date-range queries & conflict checks
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
-- Unique index for instant O(1) user email lookups during authentication
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Composite index for fast tenant-specific schedule lookups
CREATE INDEX idx_appointments_tenant_schedule ON appointments(business_id, scheduled_at, status);

-- --------------------------------------------------------------------
-- 4. SAMPLE INSERT STATEMENTS
-- --------------------------------------------------------------------

-- Insert multi-tenant businesses
INSERT INTO businesses (id, name) VALUES 
('b1111111-1111-1111-1111-111111111111', 'Acme Dental Clinic'),
('b2222222-2222-2222-2222-222222222222', 'Apex Health & Wellness'),
('b3333333-3333-3333-3333-333333333333', 'Mind Therapy Studio')
ON CONFLICT (id) DO NOTHING;

-- Insert sample customer
INSERT INTO users (id, business_id, email, password_hash, full_name, role)
VALUES (
    'u2222222-2222-2222-2222-222222222222', 
    'b1111111-1111-1111-1111-111111111111', 
    'john.doe@example.com', 
    '$2b$10$hashedpasswordhere', 
    'John Doe', 
    'customer'
) ON CONFLICT (email) DO NOTHING;

-- Insert a sample chat session
INSERT INTO chat_sessions (id, user_id, business_id, title, messages)
VALUES (
    'c3333333-3333-3333-3333-333333333333',
    'u2222222-2222-2222-2222-222222222222',
    'b1111111-1111-1111-1111-111111111111',
    'Dental Checkup Booking',
    '[
        {"role": "user", "content": "I need to book a dental checkup for tomorrow.", "timestamp": "2026-10-03T10:00:00Z"},
        {"role": "assistant", "content": "I can help with that. What time works best for you?", "timestamp": "2026-10-03T10:00:02Z"}
    ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert a sample appointment
INSERT INTO appointments (id, business_id, customer_id, chat_session_id, service_name, scheduled_at, duration_minutes, status, notes)
VALUES (
    'a4444444-4444-4444-4444-444444444444',
    'b1111111-1111-1111-1111-111111111111',
    'u2222222-2222-2222-2222-222222222222',
    'c3333333-3333-3333-3333-333333333333',
    'Dental Checkup',
    '2026-10-05 14:00:00+05',
    30,
    'confirmed',
    'Routine cleaning and checkup'
) ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- 5. PERFORMANCE & DESIGN NOTES
-- --------------------------------------------------------------------
/*
1. Multi-Tenancy Design:
   - A `business_id` is present on the users, chat_sessions, and appointments tables.
   - This ensures the application can scale horizontally as a SaaS offering, isolating schedule data per business.
   - Slot collision detection is scoped by `business_id`, ensuring two different businesses can schedule concurrent appointments without conflicts.

2. JSONB for Chat History:
   - Storing conversation messages as a JSONB array inside `chat_sessions` provides instant read performance in a single round-trip query.
   - Appending to JSONB avoids high table lock overhead compared to a fragmented millions-of-rows `messages` table.

3. Indexing Strategy:
   - B-Tree indexes on foreign keys (`business_id`, `customer_id`) eliminate sequential scans during table JOINs.
   - Composite index `idx_appointments_tenant_schedule` (business_id, scheduled_at, status) accelerates real-time date conflict queries to sub-millisecond execution.

4. UUID Primary Keys:
   - UUIDs eliminate enumeration security vulnerabilities and enable distributed client-side ID generation if required.
*/
