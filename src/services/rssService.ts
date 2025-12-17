// src/services/rssService.ts
import Parser from 'rss-parser';
import { RssRepository } from '@/repositories/rssRepository';
import { rssConfig } from '@/config/rssConfig';
import { ProcessedArticleData, RssFeedConfig } from '@/types/rss';
import logger from '@/utils/logger';

const parser = new Parser();

export class RssService {
    /**
     * Fetch and process all RSS feeds
     */
    public static async processAllFeeds(): Promise<{ processed: number; errors: number }> {
        logger.info('Starting RSS feed processing...');
        let processedCount = 0;
        let errorCount = 0;

        for (const [category, feeds] of Object.entries(rssConfig.categories)) {
            for (const feed of feeds) {
                if (!feed.enabled) {
                    logger.info(`Skipping disabled feed: ${feed.name}`);
                    continue;
                }

                try {
                    logger.info(`Processing feed: ${feed.name} (${category})`);
                    const count = await this.processFeed(feed, category);
                    processedCount += count;

                    // Delay between feeds
                    await this.delay(rssConfig.delayBetweenFeedsMs);
                } catch (error) {
                    logger.error(`Error processing feed ${feed.name}:`, error);
                    errorCount++;
                }
            }
        }

        logger.info(`RSS processing complete. Processed: ${processedCount}, Errors: ${errorCount}`);
        return { processed: processedCount, errors: errorCount };
    }

    /**
     * Process a single RSS feed
     */
    private static async processFeed(feed: RssFeedConfig, category: string): Promise<number> {
        const rssFeed = await parser.parseURL(feed.url);
        let count = 0;

        for (const item of rssFeed.items) {
            if (!item.link) continue;

            try {
                const article: ProcessedArticleData = {
                    title: item.title || 'No title',
                    link: item.link,
                    publicationDate: item.isoDate || item.pubDate || null,
                    sourceFeed: feed.url,
                    feedName: feed.name,
                    category: category,
                    fetchedAt: new Date().toISOString(),
                    processedAt: new Date().toISOString(),
                    summary: item.contentSnippet || item.content || null,
                    analysis: null,
                    error: null,
                    scrapedContent: false,
                };

                // Upsert article (insert if new, update if exists)
                const result = await RssRepository.upsertByLink(article);

                if (result.upserted) {
                    logger.info(`New article saved: ${article.title}`);
                    count++;
                } else if (result.updated) {
                    logger.info(`Article updated: ${article.title}`);
                }

                // Delay between articles
                await this.delay(rssConfig.delayBetweenArticlesMs);
            } catch (error) {
                logger.error(`Error processing article ${item.link}:`, error);
            }
        }

        return count;
    }

    /**
     * Fetch all articles from database
     */
    public static async fetchDatabaseRss(): Promise<ProcessedArticleData[]> {
        return await RssRepository.fetchAll();
    }

    /**
     * Utility delay function
     */
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
