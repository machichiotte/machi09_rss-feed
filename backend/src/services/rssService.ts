import Parser from 'rss-parser';
import { fork, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { RssRepository } from '@/repositories/rssRepository';
import { rssConfig } from '@/config/rssConfig';
import { ProcessedArticleData, RssFeedConfig } from '@/types/rss';
import logger from '@/utils/logger';

// ESM compatibility for __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parser = new Parser({
    timeout: 20000, // 20 seconds timeout
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8'
    }
});

export class RssService {
    private static aiProcess: ChildProcess | null = null;

    /**
     * Orchestrates the fetching and processing of all enabled RSS feeds from configuration.
     * This process is optimized with batching and background AI analysis (via child process).
     * 
     * @returns {Promise<{ processed: number; errors: number }>} Counts of processed articles and errors.
     */
    public static async processAllFeeds(): Promise<{ processed: number; errors: number }> {
        logger.info('🚀 Starting Optimized RSS feed processing...');

        // 1. Fetch all feeds in parallel (with concurrency limit)
        const allFeeds: { feed: RssFeedConfig; category: string }[] = [];
        for (const [category, feeds] of Object.entries(rssConfig.categories)) {
            for (const feed of feeds) {
                if (feed.enabled) {
                    allFeeds.push({ feed, category });
                }
            }
        }

        let processedCount = 0;
        let errorCount = 0;

        // Process in batches of 5 to avoid overwhelming network/sources
        const batchSize = 5;
        for (let i = 0; i < allFeeds.length; i += batchSize) {
            const batch = allFeeds.slice(i, i + batchSize);
            const batchPromises = batch.map(async ({ feed, category }) => {
                try {
                    logger.info(`📡 Fetching feed: ${feed.name} [${feed.url}] (${category})`);
                    const count = await this.fetchFeedOnly(feed, category);
                    if (count > 0) {
                        logger.info(`✨ Successfully saved ${count} new articles from ${feed.name}`);
                    } else {
                        logger.info(`ℹ️ No new articles for ${feed.name}`);
                    }
                    return count;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    logger.error(`❌ Error fetching feed ${feed.name}: ${errorMessage}`);
                    errorCount++;
                    return 0;
                }
            });

            const results = await Promise.all(batchPromises);
            processedCount += results.reduce((acc, val) => acc + val, 0);
        }

        logger.info(`✅ Fetching complete. ${processedCount} new articles found.`);

        // 2. Start AI Analysis in separate process (Non-blocking)
        this.startBackgroundWorker();

        return { processed: processedCount, errors: errorCount };
    }

    /**
     * Fetches a single RSS feed, parses items, and saves new ones to the database.
     * Note: This does not trigger AI analysis immediately (saved as pending).
     * 
     * @param {RssFeedConfig} feed - The feed target configuration.
     * @param {string} category - The category associated with this feed.
     * @returns {Promise<number>} Number of new articles saved.
     */
    private static async fetchFeedOnly(feed: RssFeedConfig, category: string): Promise<number> {
        const rssFeed = await parser.parseURL(feed.url);
        let newCount = 0;

        for (const item of rssFeed.items) {
            if (!item.link) continue;

            const existing = await RssRepository.findByLink(item.link);
            if (existing) continue;

            const title = item.title || 'No title';
            const summary = item.contentSnippet || item.content || null;

            const article: ProcessedArticleData = {
                title: title,
                link: item.link,
                publicationDate: item.isoDate || item.pubDate || null,
                sourceFeed: feed.url,
                feedName: feed.name,
                category: category,
                language: feed.language || 'en',
                fetchedAt: new Date().toISOString(),
                processedAt: new Date().toISOString(),
                summary: summary,
                analysis: undefined, // Analysis will be done later
                error: null,
                scrapedContent: false,
            };

            await RssRepository.save(article);
            newCount++;
        }

        return newCount;
    }

    /**
     * Spawns a dedicated child process to handle AI analysis.
     * This prevents the main event loop from blocking during heavy ML inference.
     */
    private static startBackgroundWorker(): void {
        if (this.aiProcess && !this.aiProcess.killed) {
            logger.info('🧠 AI Worker Process is already running.');
            return;
        }

        // Resolve correct path whether we are in TS (dev) or JS (prod)
        // In dev with tsx, we point to .ts. In prod, dist structure usually matches.
        // Simple heuristic: if we are in src directory, use .ts, else .js
        const isDev = __filename.endsWith('.ts');
        const workerFilename = isDev ? 'aiWorker.ts' : 'aiWorker.js';
        const workerPath = path.resolve(__dirname, '../workers/', workerFilename);

        logger.info(`🚀 Spawning AI Worker Process: ${workerPath}`);

        try {
            // fork() spawns a new V8 instance.
            // If running with tsx, it should handle TS files automatically.
            this.aiProcess = fork(workerPath, [], {
                // Forward environment variables
                env: { ...process.env, IS_WORKER: 'true' }
            });

            this.aiProcess.on('message', (msg: { type: string; title?: string }) => {
                if (msg.type === 'COMPLETED') {
                    logger.info(`✨ Worker finished article: ${msg.title}`);
                }
            });

            this.aiProcess.on('error', (err) => {
                logger.error('❌ AI Worker Process Error:', err);
            });

            this.aiProcess.on('exit', (code) => {
                if (code !== 0) {
                    logger.warn(`⚠️ AI Worker Process stopped with exit code ${code}. Restarting in 10s...`);
                    // Retry strategy handled by next cron or explicit timeout
                    setTimeout(() => this.startBackgroundWorker(), 10000);
                } else {
                    logger.info('AI Worker Process stopped clean.');
                    this.aiProcess = null;
                }
            });

        } catch (error) {
            logger.error('❌ Failed to spawn AI Worker:', error);
        }
    }

    /**
     * Fetches all articles from the database.
     * @returns {Promise<ProcessedArticleData[]>} Array of all articles.
     */
    public static async fetchDatabaseRss(): Promise<ProcessedArticleData[]> {
        const result = await RssRepository.fetchAll();
        return result.articles;
    }
}
