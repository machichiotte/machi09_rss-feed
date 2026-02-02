import Parser from 'rss-parser';
import { fork, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { RssRepository } from '@/repositories/rssRepository';
import { ProcessedArticleData, RssFeedConfig } from '@/types/rss';
import { generateSourceColor } from '@/utils/colors';
import logger from '@/utils/logger';
import { SourceRepository } from '@/repositories/sourceRepository';

// ESM compatibility for __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RssItem {
    title?: string;
    link?: string;
    contentSnippet?: string;
    content?: string;
    isoDate?: string;
    pubDate?: string;
    author?: string;
    creator?: string;
    enclosure?: { url?: string };
    'media:content'?: { $: { url?: string } };
    'media:thumbnail'?: { $: { url?: string } };
}

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

        // 1. Fetch enabled sources from DB
        const enabledSourcesByCategory = await SourceRepository.getEnabledSources();
        const allFeeds: { feed: RssFeedConfig; category: string }[] = [];

        for (const [category, sources] of Object.entries(enabledSourcesByCategory)) {
            for (const source of sources) {
                allFeeds.push({
                    feed: {
                        name: source.name,
                        url: source.url || '',
                        enabled: source.enabled,
                        language: source.language as 'en' | 'fr' | 'es' | 'de' | 'pt' | 'ar' | 'zh' | 'ja',
                        color: source.color,
                        maxArticles: source.maxArticles
                    },
                    category
                });
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
    private static extractImageUrl(item: RssItem): string | null {
        if (item.enclosure?.url) return item.enclosure.url;
        if (item['media:content']?.$.url) return item['media:content'].$.url;
        if (item['media:thumbnail']?.$.url) return item['media:thumbnail'].$.url;
        return null;
    }

    private static async fetchFeedOnly(feed: RssFeedConfig, category: string): Promise<number> {
        try {
            const rssFeed = await parser.parseURL(feed.url);
            let newCount = 0;

            const items = feed.maxArticles ? rssFeed.items.slice(0, feed.maxArticles) : rssFeed.items;

            for (const item of items) {
                if (await this.processSingleItem(item, feed, category)) {
                    newCount++;
                }
            }
            return newCount;
        } catch (error: unknown) { // Explicitly type error as unknown
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Error fetching feed ${feed.name}: ${errorMessage}`);
            return 0;
        }
    }

    private static async processSingleItem(item: RssItem, feed: RssFeedConfig, category: string): Promise<boolean> {
        if (!item.link || await RssRepository.findByLink(item.link)) {
            return false;
        }

        const article = this.mapToArticleData(item, feed, category);
        await RssRepository.save(article);
        return true;
    }

    private static mapToArticleData(item: RssItem, feed: RssFeedConfig, category: string): ProcessedArticleData {
        return {
            title: item.title ?? 'No title',
            link: item.link ?? '',
            publicationDate: this.extractDates(item),
            sourceFeed: feed.url,
            feedName: feed.name,
            category,
            language: feed.language ?? 'en',
            fetchedAt: new Date().toISOString(),
            processedAt: new Date().toISOString(),
            summary: this.extractSummary(item),
            imageUrl: this.extractImageUrl(item),
            author: this.extractAuthor(item),
            sourceColor: feed.color ?? generateSourceColor(feed.name),
            analysis: undefined,
            error: null,
            scrapedContent: false,
            fullText: null
        };
    }

    private static extractDates(item: RssItem): string | null {
        return item.isoDate ?? item.pubDate ?? null;
    }

    private static extractSummary(item: RssItem): string | null {
        return item.contentSnippet ?? item.content ?? null;
    }

    private static extractAuthor(item: RssItem): string | null {
        return item.creator ?? item.author ?? null;
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
