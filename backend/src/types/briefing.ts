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
    id?: string;
    userId: string;
    date: string;
    summary: string;
    sections: BriefingSection[];
    marketSentiment: 'bullish' | 'bearish' | 'neutral';
    topTrends: string[];
    createdAt: string;
}
