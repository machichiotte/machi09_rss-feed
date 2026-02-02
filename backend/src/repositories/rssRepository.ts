// src/repositories/rssRepository.ts
import { getDatabase } from '@/config/database';
import { ProcessedArticleData } from '@/types/rss';
import { databaseConfig } from '@/config/rssConfig';
import { ObjectId, Filter } from 'mongodb';

const COLLECTION_NAME = databaseConfig.collection.rssArticles;

export interface FetchOptions {
    page?: number;
    limit?: number;
    category?: string;
    sentiment?: string;
    language?: string;
    search?: string;
    feedName?: string;
    translationStatus?: 'all' | 'translated' | 'original';
    onlyInsights?: boolean;
    dateRange?: string;
}

export class RssRepository {
    /**
     * Retrieves RSS articles with pagination, sorting, and flexible filtering.
     * Sorts articles by publication date and fetch time (descending).
     * 
     * @param {FetchOptions} options - Search and pagination options.
     * @returns {Promise<{ articles: ProcessedArticleData[]; total: number }>}
     */
    public static async fetchAll(options: FetchOptions = {}): Promise<{ articles: ProcessedArticleData[]; total: number; stats: { today: number; week: number } }> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        const { page = 1, limit = 20, category, sentiment, language, feedName } = options;

        const query = this.buildFilterQuery(options);
        const total = await collection.countDocuments(query);

        // Get stats for Today and Week based on the current filters (category, source, etc.)
        const stats = await this.getStats(options);

        let documents;

        if (category || sentiment || language || feedName) {
            // Optimization: If filtering by specific field, use simpler sort to leverage compound indexes
            // The compound indexes are all { field: 1, publicationDate: -1 }
            documents = await collection
                .find(query)
                .sort({ publicationDate: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .toArray();
        } else {
            // Default view: use compound sort
            documents = await collection
                .find(query)
                .sort({ publicationDate: -1, fetchedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .toArray();
        }

        return {
            articles: documents as ProcessedArticleData[],
            total,
            stats
        };
    }

    /**
     * Calculates Today and Week statistics based on current filters.
     */
    private static async getStats(options: FetchOptions): Promise<{ today: number; week: number }> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);

        // Base query from options but without existing date range
        const baseQuery = this.buildFilterQuery({ ...options, dateRange: 'all' });

        const now = new Date();
        const dayLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const weekLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [today, week] = await Promise.all([
            collection.countDocuments({ ...baseQuery, publicationDate: { $gte: dayLimit } }),
            collection.countDocuments({ ...baseQuery, publicationDate: { $gte: weekLimit } })
        ]);

        return { today, week };
    }


    /**
     * Builds a MongoDB filter query based on the provided options.
     */
    private static buildFilterQuery(options: FetchOptions): Filter<ProcessedArticleData> {
        const query: Filter<ProcessedArticleData> = {};
        const { category, sentiment, language, search, feedName, onlyInsights } = options;

        if (category) query.category = category;
        if (language) {
            query.language = language.includes(',') ? { $in: language.split(',') } : language;
        }
        if (feedName) query.feedName = feedName;
        if (sentiment) query['analysis.sentiment'] = sentiment;

        if (onlyInsights) {
            query['analysis.iaSummary'] = { $exists: true, $ne: null };
        }

        this.applyDateFilter(query, options.dateRange);
        this.applyTranslationFilter(query, options.translationStatus);

        if (search) {
            query.$text = { $search: search };
        }

        return query;
    }

    /**
     * Applies date range filters to the query.
     */
    private static applyDateFilter(query: Filter<ProcessedArticleData>, dateRange?: string): void {
        if (!dateRange || dateRange === 'all') return;

        const now = new Date();
        let dateLimit: Date | null = null;

        const rangeMap: Record<string, number> = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000
        };

        if (rangeMap[dateRange]) {
            dateLimit = new Date(now.getTime() - rangeMap[dateRange]);
        }

        if (dateLimit && dateLimit.getTime() > 0) {
            query.publicationDate = { $gte: dateLimit.toISOString() };
        }
    }

    /**
     * Applies translation status filters to the query.
     */
    private static applyTranslationFilter(query: Filter<ProcessedArticleData>, status?: string): void {
        if (status === 'translated') {
            query.translations = { $exists: true, $ne: {} };
        } else if (status === 'original') {
            query.translations = { $exists: false };
        }
    }

