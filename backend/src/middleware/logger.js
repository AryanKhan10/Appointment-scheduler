import morgan from 'morgan';

// Custom token for ISO timestamp in Pakistan/local time
morgan.token('timestamp', () => {
    return new Date().toISOString();
});

// Clean structured format for API requests: [timestamp] METHOD url STATUS duration - IP
export const requestLogger = morgan(':timestamp [:method] :url :status :response-time ms - :remote-addr');
