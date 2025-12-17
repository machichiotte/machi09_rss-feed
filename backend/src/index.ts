import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { connectToDatabase } from './config/database';
import rssRoutes from './routes/rssRoutes';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API Routes
app.get('/api', (req, res) => {
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

// TODO: Setup cron job for RSS processing
// const RSS_CRON_SCHEDULE = process.env.RSS_CRON_SCHEDULE || '*/30 * * * *';
// if (process.env.RSS_ENABLED === 'true') {
//   cron.schedule(RSS_CRON_SCHEDULE, async () => {
//     console.log('Running RSS feed processing...');
//     // Call RSS processor service
//   });
// }

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
    });
});

// Start server
async function startServer() {
    try {
        // Connect to MongoDB first
        await connectToDatabase();

        // Then start Express server
        app.listen(PORT, () => {
            console.log(`🚀 machi09_rss-feed server running on port ${PORT}`);
            console.log(`📡 Health check: http://localhost:${PORT}/health`);
            console.log(`📰 API: http://localhost:${PORT}/api`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

            // Setup cron job if RSS is enabled
            if (process.env.RSS_ENABLED === 'true') {
                const schedule = process.env.RSS_CRON_SCHEDULE || '*/30 * * * *';
                console.log(`⏰ RSS cron job scheduled: ${schedule}`);
                // TODO: Implement cron job
                // cron.schedule(schedule, async () => {
                //   console.log('Running RSS feed processing...');
                // });
            }
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;