    /**
     * Retrieves articles that have been fetched but not yet analyzed by AI.
     * 
     * @param {number} [limit=50] - Maximum number of pending articles to retrieve.
     * @returns {Promise<ProcessedArticleData[]>}
     */
    public static async findPendingAnalysis(limit: number = 50): Promise<ProcessedArticleData[]> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        const documents = await collection
            .find({ analysis: null })
            .sort({ publicationDate: -1, fetchedAt: -1 })
            .limit(limit)
            .toArray();
        return documents;
    }

    /**
     * Finds a single RSS article by its unique permanent link.
     * 
     * @param {string} link - The URL link of the article.
     * @returns {Promise<ProcessedArticleData | null>}
     */
    public static async findByLink(link: string): Promise<ProcessedArticleData | null> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        const document = await collection.findOne({ link });
        return document;
    }

    /**
     * Deletes all RSS articles in the database.
     * WARNING: Destructive operation.
     * 
     * @returns {Promise<number>} The number of deleted documents.
     */
    public static async deleteAll(): Promise<number> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        const result = await collection.deleteMany({});
        return result.deletedCount;
    }

    /**
     * Saves a new processed article to the database.
     * 
     * @param {ProcessedArticleData} articleData - The article data to persist.
     * @returns {Promise<void>}
     */
    public static async save(articleData: ProcessedArticleData): Promise<void> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        await collection.insertOne(articleData);
    }

    /**
     * Updates an article by its unique MongoDB identifier.
     * 
     * @param {string | ObjectId} articleId - The ID of the article.
     * @param {Partial<ProcessedArticleData>} updateData - The fields to update.
     * @returns {Promise<boolean>} True if at least one document was modified.
     */
    public static async updateById(
        articleId: string | ObjectId,
        updateData: Partial<ProcessedArticleData>
    ): Promise<boolean> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        const _id = typeof articleId === 'string' ? new ObjectId(articleId) : articleId;
        const result = await collection.updateOne(
            { _id } as Filter<ProcessedArticleData>,
            { $set: updateData }
        );
        return result.modifiedCount > 0;
    }

    /**
     * Deletes a single article by its permanent link.
     * 
     * @param {string} link - The URL link of the article.
     * @returns {Promise<boolean>} True if a document was deleted.
     */
    public static async deleteByLink(link: string): Promise<boolean> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        const result = await collection.deleteOne({ link });
        return result.deletedCount > 0;
    }

    /**
     * Updates an article if it already exists (by link) or inserts it if it doesn't.
     * 
     * @param {Partial<ProcessedArticleData>} articleData - The article data (must include link).
     * @returns {Promise<{ updated: boolean; upserted: boolean }>} Status of the operation.
     * @throws {Error} If the link field is missing.
     */
    public static async upsertByLink(
        articleData: Partial<ProcessedArticleData>
    ): Promise<{ updated: boolean; upserted: boolean }> {
        if (!articleData.link) {
            throw new Error('RssRepository.upsertByLink requires a link field in articleData.');
        }

        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        const filter = { link: articleData.link };
        const existing = await collection.findOne(filter);

        if (existing) {
            // Update existing document
            const dataToSet = { ...articleData };
            delete dataToSet.link;
            delete dataToSet._id;

            if (Object.keys(dataToSet).length > 0) {
                const result = await collection.updateOne(
                    filter,
                    { $set: dataToSet }
                );
                return { updated: result.modifiedCount > 0, upserted: false };
            }
            return { updated: false, upserted: false };
        } else {
            // Insert new document
            await collection.insertOne(articleData as ProcessedArticleData);
            return { updated: false, upserted: true };
        }
    }

    /**
     * Records an error message for an article processing attempt.
     * 
     * @param {string} link - The article link.
     * @param {string} errorMessage - The error description.
     * @returns {Promise<boolean>} True if the article was found and updated.
     */
    public static async updateErrorStatus(link: string, errorMessage: string): Promise<boolean> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        const result = await collection.updateOne(
            { link } as Filter<ProcessedArticleData>,
            {
                $set: {
                    error: errorMessage,
                    processedAt: new Date().toISOString(),
                } as Partial<ProcessedArticleData>,
            }
        );
        return result.modifiedCount > 0;
    }
}
