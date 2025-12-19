import { pipeline, env, TextClassificationPipeline, SummarizationPipeline, TranslationPipeline } from '@xenova/transformers';
import logger from '@/utils/logger';

// Configure cache location to avoid re-downloading models in docker/tmp
env.cacheDir = './models_cache';

const M2M100_MAP: Record<string, string> = {
    'en': 'en',
    'fr': 'fr',
    'es': 'es',
    'ar': 'ar',
    'de': 'de',
    'it': 'it',
    'pt': 'pt',
    'ru': 'ru',
    'zh': 'zh',
    'ja': 'ja',
    'cn': 'zh'
};

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
 * Result of a translation operation for a single language.
 */
interface TranslationResult {
    title: string;
    summary: string;
}

/**
 * Map of language codes to their translated content.
 */
type ArticleTranslations = Record<string, TranslationResult>;

/**
 * Service responsible for AI-powered analysis of RSS content.
 * Uses local Transformers.js models for privacy and performance.
 */
class AiService {
    /** The Transformers.js sentiment pipeline instance */
    private sentimentPipeline: TextClassificationPipeline | null = null;
    /** The Transformers.js summarization pipeline instance */
    private summarizationPipeline: SummarizationPipeline | null = null;
    /** The Transformers.js translation pipeline instance */
    private translationPipeline: TranslationPipeline | null = null;
    /** Guard to prevent multiple simultaneous initializations */
    private isInitialized = false;
    /** Sequential execution lock for heavy AI tasks */
    private executionLock: Promise<void> = Promise.resolve();

    /**
     * Helper to run a heavy task sequentially without blocking the event loop indefinitely.
     */
    private async enqueue<T>(task: () => Promise<T>): Promise<T> {
        const result = this.executionLock.then(() => task());
        this.executionLock = result.then(() => { }).catch(() => { });
        return result;
    }

    /**
     * Initializes the AI models.
     * This may download the model to the local cache if it's the first run.
     * @returns {Promise<void>}
     */
    async init(): Promise<void> {
        if (this.isInitialized && this.sentimentPipeline && this.summarizationPipeline && this.translationPipeline) return;

        try {
            logger.info('🤖 Initializing AI models (loading from local or downloading)...');

            // Load sentiment analysis model
            if (!this.sentimentPipeline) {
                this.sentimentPipeline = await pipeline(
                    'sentiment-analysis',
                    'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
                ) as TextClassificationPipeline;
            }

            // Load summarization model
            if (!this.summarizationPipeline) {
                logger.info('📚 Loading summarization engine (Xenova/distilbart-cnn-6-6)...');
                this.summarizationPipeline = await pipeline(
                    'summarization',
                    'Xenova/distilbart-cnn-6-6'
                ) as SummarizationPipeline;
            }

            // Load translation model (M2M-100)
            if (!this.translationPipeline) {
                logger.info('🌐 Loading translation engine (Xenova/m2m100_418M)...');
                this.translationPipeline = await pipeline(
                    'translation',
                    'Xenova/m2m100_418M'
                ) as TranslationPipeline;
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
        return this.enqueue(async () => {
            if (!this.isInitialized) await this.init();
            if (!this.summarizationPipeline) return null;

            try {
                if (text.length < 200) return null;

                logger.info(`📝 Summarizing text (${text.length} chars)...`);
                const result = await this.summarizationPipeline(text, {
                    max_new_tokens: 60,
                    min_new_tokens: 20,
                });

                const output = (Array.isArray(result) ? result[0] : result) as Record<string, string>;
                return output?.summary_text || null;
            } catch (error) {
                logger.error('Error during summarization:', error);
                return null;
            }
        });
    }

    /**
     * Translates a text between two languages.
     * 
     * @param {string} text - The content to translate.
     * @param {string} fromLang - Source language code (ex: 'en').
     * @param {string} toLang - Target language code (ex: 'fr').
     * @returns {Promise<string | null>}
     */
    async translate(text: string, fromLang: string, toLang: string): Promise<string | null> {
        return this.enqueue(async () => {
            if (!this.isInitialized) await this.init();
            if (!this.translationPipeline) return null;
            if (fromLang === toLang) return text;

            const src_lang = M2M100_MAP[fromLang] || 'eng_Latn';
            const tgt_lang = M2M100_MAP[toLang];

            if (!tgt_lang) {
                logger.warn(`⚠️ Unsupported target language for translation: ${toLang}`);
                return null;
            }

            try {
                logger.info(`🌐 Translating from ${fromLang} to ${toLang}...`);
                const result = await this.translationPipeline(text, {
                    // @ts-ignore - src_lang and tgt_lang are valid for m2m100
                    src_lang,
                    tgt_lang
                });

                const output = (Array.isArray(result) ? result[0] : result) as Record<string, string>;
                return output?.translation_text || null;
            } catch (error) {
                logger.error(`Error translating from ${fromLang} to ${toLang}:`, error);
                return null;
            }
        });
    }

    /**
     * Performs a full analysis of an article (title + summary).
     * Maps the underlying model output to business-level bullish/bearish signals.
     * Also generates a higher-quality AI summary and translations if requested.
     * 
     * @param {string} title - The article title.
     * @param {string | null} summary - The article summary snippet.
     * @param {string} originalLang - The original language of the article.
     * @param {string[]} targetLanguages - Languages to translate the article into.
     * @returns {Promise<{ analysis: ArticleAnalysis; translations: any }>}
     */
    async analyzeArticle(
        title: string,
        summary: string | null,
        originalLang: string = 'en',
        targetLanguages: string[] = ['fr', 'ar']
    ): Promise<{ analysis: ArticleAnalysis; translations: ArticleTranslations }> {
        const textToAnalyze = `${title}. ${summary || ''}`;
        const summaryText = summary || '';

        // 1. Parallel Task: Sentiment + Summarization
        const [sentiment, iaSummary] = await Promise.all([
            this.analyzeSentiment(textToAnalyze),
            summary ? this.summarize(`${title}. ${summaryText}`) : Promise.resolve(null)
        ]);

        const analysis = this.mapSentiment(sentiment, iaSummary);

        // 2. Translations
        const translations = await this.translateArticle(
            title,
            iaSummary || summaryText,
            originalLang,
            targetLanguages
        );

        return { analysis, translations };
    }

    /**
     * Maps the AI sentiment result to ArticleAnalysis.
     */
    private mapSentiment(sentiment: SentimentResult | null, iaSummary: string | null): ArticleAnalysis {
        return {
            sentiment: sentiment?.label === 'POSITIVE' ? 'bullish' : 'bearish',
            sentimentScore: sentiment?.score || 0,
            iaSummary: iaSummary || undefined
        };
    }

    /**
     * Translates an article title and summary into multiple target languages.
     */
    private async translateArticle(
        title: string,
        summary: string,
        originalLang: string,
        targetLanguages: string[]
    ): Promise<ArticleTranslations> {
        const translations: ArticleTranslations = {};

        const translationPromises = targetLanguages
            .filter(lang => lang !== originalLang)
            .map(async (lang) => {
                const [tTitle, tSummary] = await Promise.all([
                    this.translate(title, originalLang, lang),
                    this.translate(summary, originalLang, lang)
                ]);

                if (tTitle && tSummary) {
                    translations[lang] = {
                        title: tTitle,
                        summary: tSummary
                    };
                }
            });

        await Promise.all(translationPromises);
        return translations;
    }
}

export const aiService = new AiService();
