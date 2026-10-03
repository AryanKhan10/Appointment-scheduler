import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import http from 'http';

dotenv.config();
const app = express();
const server = http.createServer(app);

import { requestLogger } from './middleware/logger.js';
import { apiLimiter } from './middleware/rateLimiter.js';

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Initialize Socket.io via separate file
import { init } from './socket.js';
init(server);

// API Routes with general rate limiting
app.use('/api', apiLimiter, routes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
