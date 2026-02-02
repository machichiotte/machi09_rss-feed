export interface UserUserSettings {
    viewMode: 'grid' | 'list' | 'compact';
    globalInsightMode: boolean;
    globalSummaryMode: boolean;
    autoTranslate: boolean;
    preferredLanguage: string;
}

export interface Article {
    _id: string;
    title: string;
    link: string;
    sourceFeed: string;
    feedName: string;
    category: string;
    language?: string;
    publicationDate: string;
    summary: string;
    fetchedAt: string;
    analysis?: {
        sentiment: 'bullish' | 'bearish' | 'neutral';
        sentimentScore: number;
        iaSummary?: string;
        isPromotional?: boolean;
    };
    translations?: Record<string, {
        title: string;
        summary: string;
        iaSummary?: string;
    }>;
    imageUrl?: string;
    sourceColor?: string;
    isBookmarked?: boolean;
}

export interface BriefingSection {
    title: string;
    content: string;
    articles: {
        title: string;
        link: string;
        source: string;
    }[];
}

export interface GlobalBriefing {
    summary: string;
    sections: BriefingSection[];
    marketSentiment: 'bullish' | 'bearish' | 'neutral';
    topTrends: string[];
    date: string;
}
