import { pipeline, env } from '@xenova/transformers';
import logger from '@/utils/logger';

// Configure cache location to avoid re-downloading models in docker/tmp
env.cacheDir = './models_cache';

interface SentimentResult {
    label: 'POSITIVE' | 'NEGATIVE';
    score: number;
}

class AiService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private sentimentPipeline: any = null;
    private isInitialized = false;

    /**
     * Initialize the AI models.
     * This downloads the models locally if not present.
     */
    async init() {
        if (this.isInitialized) return;

        try {
            logger.info('🤖 Initializing AI models (loading from local or downloading)...');

            // Load sentiment analysis model
            // We use a small, fast model suitable for running on CPU
            this.sentimentPipeline = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');

            this.isInitialized = true;
            logger.info('✅ AI models initialized successfully');
        } catch (error) {
            logger.error('❌ Failed to initialize AI models:', error);
        }
    }

    /**
     * Analyze the sentiment of a text.
     * Returns 'POSITIVE' or 'NEGATIVE' with a score.
     */
    async analyzeSentiment(text: string): Promise<SentimentResult | null> {
        if (!this.isInitialized) await this.init();
        if (!this.sentimentPipeline) return null;

        try {
            // Truncate text if too long (models have token limits)
            const truncatedText = text.slice(0, 512);

            const result = await this.sentimentPipeline(truncatedText);
            // result is typically an array like [{ label: 'POSITIVE', score: 0.99 }]
            const output = Array.isArray(result) ? result[0] : result;

            return {
                label: output.label as 'POSITIVE' | 'NEGATIVE',
                score: output.score
            };
        } catch (error) {
            logger.error('Error analyzing sentiment:', error);
            return null;
        }
    }

    /**
     * Analyze an article (title + summary)
     */
    async analyzeArticle(title: string, summary: string | null): Promise<{ sentiment: 'bullish' | 'bearish', sentimentScore: number }> {
        const textToAnalyze = `${title}. ${summary || ''}`;

        // Sentiment
        const sentiment = await this.analyzeSentiment(textToAnalyze);

        // Future: Entity Extraction (NER)
        // const entities = await this.extractEntities(textToAnalyze);

        return {
            sentiment: sentiment?.label === 'POSITIVE' ? 'bullish' : 'bearish',
            sentimentScore: sentiment?.score || 0,
            // entities: [] 
        };
    }
}

export const aiService = new AiService();
