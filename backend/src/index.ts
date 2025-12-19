import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { connectToDatabase } from './config/database';
import rssRoutes from './routes/rssRoutes';
import logger from './utils/logger';
import { RssService } from './services/rssService';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false, // Required for some browsers to allow cross-origin requests
}));
app.use(cors({
    origin: '*', // Allows any website to call this API
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Request logging middleware to track API latency and usage.
 */
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// Root route to prevent 404 on Hugging Face main page
app.get('/', (_req, res) => {
    res.json({
        message: 'Kognit Service is running',
        api: '/api',
        health: '/health'
    });
});

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API Routes
app.get('/api', (_req, res) => {
    res.json({
        message: 'machi09_rss-feed API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            rss: '/api/rss',
            rssSearch: '/api/rss/search?link=<url>',
        },
    });
});

// RSS Routes
app.use('/api/rss', rssRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled Application Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
    });
});

/**
 * Main entry point to initialize the server and its dependencies.
 */
async function startServer(): Promise<void> {
    // 1. Start Express server FIRST (so Hugging Face health check passes)
    app.listen(Number(PORT), '0.0.0.0', () => {
        logger.info(`🚀 machi09_rss-feed server running on port ${PORT}`);
        logger.info(`📡 Health check: http://localhost:${PORT}/health`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    try {
        // 2. Connect to MongoDB in the background
        await connectToDatabase();

        // 3. Setup cron job if RSS is enabled
        if (process.env.RSS_ENABLED === 'true') {
            const schedule = process.env.RSS_CRON_SCHEDULE || '*/30 * * * *';
            logger.info(`⏰ RSS cron job scheduled: ${schedule}`);

            cron.schedule(schedule, async () => {
                try {
                    logger.info('⏰ Cron job triggered: processing feeds...');
                    await RssService.processAllFeeds();
                } catch (error) {
                    logger.error('Error in cron job:', error);
                }
            });

            // Run initial processing
            setTimeout(async () => {
                logger.info('🚀 Initial processing starting...');
                await RssService.processAllFeeds().catch(err => {
                    logger.error('Failed initial processing:', err);
                });
            }, 5000);
        }
    } catch (error) {
        logger.error('❌ Database connection failed:', error);
        // We don't exit immediately so we can at least see logs via health check
    }
}

startServer();

export default app;
