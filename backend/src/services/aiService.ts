import { pipeline, env, TextClassificationPipeline, SummarizationPipeline, TranslationPipeline, TokenClassificationPipeline } from '@xenova/transformers';
import { performance } from 'node:perf_hooks';
import os from 'node:os';
import logger from '@/utils/logger';
import { ArticleEntity, FinancialAnalysis as ArticleAnalysis } from '@/types/rss';

// Configure cache location and hardware limits
env.cacheDir = './models_cache';

// Limit threads to half of available CPUs to leave room for the rest of the app
const cpuCount = os.cpus().length;
const allowedThreads = Math.max(1, Math.floor(cpuCount / 2));
env.onnx.numThreads = allowedThreads;

logger.info(`🖥️ System: ${cpuCount} CPUs detected. Limiting AI engine to ${allowedThreads} threads.`);

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

const SUPPORTED_TARGET_LANGS = Object.keys(M2M100_MAP);

// MODEL CONFIGURATION (Easy to change)
const MODELS = {
    SENTIMENT: 'Xenova/bert-base-multilingual-uncased-sentiment',
    SUMMARIZATION: 'Xenova/distilbart-cnn-6-6',
    TRANSLATION: 'Xenova/m2m100_418M',
    NER: 'Xenova/bert-base-multilingual-cased-ner-hrl'
};

/**
 * Result of a sentiment analysis operation.
 */
export interface SentimentResult {
    /** The predicted label: 'Positive', 'Neutral', or 'Negative' (or LABEL_X mapped) */
    label: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    /** The confidence score between 0 and 1 */
    score: number;
}

// Local translation result type (not in shared types yet)
interface TranslationResult {
    title: string;
    summary: string;
}

/**
 * Map of language codes to their translated content.
 */
type ArticleTranslations = Record<string, TranslationResult>;

/**
 * Raw result from NER pipeline.
 */
interface NerResult {
    entity: string;
    score: number;
    index: number;
    word: string;
    start: number | null;
    end: number | null;
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
    /** The Transformers.js translation pipeline instance */
    private translationPipeline: TranslationPipeline | null = null;
    /** The Transformers.js NER pipeline instance */
    private nerPipeline: TokenClassificationPipeline | null = null;
    /** Guard to prevent multiple simultaneous initializations */
    private isInitialized = false;

