// src/services/analyticsService.ts
import { getDatabase } from '@/config/database';
import { ProcessedArticleData } from '@/types/rss';

interface SentimentDistribution {
    total: number;
    distribution: {
        bullish: number;
        bearish: number;
        neutral: number;
    };
    bySource: Record<string, {
        bullish: number;
        bearish: number;
        neutral: number;
    }>;
}

interface TopicData {
    keyword: string;
    count: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface TimelinePoint {
    date: string;
    bullish: number;
    bearish: number;
    neutral: number;
}

export class AnalyticsService {
    /**
     * Get sentiment distribution across articles
     */
    public static async getSentimentDistribution(
        dateRange: 'today' | 'week' | 'month' | 'all' = 'all',
        category?: string,
        source?: string
    ): Promise<SentimentDistribution> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>('rssArticles');

        const dateFilter = this.buildDateFilter(dateRange);
        const filter: Record<string, unknown> = { ...dateFilter };

        if (category) filter.category = category;
        if (source) filter.feedName = source;

        // Only count articles with analysis
        filter['analysis.sentiment'] = { $exists: true };

        const articles = await collection.find(filter).toArray();

        const distribution = {
            bullish: 0,
            bearish: 0,
            neutral: 0
        };

        const bySource: Record<string, { bullish: number; bearish: number; neutral: number }> = {};

        for (const article of articles) {
            const sentiment = article.analysis?.sentiment || 'neutral';
            distribution[sentiment]++;

            const sourceName = article.feedName || 'Unknown';
            if (!bySource[sourceName]) {
                bySource[sourceName] = { bullish: 0, bearish: 0, neutral: 0 };
            }
            bySource[sourceName][sentiment]++;
        }

        return {
            total: articles.length,
            distribution,
            bySource
        };
    }

    /**
     * Extract and rank hot topics from articles
     */
    public static async getHotTopics(
        dateRange: 'today' | 'week' | 'month' | 'all' = 'all',
        category?: string,
        source?: string,
        limit = 50
    ): Promise<{ topics: TopicData[] }> {
        const articles = await this.fetchArticles(dateRange, category, source);
        const keywordCounts = this.countKeywords(articles);
        const topics = this.rankTopics(keywordCounts, limit);

        return { topics };
    }

    private static async fetchArticles(dateRange: string, category?: string, source?: string) {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>('rssArticles');
        const dateFilter = this.buildDateFilter(dateRange);
        const filter: Record<string, unknown> = { ...dateFilter };

        if (category) filter.category = category;
        if (source) filter.feedName = source;

        return await collection.find(filter).toArray();
    }

    private static countKeywords(articles: ProcessedArticleData[]) {
        const keywordCounts = new Map<string, { count: number; sentiments: string[] }>();
        const stopWords = this.getStopWords();

        for (const article of articles) {
            const text = `${article.title} ${article.summary || ''}`.toLowerCase();
            const words = text.match(/\b[a-zàâäéèêëïîôùûüÿæœç]{3,}\b/gi) || [];
            const sentiment = article.analysis?.sentiment || 'neutral';

            for (const word of words) {
                const normalized = word.toLowerCase();
                if (stopWords.has(normalized)) continue;

                if (!keywordCounts.has(normalized)) {
                    keywordCounts.set(normalized, { count: 0, sentiments: [] });
                }
                const data = keywordCounts.get(normalized)!;
                data.count++;
                data.sentiments.push(sentiment);
            }
        }
        return keywordCounts;
    }

