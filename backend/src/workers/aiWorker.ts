import { parentPort } from 'worker_threads';
import { connectToDatabase } from '../config/database'; // Relative path to avoid alias issues
import { RssRepository } from '../repositories/rssRepository';
import { aiService } from '../services/aiService';
import logger from '../utils/logger';
import { ProcessedArticleData } from '../types/rss';

// Flag to stop the worker gracefully
let isRunning = true;

async function startWorker() {
    try {
        // 1. Initialize standalone DB connection for this thread
        await connectToDatabase();
        logger.info('🧵 [AI Worker] Database connected.');

        // 2. Initialize AI Models (Heavy Load)
        logger.info('🧵 [AI Worker] Initializing AI models...');
        await aiService.init();
        logger.info('🧵 [AI Worker] AI Models ready.');

        // 3. Main Loop
        await mainLoop();

    } catch (startupError) {
        logger.error('❌ [AI Worker] Fatal Startup Error:', startupError);
        process.exit(1);
    }
}

async function mainLoop() {
    while (isRunning) {
        try {
            // Fetch a small batch of pending articles
            const pending = await RssRepository.findPendingAnalysis(5);

            if (pending.length === 0) {
                // No work? Sleep for 5 seconds to save resources
                await delay(5000);
                continue;
            }

            logger.info(`🧵 [AI Worker] Processing batch of ${pending.length} articles...`);
            await processBatch(pending);

        } catch (loopError) {
            logger.error('❌ [AI Worker] Error in main loop:', loopError);
            await delay(5000); // Backoff on error
        }
    }
}

async function processBatch(articles: ProcessedArticleData[]) {
    for (const article of articles) {
        await processSingleArticle(article);
    }
}

async function processSingleArticle(article: ProcessedArticleData) {
    try {
        logger.info(`🧵 [AI Worker] Analyzing: "${article.title.slice(0, 50)}..." (${article.language})`);

        const startTime = Date.now();
        const { analysis, translations } = await aiService.analyzeArticle(
            article.title,
            article.summary || '',
            article.language || 'en'
        );
        const duration = Date.now() - startTime;

        await RssRepository.updateById(article._id!, {
            analysis,
            translations,
            processedAt: new Date().toISOString()
        });

        logger.info(`🧵 [AI Worker] Done in ${duration}ms: ${analysis.sentiment}`);

        // Notify parent thread (optional, for monitoring)
        if (parentPort) {
            parentPort.postMessage({ type: 'COMPLETED', id: article._id, title: article.title });
        }

        // Small breathing room for CPU
        await delay(500);

    } catch (err) {
        logger.error(`❌ [AI Worker] Error on article ${article.link}:`, err);
        await RssRepository.updateErrorStatus(article.link, 'AI Analysis Failed');
    }
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the worker
startWorker();
