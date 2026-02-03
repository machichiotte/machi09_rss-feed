// src/types/rss.ts
import { ObjectId } from 'mongodb';

export interface AnalysisWithSummary {
    analysis: FinancialAnalysis;
    summary: string;
}

export interface ProcessedArticleData {
    _id?: ObjectId;
    title: string;
    link: string;
    publicationDate?: string | null;
    sourceFeed?: string | null;
    feedName?: string | null;
    category?: string | null;
    language?: string | null; // 'fr' | 'en' | ...
    fetchedAt: string | null;
    processedAt?: string | null;
    summary?: string | null;
    analysis?: FinancialAnalysis | null;
    translations?: Record<string, {
        title: string;
        summary: string;
        iaSummary?: string;
    }> | null;
    error?: string | null;
    scrapedContent?: boolean;
    fullText?: string | null;
    imageUrl?: string | null;
    author?: string | null;
    sourceColor?: string | null;
    isBookmarked?: boolean;
    clusterId?: string | null;
}

export interface ArticleEntity {
    text: string;
    label: string; // 'ORG', 'PER', 'LOC', 'MISC'
    score: number;
}

export interface FinancialAnalysis {
    // Current AI Service fields
    sentiment?: 'bullish' | 'bearish' | 'neutral';
    sentimentScore?: number;
    iaSummary?: string;
    isPromotional?: boolean;
    entities?: ArticleEntity[];

    // Future legacy fields
    isRelevant?: 'Yes' | 'No' | 'Partial';
    relevanceReason?: string;
    mentionedAssets?: string[];
    financialSentiment?: 'Positive' | 'Negative' | 'Neutral' | 'Mixed';
    sentimentReason?: string;
    potentialImpact?: string;
    financialThemes?: string[];
    actionableInfo?: string;
}

export interface RssArticle {
    title: string;
    link: string;
    contentSnippet?: string; // Extrait fourni par le flux RSS
    isoDate?: string;        // Date au format ISO
    sourceFeed: string;       // URL du flux d'origine
}

/**
 * Représente un flux RSS unique dans la configuration.
 */
export interface RssFeedConfig {
    name: string;         // Nom affichable du flux (ex: "CoinTribune")
    url: string;          // URL du flux RSS
    enabled?: boolean;    // Activer/désactiver ce flux spécifique
    category?: string;    // Catégorie (ajoutée dynamiquement)
    language?: 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'nl' | 'ru' | 'zh' | 'ja' | 'ar'; // Langue du flux
    color?: string;       // Couleur de la marque du flux
    maxArticles?: number; // Nombre maximum d'articles à récupérer par scan
}

/**
 * Structure pour les catégories de flux RSS.
 * Les clés sont les noms des catégories (ex: "News", "Crypto").
 */
export type RssCategoryConfig = Record<string, RssFeedConfig[]>;

/**
 * Configuration complète pour le traitement RSS.
 */
export interface ServerRssConfig {
    enabled: boolean;                   // Activer/désactiver globalement le traitement RSS
    delayBetweenArticlesMs: number;     // Délai entre les articles
    delayBetweenFeedsMs: number;        // Délai entre les différents flux (URLs)
    minContentLengthForScraping: number; // Seuil pour le scraping
    scrapeRetryDelayMs: number;         // Délai après scraping réussi
    aiRequestDelayMs: number; // Délai avant chaque série d'appels AI (résumé/analyse)
    categories: RssCategoryConfig;      // Les catégories et leurs flux
}