    private static rankTopics(keywordCounts: Map<string, { count: number; sentiments: string[] }>, limit: number): TopicData[] {
        return Array.from(keywordCounts.entries())
            .map(([keyword, data]) => {
                const sentimentCounts = {
                    bullish: data.sentiments.filter(s => s === 'bullish').length,
                    bearish: data.sentiments.filter(s => s === 'bearish').length,
                    neutral: data.sentiments.filter(s => s === 'neutral').length
                };

                const dominantSentiment = Object.entries(sentimentCounts)
                    .sort(([, a], [, b]) => b - a)[0][0] as 'bullish' | 'bearish' | 'neutral';

                return {
                    keyword,
                    count: data.count,
                    sentiment: dominantSentiment
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Get sentiment timeline data
     */
    public static async getTimeline(
        dateRange: 'today' | 'week' | 'month' | 'all' = 'week',
        category?: string,
        source?: string,
        granularity: 'hour' | 'day' | 'week' = 'day'
    ): Promise<{ timeline: TimelinePoint[] }> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>('rssArticles');

        const dateFilter = this.buildDateFilter(dateRange);
        const filter: Record<string, unknown> = { ...dateFilter };

        if (category) filter.category = category;
        if (source) filter.feedName = source;
        filter['analysis.sentiment'] = { $exists: true };

        const articles = await collection.find(filter).sort({ publicationDate: 1 }).toArray();
        const timelineMap = this.groupArticlesByTime(articles, granularity);

        const timeline = Array.from(timelineMap.entries())
            .map(([date, counts]) => ({
                date,
                ...counts
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return { timeline };
    }

    private static groupArticlesByTime(articles: ProcessedArticleData[], granularity: 'hour' | 'day' | 'week') {
        const timelineMap = new Map<string, { bullish: number; bearish: number; neutral: number }>();

        for (const article of articles) {
            const date = article.publicationDate || article.fetchedAt;
            if (!date) continue;

            const timeKey = this.getTimeKey(new Date(date), granularity);
            const sentiment = article.analysis?.sentiment || 'neutral';

            if (!timelineMap.has(timeKey)) {
                timelineMap.set(timeKey, { bullish: 0, bearish: 0, neutral: 0 });
            }
            timelineMap.get(timeKey)![sentiment]++;
        }
        return timelineMap;
    }

    /**
     * Build MongoDB date filter based on range
     */
    private static buildDateFilter(dateRange: string): Record<string, unknown> {
        const now = new Date();
        let startDate: Date;

        switch (dateRange) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                return {};
        }

        return {
            $or: [
                { publicationDate: { $gte: startDate.toISOString() } },
                { fetchedAt: { $gte: startDate.toISOString() } }
            ]
        };
    }

    /**
     * Get time key for grouping based on granularity
     */
    private static getTimeKey(date: Date, granularity: 'hour' | 'day' | 'week'): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        switch (granularity) {
            case 'hour': {
                const hour = String(date.getHours()).padStart(2, '0');
                return `${year}-${month}-${day}T${hour}:00`;
            }
            case 'day':
                return `${year}-${month}-${day}`;
            case 'week': {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const wYear = weekStart.getFullYear();
                const wMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
                const wDay = String(weekStart.getDate()).padStart(2, '0');
                return `${wYear}-${wMonth}-${wDay}`;
            }
            default:
                return `${year}-${month}-${day}`;
        }
    }

    /**
     * Get common stop words to filter out
     */
    private static getStopWords(): Set<string> {
        return new Set([
            // French
            'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais', 'donc',
            'car', 'ni', 'que', 'qui', 'quoi', 'dont', 'où', 'ce', 'cet', 'cette', 'ces',
            'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses', 'notre', 'votre',
            'leur', 'nos', 'vos', 'leurs', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils',
            'elles', 'on', 'me', 'te', 'se', 'lui', 'leur', 'eux', 'dans', 'sur', 'sous',
            'avec', 'sans', 'pour', 'par', 'vers', 'chez', 'contre', 'entre', 'parmi',
            'selon', 'pendant', 'depuis', 'avant', 'après', 'devant', 'derrière', 'au',
            'aux', 'à', 'en', 'y', 'plus', 'moins', 'très', 'trop', 'assez', 'peu', 'bien',
            'mal', 'mieux', 'pire', 'aussi', 'comme', 'comment', 'quand', 'pourquoi',
            'est', 'sont', 'était', 'étaient', 'été', 'être', 'avoir', 'avait', 'avaient',
            'eu', 'fait', 'faire', 'dit', 'dire', 'peut', 'peuvent', 'doit', 'doivent',
            'va', 'vont', 'aller', 'venir', 'vient', 'viennent', 'tout', 'tous', 'toute',
            'toutes', 'autre', 'autres', 'même', 'mêmes', 'tel', 'telle', 'tels', 'telles',
            'quel', 'quelle', 'quels', 'quelles', 'quelque', 'quelques', 'chaque', 'plusieurs',
            'certains', 'certaines', 'aucun', 'aucune', 'nul', 'nulle', 'pas', 'jamais',
            'rien', 'personne', 'aucunement', 'nullement', 'encore', 'déjà', 'toujours',
            'souvent', 'parfois', 'quelquefois', 'rarement', 'jamais', 'hier', 'aujourd',
            'hui', 'demain', 'maintenant', 'alors', 'ensuite', 'puis', 'enfin', 'ainsi',
            'donc', 'cependant', 'pourtant', 'néanmoins', 'toutefois', 'sinon', 'autrement',
            // English
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
            'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then',
            'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each',
            'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
            'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should',
            'now', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'been',
            'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would',
            'could', 'ought', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their',
            'what', 'which', 'who', 'whom', 'whose', 'if', 'because', 'as', 'until', 'while',
            'get', 'got', 'getting', 'gets', 'new', 'old', 'first', 'last', 'long', 'great',
            'little', 'good', 'bad', 'high', 'low', 'large', 'small', 'big', 'next', 'early',
            'young', 'important', 'public', 'able', 'back', 'come', 'came', 'coming', 'comes'
        ]);
    }
}
