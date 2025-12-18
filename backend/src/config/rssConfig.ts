import { RssCategoryConfig } from '@/types/rss';
import { rssSources } from './sources';

export const rssConfig = {
    enabled: process.env.RSS_ENABLED === 'true',
    delayBetweenArticlesMs: parseInt(process.env.RSS_DELAY_BETWEEN_ARTICLES_MS || '2000'),
    delayBetweenFeedsMs: parseInt(process.env.RSS_DELAY_BETWEEN_FEEDS_MS || '5000'),
    minContentLengthForScraping: parseInt(process.env.RSS_MIN_CONTENT_LENGTH || '250'),
    scrapeRetryDelayMs: parseInt(process.env.RSS_SCRAPE_RETRY_DELAY_MS || '1000'),
    geminiRequestDelayMs: parseInt(process.env.GEMINI_REQUEST_DELAY_MS || '8000'),

    categories: rssSources,
};

export const databaseConfig = {
    collection: {
        rssArticles: 'rssArticles',
    },
};
