import winston from 'winston';
import util from 'util';
import path from 'path';
import fs from 'fs';

const logLevel = process.env.LOG_LEVEL || 'info';

// Path to log errors in the ops directory as requested (local only)
// Log directory resolution
let logDir = path.join(process.cwd(), 'logs');

// If running in the specific local dev environment (outside docker)
const OPS_LOG_DIR = '/media/machi/Data/Dev/machi-workspace/machi-projects/machi00_ops/machi09_rss-feed/debug-logs';
if (fs.existsSync(OPS_LOG_DIR)) {
    logDir = OPS_LOG_DIR;
}

let useFileLogging = true;
try {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
} catch (error) {
    console.warn('⚠️ Could not initialize log directory, falling back to console:', error);
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

// Add file transports
if (useFileLogging) {
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
