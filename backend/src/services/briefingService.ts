import { RssRepository } from '@/repositories/rssRepository';
import { aiService } from './aiService';
import { GlobalBriefing, BriefingSection } from '@/types/briefing';
import { ProcessedArticleData } from '@/types/rss';
import logger from '@/utils/logger';

export class BriefingService {
    /**
     * Generates a global briefing based on the top articles of the last 24 hours.
     */
    public static async generateDailyBriefing(userId: string): Promise<GlobalBriefing> {
        logger.info(`Generating global briefing for user ${userId}`);

        // 1. Fetch top articles
        const articles = await RssRepository.getTopArticlesForBriefing(20);

        if (articles.length === 0) {
            throw new Error('No articles found for briefing');
        }

        // 2. Group by category for structure
        const categories = Array.from(new Set(articles.map(a => a.category || 'General')));
        const sections: BriefingSection[] = [];

        for (const cat of categories) {
            const catArticles = articles.filter(a => (a.category || 'General') === cat).slice(0, 3);
            const textToSum = catArticles.map(a => `${a.title}: ${a.analysis?.iaSummary || a.summary || ''}`).join('\n\n');

            const summary = await aiService.summarize(textToSum) || 'No summary available for this section.';

            sections.push({
                title: cat,
                content: summary,
                articles: catArticles.map(a => ({
                    title: a.title,
                    link: a.link,
                    source: a.feedName || 'Unknown'
                }))
            });
        }

        // 3. Global Synthesis
        const fullText = sections.map(s => s.content).join('\n\n');
        const globalSummary = await aiService.summarize(fullText) || 'Flash briefing generated from today\'s top stories.';

        // 4. Determine Overall Sentiment
        const sentiments = articles.map(a => a.analysis?.sentiment).filter(Boolean);
        const bullishCount = sentiments.filter(s => s === 'bullish').length;
        const bearishCount = sentiments.filter(s => s === 'bearish').length;

        let marketSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        const totalSentiments = bullishCount + bearishCount;

        if (totalSentiments >= 5) { // Only assign strong sentiment if we have enough samples
            if (bullishCount > bearishCount * 1.4) marketSentiment = 'bullish';
            else if (bearishCount > bullishCount * 1.4) marketSentiment = 'bearish';
        }

        return {
            userId,
            date: new Date().toISOString().split('T')[0],
            summary: globalSummary,
            sections,
            marketSentiment,
            topTrends: this.extractTrends(articles),
            createdAt: new Date().toISOString()
        };
    }

    private static extractTrends(articles: ProcessedArticleData[]): string[] {
        const stopWords = new Set(['across', 'behind', 'between', 'through', 'without', 'against', 'already', 'because', 'before', 'during', 'should', 'would', 'could']);

        const words = articles.flatMap(a => a.title.split(' '))
            .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
            .filter(w => w.length > 4 && !stopWords.has(w));

        const freq: Record<string, number> = {};
        words.forEach(w => freq[w] = (freq[w] || 0) + 1);

        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
    }
}