    /**
     * Initializes the AI models.
     * This may download the model to the local cache if it's the first run.
     * @returns {Promise<void>}
     */
    async init(): Promise<void> {
        if (this.isInitialized && this.sentimentPipeline && this.summarizationPipeline && this.translationPipeline) return;

        try {
            logger.info('🤖 Initializing AI models (loading from local or downloading)...');

            // Load multilingual sentiment analysis model
            if (!this.sentimentPipeline) {
                logger.info('🧠 Loading advanced sentiment engine (Xenova/bert-base-multilingual-uncased-sentiment)...');
                this.sentimentPipeline = await pipeline(
                    'sentiment-analysis',
                    MODELS.SENTIMENT,
                    { quantized: true }
                ) as TextClassificationPipeline;
            }

            // Load summarization model
            if (!this.summarizationPipeline) {
                logger.info(`📚 Loading summarization engine (${MODELS.SUMMARIZATION})...`);
                this.summarizationPipeline = await pipeline(
                    'summarization',
                    MODELS.SUMMARIZATION,
                    { quantized: true }
                ) as SummarizationPipeline;
            }

            // Load translation model (M2M-100) - Keeping it but it's now bypassed
            if (!this.translationPipeline) {
                logger.info(`🌐 Loading translation engine (${MODELS.TRANSLATION})...`);
                this.translationPipeline = await pipeline(
                    'translation',
                    MODELS.TRANSLATION,
                    { quantized: true }
                ) as TranslationPipeline;
            }

            // Load NER model
            if (!this.nerPipeline) {
                logger.info('🏷️ Loading NER engine (Xenova/bert-base-multilingual-cased-ner-hrl)...');
                this.nerPipeline = await pipeline(
                    'token-classification',
                    'Xenova/bert-base-multilingual-cased-ner-hrl',
                    { quantized: true }
                ) as TokenClassificationPipeline;
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
     */
    async analyzeSentiment(text: string): Promise<SentimentResult | null> {
        if (!this.isInitialized) await this.init();
        if (!this.sentimentPipeline) return null;

        try {
            const start = performance.now();
            const truncatedText = text.slice(0, 1024);
            logger.info('   [AI] Starting sentiment analysis...');
            const result = await this.sentimentPipeline(truncatedText);
            const output = Array.isArray(result)
                ? (Array.isArray(result[0]) ? result[0][0] : result[0])
                : result;

            if (!output || typeof output !== 'object' || !('label' in output)) return null;

            const duration = (performance.now() - start).toFixed(0);
            const sentimentOutput = output as Record<string, string | number>;
            const rawLabel = String(sentimentOutput.label);
            const mappedSentiment = this.mapSentimentLabel({ label: this.mapRawLabel(rawLabel), score: Number(sentimentOutput.score) });
            logger.info(`   [AI] Sentiment analysis finished in ${duration}ms -> Result: ${mappedSentiment} (score: ${Number(sentimentOutput.score).toFixed(2)})`);

            return {
                label: this.mapRawLabel(rawLabel),
                score: Number(sentimentOutput.score)
            };
        } catch (error) {
            logger.error('Error analyzing sentiment:', error);
            return null;
        }
    }

    private mapRawLabel(rawLabel: string): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' {
        if (rawLabel === '5 stars' || rawLabel === '4 stars') return 'POSITIVE';
        if (rawLabel === '3 stars') return 'NEUTRAL';
        if (rawLabel === '2 stars' || rawLabel === '1 star') return 'NEGATIVE';
        if (rawLabel === 'POSITIVE' || rawLabel === 'LABEL_2') return 'POSITIVE';
        if (rawLabel === 'NEGATIVE' || rawLabel === 'LABEL_0') return 'NEGATIVE';
        return 'NEUTRAL';
    }

    /**
     * Summarize a text using the local AI model.
     */
    async summarize(text: string): Promise<string | null> {
        if (!this.isInitialized) await this.init();
        if (!this.summarizationPipeline) return null;

        try {
            if (text.length < 200) return null;
            const start = performance.now();
            const truncated = text.slice(0, 4000);
            logger.info(`📝 [AI] Starting summarization...`);
            const result = await this.summarizationPipeline(truncated, {
                max_new_tokens: 80,
                min_new_tokens: 30,
            });
            const duration = (performance.now() - start).toFixed(0);
            logger.info(`   [AI] Summarization finished in ${duration}ms`);

            const output = (Array.isArray(result) ? result[0] : result) as Record<string, string>;
            const summary = output?.summary_text || null;
            if (summary) logger.info(`   ✨ Summary Result: "${summary.slice(0, 50)}..."`);
            return summary;
        } catch (error) {
            logger.error('Error during summarization:', error);
            return null;
        }
    }

    /**
     * Extracts named entities from text using the NER model.
     */
    async extractEntities(text: string): Promise<ArticleEntity[]> {
        if (!this.isInitialized) await this.init();
        if (!this.nerPipeline) return [];

        try {
            const start = performance.now();
            const truncated = text.slice(0, 1500);
            logger.info('   [AI] Starting NER extraction...');
            const results = await this.nerPipeline(truncated);
            const resultEntities = this.processNerResults(results as unknown as NerResult[]);
            const duration = (performance.now() - start).toFixed(0);
            logger.info(`   [AI] NER extraction finished in ${duration}ms -> Found ${resultEntities.length} entities`);
            return resultEntities;
        } catch (error) {
            logger.error('Error during NER extraction:', error);
            return [];
        }
    }

    private processNerResults(results: NerResult[]): ArticleEntity[] {
        const entities: ArticleEntity[] = [];
        let current: { text: string; label: string; score: number; count: number } | null = null;

        for (const item of results) {
            const label = item.entity.split('-').pop() || 'MISC';
            const isSub = item.word.startsWith('##');
            const word = isSub ? item.word.slice(2) : item.word;

            if (this.isEntityContinuation(current, item, label, isSub)) {
                current!.text += (isSub ? '' : ' ') + word;
                current!.score += item.score;
                current!.count++;
            } else {
                if (current) entities.push({ text: current.text, label: current.label, score: current.score / current.count });
                current = { text: word, label, score: item.score, count: 1 };
            }
        }
        if (current) entities.push({ text: current.text, label: current.label, score: current.score / current.count });
        return this.finalizeEntities(entities);
    }

    private isEntityContinuation(current: { label: string } | null, item: NerResult, label: string, isSub: boolean): boolean {
        if (!current) return false;
        return isSub || (item.entity.startsWith('I-') && current.label === label);
    }

    private finalizeEntities(entities: ArticleEntity[]): ArticleEntity[] {
        return entities
            .filter(e => e.score > 0.8 && e.text.length > 2)
            .map(e => ({ ...e, text: this.cleanEntityText(e.text) }))
            .filter((e, idx, self) => idx === self.findIndex(t => t.text === e.text));
    }

    private cleanEntityText(text: string): string {
        return text.replace(/\s+/g, ' ').replace(/[.,!?]$/, '').trim();
    }

    /**
     * Performs a full analysis of an article in parallel.
     */
    async analyzeArticle(
        title: string,
        summary: string | null,
        _originalLang: string = 'en',
        _targetLanguages: string[] = SUPPORTED_TARGET_LANGS
    ): Promise<{ analysis: ArticleAnalysis; translations: ArticleTranslations }> {
        const textToAnalyze = `${title}. ${summary || ''}`;
        const summaryText = summary || '';

        logger.info(`🚀 [AI Parallel] Launching 3 analyses for: ${title.slice(0, 50)}...`);

        // RUN EVERYTHING IN PARALLEL
        const [sentiment, iaSummary, entities] = await Promise.all([
            this.analyzeSentiment(textToAnalyze),
            textToAnalyze.length >= 200 ? this.summarize(textToAnalyze) : Promise.resolve(null),
            this.extractEntities(textToAnalyze)
        ]);

        const analysis: ArticleAnalysis = {
            sentiment: this.mapSentimentLabel(sentiment),
            sentimentScore: sentiment?.score || 0,
            iaSummary: iaSummary || undefined,
            entities,
            isPromotional: this.detectPromotionalContent(title, summaryText)
        };

        // Bypassing translations for now to save resources
        const translations: ArticleTranslations = {};

        return { analysis, translations };
    }

    private mapSentimentLabel(sentiment: SentimentResult | null): 'bullish' | 'bearish' | 'neutral' {
        if (sentiment?.label === 'POSITIVE') return 'bullish';
        if (sentiment?.label === 'NEGATIVE') return 'bearish';
        return 'neutral';
    }

    private detectPromotionalContent(title: string, summary: string): boolean {
        const promoKeywords = ['sale', 'discount', 'limited offer', 'buy now', 'promo', 'giveaway', 'airdrop', 'presale'];
        const combined = `${title} ${summary}`.toLowerCase();
        return promoKeywords.some(keyword => combined.includes(keyword));
    }

    /**
     * Translates a text between two languages.
     */
    async translate(text: string, fromLang: string, toLang: string): Promise<string | null> {
        if (!this.isInitialized) await this.init();
        if (!this.translationPipeline) return null;
        if (fromLang === toLang) return text;

        const src_lang = M2M100_MAP[fromLang] || 'eng_Latn';
        const tgt_lang = M2M100_MAP[toLang];
        if (!tgt_lang) return null;

        try {
            const result = await this.translationPipeline(text, {
                // @ts-ignore - transformers.js types are sometimes outdated
                src_lang,
                // @ts-ignore
                tgt_lang
            });
            const output = (Array.isArray(result) ? result[0] : result) as Record<string, string>;
            return output?.translation_text || null;
        } catch (error) {
            logger.error(`Error translating:`, error);
            return null;
        }
    }

    private async translateArticle(title: string, summary: string, originalLang: string, targetLanguages: string[]): Promise<ArticleTranslations> {
        const translations: ArticleTranslations = {};
        const translationPromises = targetLanguages
            .filter(lang => lang !== originalLang)
            .map(async (lang) => {
                const [tTitle, tSummary] = await Promise.all([
                    this.translate(title, originalLang, lang),
                    this.translate(summary, originalLang, lang)
                ]);
                if (tTitle && tSummary) translations[lang] = { title: tTitle, summary: tSummary };
            });
        await Promise.all(translationPromises);
        return translations;
    }
}

export const aiService = new AiService();
