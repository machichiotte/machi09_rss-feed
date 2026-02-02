export interface UserUserSettings {
    viewMode: 'grid' | 'list' | 'compact';
    globalInsightMode: boolean;
    globalSummaryMode: boolean;
    autoTranslate: boolean;
    preferredLanguage: string;
}

export interface UserProfile {
    _id: string; // We'll use a string ID (could be from localStorage or auth)
    bookmarks: string[]; // Array of article IDs
    customTags: string[];
    settings: UserUserSettings;
    updatedAt: string;
}
