import { pipeline, env } from '@xenova/transformers';
import logger from '@/utils/logger';

// Configure cache location to avoid re-downloading models in docker/tmp
env.cacheDir = './models_cache';

class AiService {
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
    async analyzeSentiment(text: string): Promise<{ label: 'POSITIVE' | 'NEGATIVE'; score: number } | null> {
        if (!this.isInitialized) await this.init();
        if (!this.sentimentPipeline) return null;

        try {
            // Truncate text if too long (models have token limits)
            const truncatedText = text.slice(0, 512);

            const result = await this.sentimentPipeline(truncatedText);
            // result is like [{ label: 'POSITIVE', score: 0.99 }]
            return {
                label: result[0].label,
                score: result[0].score
            };
        } catch (error) {
            logger.error('Error analyzing sentiment:', error);
            return null;
        }
    }

    /**
     * Analyze an article (title + summary)
     */
    async analyzeArticle(title: string, summary: string | null) {
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
