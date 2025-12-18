import winston from 'winston';
import util from 'util';
import path from 'path';
import fs from 'fs';

const logLevel = process.env.LOG_LEVEL || 'info';

// Path to log errors in the notes directory as requested
const NOTES_LOG_DIR = '/media/machi/Data/Dev/machi-workspace/machi-projects/notes/machi09_rss-feed/logs';

// Ensure the directory exists
try {
    if (!fs.existsSync(NOTES_LOG_DIR)) {
        fs.mkdirSync(NOTES_LOG_DIR, { recursive: true });
    }
} catch {
    console.warn('Could not create log directory in notes, falling back to local logs');
}

export const logger = winston.createLogger({
    level: logLevel,
    defaultMeta: { service: 'machi09_rss-feed' },
    transports: [
        // Console logging (Beautiful & Colored)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
                    let msg = `${timestamp} [${service}] ${level}: ${message}`;
                    // Special handling for errors to avoid printing them twice if they are already in the message
                    if (Object.keys(meta).length > 0) {
                        msg += ` ${util.inspect(meta, { depth: 2, colors: true, breakLength: Infinity })}`;
                    }
                    return msg;
                })
            ),
        }),
        // Error logging in the notes directory (JSON format for parsing)
        new winston.transports.File({
            filename: path.join(NOTES_LOG_DIR, 'error.log'),
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        // Combined logging (JSON format for parsing)
        new winston.transports.File({
            filename: path.join(NOTES_LOG_DIR, 'combined.log'),
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ],
});

export default logger;
