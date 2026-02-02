import { parentPort } from 'worker_threads';
import { connectToDatabase } from '../config/database'; // Relative path to avoid alias issues
import logger from '../utils/logger';
import { ProcessedArticleData } from '../types/rss';
import { ScraperService } from '../utils/scraper';
import { RssRepository } from '../repositories/rssRepository';
import { aiService } from '../services/aiService';

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
        const startTime = Date.now();
        const contentToAnalyze = await prepareArticleContent(article);

        // Analysis and Translation
        logger.info(`🧵 [AI Worker] Analyzing: "${article.title.slice(0, 50)}..." (${article.language})`);
        const { analysis, translations } = await aiService.analyzeArticle(article.title, contentToAnalyze, article.language || 'en');

        await RssRepository.updateById(article._id!, { analysis, translations, processedAt: new Date().toISOString() });
        logger.info(`🧵 [AI Worker] Done in ${Date.now() - startTime}ms: ${analysis.sentiment}`);

        if (parentPort) parentPort.postMessage({ type: 'COMPLETED', id: article._id, title: article.title });
        await delay(500);
    } catch (err) {
        logger.error(`❌ [AI Worker] Error on article ${article.link}:`, err);
        await RssRepository.updateErrorStatus(article.link, 'AI Analysis Failed');
    }
}

async function prepareArticleContent(article: ProcessedArticleData): Promise<string> {
    if (article.fullText) return article.fullText;

    if (!article.scrapedContent) {
        logger.info(`🧵 [AI Worker] Deep Scraping: ${article.link}`);
        const fullText = await ScraperService.extractFullText(article.link);
        if (fullText) {
            article.fullText = fullText;
            article.scrapedContent = true;
            await RssRepository.updateById(article._id!, { fullText, scrapedContent: true });
            return fullText;
        }
    }

    if (!article.imageUrl) {
        logger.info(`🧵 [AI Worker] Extracting Image: ${article.link}`);
        const imageUrl = await ScraperService.extractMainImage(article.link);
        if (imageUrl) {
            article.imageUrl = imageUrl;
            await RssRepository.updateById(article._id!, { imageUrl });
        }
    }

    return article.summary || '';
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the worker
startWorker();
