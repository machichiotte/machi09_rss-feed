// src/services/rssService.ts
import Parser from 'rss-parser';
import { RssRepository } from '@/repositories/rssRepository';
import { rssConfig } from '@/config/rssConfig';
import { ProcessedArticleData, RssFeedConfig } from '@/types/rss';
import logger from '@/utils/logger';
import { aiService } from './aiService';

const parser = new Parser({
    timeout: 20000, // 20 seconds timeout
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8'
    }
});

export class RssService {
    private static isAnalyzing = false;

    /**
     * Orchestrates the fetching and processing of all enabled RSS feeds from configuration.
     * This process is optimized with batching and background AI analysis.
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
                    logger.info(`📡 Fetching feed: ${feed.name} (${category})`);
                    return await this.fetchFeedOnly(feed, category);
                } catch (error) {
                    logger.error(`❌ Error fetching feed ${feed.name}:`, error);
                    errorCount++;
                    return 0;
                }
            });

            const results = await Promise.all(batchPromises);
            processedCount += results.reduce((acc, val) => acc + val, 0);
        }

        logger.info(`✅ Fetching complete. ${processedCount} new articles found.`);

        // 2. Start AI Analysis in background
        this.runBackgroundAnalysis();

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
     * Background worker that continuously processes pending articles for AI analysis.
     * Uses a lock (isAnalyzing) to ensure only one worker runs at a time.
     * @returns {Promise<void>}
     */
    private static async runBackgroundAnalysis(): Promise<void> {
        if (this.isAnalyzing) {
            logger.info('⏳ Analysis worker already running, skipping.');
            return;
        }

        this.isAnalyzing = true;
        try {
            await aiService.init();

            while (true) {
                const pending = await RssRepository.findPendingAnalysis(20);
                if (pending.length === 0) break;

                logger.info(`🧠 AI Worker: Processing batch of ${pending.length} pending articles...`);

                for (const article of pending) {
                    try {
                        const analysis = await aiService.analyzeArticle(article.title, article.summary || '');
                        await RssRepository.updateById(article._id!, {
                            analysis,
                            processedAt: new Date().toISOString()
                        });

                        // Keep a small delay to avoid excessive CPU usage
                        await this.delay(200);
                    } catch (error) {
                        logger.error(`❌ AI Error on article ${article.link}:`, error);
                        await RssRepository.updateById(article._id!, {
                            analysis: { sentiment: 'bearish', sentimentScore: 0 },
                            error: 'AI analysis failed'
                        });
                    }
                }
            }
            logger.info('✨ AI Analysis complete.');
        } catch (error) {
            logger.error('❌ AI Worker crashed:', error);
        } finally {
            this.isAnalyzing = false;
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

    /**
     * Utility method to pause execution for a given time.
     * @param {number} ms - Milliseconds to delay.
     * @returns {Promise<void>}
     */
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
