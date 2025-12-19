import winston from 'winston';
import util from 'util';
import path from 'path';
import fs from 'fs';

const logLevel = process.env.LOG_LEVEL || 'info';
const isProduction = process.env.NODE_ENV === 'production';

// Path to log errors in the ops directory as requested (local only)
const OPS_LOG_DIR = '/media/machi/Data/Dev/machi-workspace/machi-projects/machi00_ops/machi09_rss-feed/debug-logs';
let logDir = OPS_LOG_DIR;
let useFileLogging = true;

// Ensure the directory exists or fallback to relative path
try {
    if (!fs.existsSync(logDir)) {
        // Fallback to a local 'logs' directory if the absolute path is unavailable (e.g., in Docker/HF)
        logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }
} catch {
    console.warn('Could not create log directory, falling back to console only');
    useFileLogging = false;
}

// Build transports
const transports: winston.transport[] = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
                let msg = `${timestamp} [${service}] ${level}: ${message}`;
                if (Object.keys(meta).length > 0) {
                    msg += ` ${util.inspect(meta, { depth: 2, colors: true, breakLength: Infinity })}`;
                }
                return msg;
            })
        ),
    })
];

// Add file transports only if we are not in a restricted environment (like HF Spaces)
if (useFileLogging && !isProduction) {
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json())
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            format: winston.format.combine(winston.format.timestamp(), winston.format.json())
        })
    );
}

export const logger = winston.createLogger({
    level: logLevel,
    defaultMeta: { service: 'kognit-service' },
    transports,
});

export default logger;
