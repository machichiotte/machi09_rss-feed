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
    /** The predicted label: 'Positive', 'Neutral', or 'Negative' (or LABEL_X mapped) */
    label: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    /** The confidence score between 0 and 1 */
    score: number;
}

/**
 * Result mapping for business logic.
 */
interface ArticleAnalysis {
    /** Overall sentiment mapping */
    sentiment: 'bullish' | 'bearish' | 'neutral';
    /** Confidence score */
    sentimentScore: number;
    /** AI generated summary */
    iaSummary?: string;
    /** Whether the content is identified as promotional/spam */
    isPromotional?: boolean;
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

            // Load multilingual sentiment analysis model (BERT Multilingual Sentiment)
            if (!this.sentimentPipeline) {
                logger.info('🧠 Loading advanced sentiment engine (Xenova/bert-base-multilingual-uncased-sentiment)...');
                this.sentimentPipeline = await pipeline(
                    'sentiment-analysis',
                    'Xenova/bert-base-multilingual-uncased-sentiment'
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

            const sentimentOutput = output as Record<string, string | number>;
            return {
                label: this.mapRawLabel(String(sentimentOutput.label)),
                score: Number(sentimentOutput.score)
            };
        } catch (error) {
            logger.error('Error analyzing sentiment:', error);
            return null;
        }
    }

    /**
     * Maps raw model labels (LABEL_0, LABEL_1, etc.) to internal POSITIVE/NEUTRAL/NEGATIVE.
     */
    private mapRawLabel(rawLabel: string): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' {
        // Xenova/bert-base-multilingual-uncased-sentiment labels are "1 star" to "5 stars"
        if (rawLabel === '5 stars' || rawLabel === '4 stars') return 'POSITIVE';
        if (rawLabel === '3 stars') return 'NEUTRAL';
        if (rawLabel === '2 stars' || rawLabel === '1 star') return 'NEGATIVE';

        // Fallback for previous models or unexpected output
        if (rawLabel === 'POSITIVE' || rawLabel === 'LABEL_2') return 'POSITIVE';
        if (rawLabel === 'NEGATIVE' || rawLabel === 'LABEL_0') return 'NEGATIVE';
        return 'NEUTRAL';
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

                const preview = text.slice(0, 100).replace(/\n/g, ' ');
                logger.info(`📝 Summarizing: "${preview}..." (${text.length} chars)`);
                const result = await this.summarizationPipeline(text, {
                    max_new_tokens: 60,
                    min_new_tokens: 20,
                });

                const output = (Array.isArray(result) ? result[0] : result) as Record<string, string>;
                const summary = output?.summary_text || null;
                if (summary) {
                    logger.info(`   ✨ Summary: "${summary.slice(0, 80)}..."`);
                }
                return summary;
            } catch (error) {
                logger.error('Error during summarization:', error);
                return null;
            }
        });
    }

    /**
     * Helper to log translation with preview
     */
    private logTranslation(text: string, fromLang: string, toLang: string, translated: string | null): void {
        const preview = text.slice(0, 60).replace(/\n/g, ' ');
        logger.info(`🌐 Translating: '${preview}...' (${fromLang} → ${toLang})`);

        if (translated) {
            const translatedPreview = translated.slice(0, 60).replace(/\n/g, ' ');
            logger.info(`   ✅ Result: '${translatedPreview}...'`);
        }
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
                this.logTranslation(text, fromLang, toLang, null);

                const result = await this.translationPipeline(text, {
                    // @ts-ignore - src_lang and tgt_lang are valid for m2m100
                    src_lang,
                    tgt_lang
                });

                const output = (Array.isArray(result) ? result[0] : result) as Record<string, string>;
                const translated = output?.translation_text || null;

                this.logTranslation(text, fromLang, toLang, translated);

                return translated;
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

        // 2. Promotional Content Detection
        analysis.isPromotional = this.detectPromotionalContent(title, summaryText);

        // 3. Translations
        const translations = await this.translateArticle(
            title,
            iaSummary || summaryText,
            originalLang,
            targetLanguages
        );

        return { analysis, translations };
    }

    /**
     * Simple keyword-based promotional content detection.
     */
    private detectPromotionalContent(title: string, summary: string): boolean {
        const promoKeywords = [
            'sale', 'discount', 'limited offer', 'buy now', 'off', 'promo',
            'soldes', 'réduction', 'promotion', 'acheter', 'prix cassé',
            'giveaway', 'airdrop', 'whitelist', 'presale'
        ];
        const combined = `${title} ${summary}`.toLowerCase();
        return promoKeywords.some(keyword => combined.includes(keyword));
    }

    /**
     * Maps the AI sentiment result to ArticleAnalysis.
     */
    private mapSentiment(sentiment: SentimentResult | null, iaSummary: string | null): ArticleAnalysis {
        let sentimentLabel: 'bullish' | 'bearish' | 'neutral' = 'neutral';

        if (sentiment?.label === 'POSITIVE') sentimentLabel = 'bullish';
        else if (sentiment?.label === 'NEGATIVE') sentimentLabel = 'bearish';
        else sentimentLabel = 'neutral';

        return {
            sentiment: sentimentLabel,
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
