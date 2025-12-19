import { pipeline, env, TextClassificationPipeline, SummarizationPipeline } from '@xenova/transformers';
import logger from '@/utils/logger';

// Configure cache location to avoid re-downloading models in docker/tmp
env.cacheDir = './models_cache';

/**
 * Result of a sentiment analysis operation.
 */
interface SentimentResult {
    /** The predicted label: 'POSITIVE' or 'NEGATIVE' */
    label: 'POSITIVE' | 'NEGATIVE';
    /** The confidence score between 0 and 1 */
    score: number;
}

/**
 * Result mapping for business logic.
 */
interface ArticleAnalysis {
    /** Overall sentiment mapping */
    sentiment: 'bullish' | 'bearish';
    /** Confidence score */
    sentimentScore: number;
    /** AI generated summary */
    iaSummary?: string;
}

/**
 * Service responsible for AI-powered analysis of RSS content.
 * Uses local Transformers.js models for privacy and performance.
 */
class AiService {
    /** The Transformers.js sentiment pipeline instance */
    private sentimentPipeline: TextClassificationPipeline | null = null;
    /** The Transformers.js summarization pipeline instance */
    private summarizationPipeline: SummarizationPipeline | null = null;
    /** Guard to prevent multiple simultaneous initializations */
    private isInitialized = false;

    /**
     * Initializes the AI models.
     * This may download the model to the local cache if it's the first run.
     * @returns {Promise<void>}
     */
    async init(): Promise<void> {
        if (this.isInitialized && this.sentimentPipeline && this.summarizationPipeline) return;

        try {
            logger.info('🤖 Initializing AI models (loading from local or downloading)...');

            // Load sentiment analysis model
            if (!this.sentimentPipeline) {
                this.sentimentPipeline = await pipeline(
                    'sentiment-analysis',
                    'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
                ) as TextClassificationPipeline;
            }

            // Load summarization model (More powerful engine)
            if (!this.summarizationPipeline) {
                logger.info('📚 Loading translation/summarization engine (Xenova/distilbart-cnn-6-6)...');
                this.summarizationPipeline = await pipeline(
                    'summarization',
                    'Xenova/distilbart-cnn-6-6'
                ) as SummarizationPipeline;
            }

            this.isInitialized = true;
            logger.info('✅ AI models initialized successfully');
        } catch (error) {
            logger.error('❌ Failed to initialize AI models:', error);
            throw error;
        }
    }

    /**
     * Analyze the sentiment of a text.
     * Returns 'POSITIVE' or 'NEGATIVE' with a confidence score.
     * 
     * @param {string} text - The content to analyze.
     * @returns {Promise<SentimentResult | null>}
     */
    async analyzeSentiment(text: string): Promise<SentimentResult | null> {
        if (!this.isInitialized) await this.init();
        if (!this.sentimentPipeline) return null;

        try {
            // Truncate text if too long (models have token limits)
            const truncatedText = text.slice(0, 512);

            const result = await this.sentimentPipeline(truncatedText);

            // Transformers.js pipelines can return nested arrays depending on the input.
            // For a single string, it typically returns TextClassificationSingle[].
            // We need to unwrap it to get the individual result object.
            const output = Array.isArray(result)
                ? (Array.isArray(result[0]) ? result[0][0] : result[0])
                : result;

            // Ensure we have a valid result object with the expected properties
            if (!output || typeof output !== 'object' || !('label' in output)) {
                logger.error('Unexpected output format from sentiment pipeline:', output);
                return null;
            }

            return {
                label: output.label as 'POSITIVE' | 'NEGATIVE',
                score: output.score as number
            };
        } catch (error) {
            logger.error('Error analyzing sentiment:', error);
            return null;
        }
    }

    /**
     * Summarize a text using the local AI model.
     * 
     * @param {string} text - The content to summarize.
     * @returns {Promise<string | null>}
     */
    async summarize(text: string): Promise<string | null> {
        if (!this.isInitialized) await this.init();
        if (!this.summarizationPipeline) return null;

        try {
            // Only summarize if text is long enough to be interesting
            if (text.length < 200) return null;

            logger.info(`📝 Summarizing text (${text.length} chars)...`);
            const result = await this.summarizationPipeline(text, {
                max_new_tokens: 60,
                min_new_tokens: 20,
            });

            const output = Array.isArray(result) ? result[0] : result;
            return output.summary_text || null;
        } catch (error) {
            logger.error('Error during summarization:', error);
            return null;
        }
    }

    /**
     * Performs a full analysis of an article (title + summary).
     * Maps the underlying model output to business-level bullish/bearish signals.
     * Also generates a higher-quality AI summary if possible.
     * 
     * @param {string} title - The article title.
     * @param {string | null} summary - The article summary or content snippet.
     * @returns {Promise<ArticleAnalysis>}
     */
    async analyzeArticle(title: string, summary: string | null): Promise<ArticleAnalysis> {
        const textToAnalyze = `${title}. ${summary || ''}`;

        // Parallel processing for performance
        const [sentiment, iaSummary] = await Promise.all([
            this.analyzeSentiment(textToAnalyze),
            summary ? this.summarize(`${title}. ${summary}`) : Promise.resolve(null)
        ]);

        return {
            sentiment: sentiment?.label === 'POSITIVE' ? 'bullish' : 'bearish',
            sentimentScore: sentiment?.score || 0,
            iaSummary: iaSummary || undefined
        };
    }
}

export const aiService = new AiService();
