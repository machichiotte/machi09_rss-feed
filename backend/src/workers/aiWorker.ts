import { connectToDatabase } from '../config/database';
import logger from '../utils/logger';
import { ProcessedArticleData, FinancialAnalysis as ArticleAnalysis } from '../types/rss';
import { ScraperService } from '../utils/scraper';
import { RssRepository } from '../repositories/rssRepository';
import { aiService, SentimentResult } from '../services/aiService';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for the standalone worker
const envPath = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envPath) });

// Flag to stop the worker gracefully
let isRunning = true;

async function startWorker() {
    try {
        // 1. Initialize standalone DB connection
        await connectToDatabase();
        logger.info('🧵 [AI Worker] Database connected.');

        // 2. Initialize AI Models
        logger.info('🧵 [AI Worker] Initializing AI models...');
        await aiService.init();
        logger.info('🧵 [AI Worker] AI Models ready.');

        // 3. Main Loop
        await runWorker();

    } catch (startupError) {
        logger.error('❌ [AI Worker] Fatal Startup Error:', startupError);
        process.exit(1);
    }
}

// Flag for summary concurrency control
let activeSummaries = 0;
const MAX_CONCURRENT_SUMMARIES = 1;

/**
 * Main worker loop.
 */
async function runWorker() {
    logger.info('🧵 [AI Worker] Starting incremental analysis loop...');

    while (isRunning) {
        try {
            const pendingArticles = await RssRepository.findPendingAnalysis(10);

            if (pendingArticles.length === 0) {
                await delay(5000);
                continue;
            }

            for (const article of pendingArticles) {
                if (!isRunning) break;
                await processArticleIncrementally(article);
            }

        } catch (error) {
            logger.error('🧵 [AI Worker] Fatal error in loop:', error);
            await delay(10000);
        }
    }
}

/**
 * Processes an article in stages:
 * 1. Fast Path: Sentiment + NER (awaited, then saved)
 * 2. Slow Path: Summarization (not awaited here)
 */
async function processArticleIncrementally(article: ProcessedArticleData) {
    const startTime = Date.now();
    const id = article._id ? article._id.toString() : '';
    if (!id) return;

    try {
        const content = await prepareArticleContent(article);
        if (!content) {
            await RssRepository.updateById(id, { processedAt: new Date().toISOString() });
            return;
        }

        // --- STAGE 1: FAST PATH ---
        logger.info(`🧵 [AI Worker] ⚡ FAST PATH: "${article.title.slice(0, 40)}..."`);

        const articleContext = `${article.feedName} | ${article.title}`;
        const [sentiment, entities] = await Promise.all([
            aiService.analyzeSentiment(content, articleContext),
            aiService.extractEntities(content, articleContext)
        ]);

        const analysis: ArticleAnalysis = {
            sentiment: mapSentimentLabel(sentiment),
            sentimentScore: sentiment?.score || 0,
            entities: entities,
            isPromotional: detectPromo(article.title, content)
        };

        await RssRepository.updateById(id, {
            analysis,
            processedAt: new Date().toISOString()
        });

        logger.info(`🧵 [AI Worker] ✅ FAST PATH DONE for [${id}] in ${Date.now() - startTime}ms`);

        // --- STAGE 2: SLOW PATH ---
        if (content.length >= 200) {
            processSummaryInBackground(id, content, article.title, article.feedName || 'Unknown');
        }

    } catch (error) {
        logger.error(`🧵 [AI Worker] Error processing article ${id}:`, error);
        await RssRepository.updateById(id, { error: String(error), processedAt: new Date().toISOString() });
    }
}

/**
 * Handles summarization without blocking the main worker loop.
 */
async function processSummaryInBackground(id: string, content: string, title: string, feedName: string) {
    while (activeSummaries >= MAX_CONCURRENT_SUMMARIES) {
        await delay(2000);
    }

    activeSummaries++;
    try {
        logger.info(`🧵 [AI Worker] 🐢 SLOW PATH START: Summarizing "${title.slice(0, 30)}..."`);
        const start = Date.now();
        const articleContext = `${feedName} | ${title}`;
        const iaSummary = await aiService.summarize(content, articleContext);

        if (iaSummary) {
            const existing = await RssRepository.findById(id);
            const updatedAnalysis = {
                ...(existing?.analysis || {}),
                iaSummary
            };

            await RssRepository.updateById(id, { analysis: updatedAnalysis as ArticleAnalysis });
            logger.info(`🧵 [AI Worker] ✨ SLOW PATH DONE (${Date.now() - start}ms) for [${id}]`);
        }
    } catch (error) {
        logger.error(`🧵 [AI Worker] ❌ Summary failed for ${id}:`, error);
    } finally {
        activeSummaries--;
    }
}

function mapSentimentLabel(s: SentimentResult | null): 'bullish' | 'bearish' | 'neutral' {
    if (s?.label === 'POSITIVE') return 'bullish';
    if (s?.label === 'NEGATIVE') return 'bearish';
    return 'neutral';
}

function detectPromo(title: string, summary: string): boolean {
    const promoKeywords = ['sale', 'discount', 'limited offer', 'buy now', 'promo', 'giveaway', 'airdrop', 'presale'];
    const combined = `${title} ${summary}`.toLowerCase();
    return promoKeywords.some(keyword => combined.includes(keyword));
}

async function prepareArticleContent(article: ProcessedArticleData): Promise<string> {
    if (article.fullText) return article.fullText;

    const id = article._id!.toString();

    if (!article.scrapedContent) {
        logger.info(`🧵 [AI Worker] 🔍 Deep Scraping: ${article.link}`);
        const fullText = await ScraperService.extractFullText(article.link);
        if (fullText) {
            await RssRepository.updateById(id, { fullText, scrapedContent: true });
            return fullText;
        }
    }

    if (!article.imageUrl) {
        const imageUrl = await ScraperService.extractMainImage(article.link);
        if (imageUrl) {
            await RssRepository.updateById(id, { imageUrl });
        }
    }

    return article.summary || '';
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the worker
startWorker();
