import { RssCategoryConfig } from '@/types/rss';

export const rssConfig = {
    enabled: process.env.RSS_ENABLED === 'true',
    delayBetweenArticlesMs: parseInt(process.env.RSS_DELAY_BETWEEN_ARTICLES_MS || '2000'),
    delayBetweenFeedsMs: parseInt(process.env.RSS_DELAY_BETWEEN_FEEDS_MS || '5000'),
    minContentLengthForScraping: parseInt(process.env.RSS_MIN_CONTENT_LENGTH || '200'),
    scrapeRetryDelayMs: parseInt(process.env.RSS_SCRAPE_RETRY_DELAY_MS || '3000'),
    geminiRequestDelayMs: parseInt(process.env.GEMINI_REQUEST_DELAY_MS || '1000'),

    categories: {
        'Crypto News': [
            {
                name: 'CoinDesk',
                url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
                enabled: true,
            },
            {
                name: 'CoinTelegraph',
                url: 'https://cointelegraph.com/rss',
                enabled: true,
            },
            {
                name: 'Decrypt',
                url: 'https://decrypt.co/feed',
                enabled: true,
            },
        ],
        'Tech News': [
            {
                name: 'TechCrunch',
                url: 'https://techcrunch.com/feed/',
                enabled: true,
            },
            {
                name: 'The Verge',
                url: 'https://www.theverge.com/rss/index.xml',
                enabled: true,
            },
        ],
        'Finance': [
            {
                name: 'Bloomberg Crypto',
                url: 'https://www.bloomberg.com/crypto/rss',
                enabled: false, // Disabled by default
            },
        ],
    } as RssCategoryConfig,
};

export const databaseConfig = {
    collection: {
        rssArticles: 'rssArticles',
    },
};
