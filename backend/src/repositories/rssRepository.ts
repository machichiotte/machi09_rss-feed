// src/repositories/rssRepository.ts
import { getDatabase } from '@/config/database';
import { ProcessedArticleData } from '@/types/rss';
import { databaseConfig } from '@/config/rssConfig';
import { ObjectId, Filter } from 'mongodb';

const COLLECTION_NAME = databaseConfig.collection.rssArticles;

export class RssRepository {
    /**
     * Récupère les articles RSS avec pagination et filtrage.
     */
    public static async fetchAll(options: {
        page?: number;
        limit?: number;
        category?: string;
        sentiment?: string;
        language?: string;
        search?: string;
        feedName?: string;
    } = {}): Promise<{ articles: ProcessedArticleData[]; total: number }> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        const { page = 1, limit = 20, category, sentiment, language, search, feedName } = options;

        const query: Filter<ProcessedArticleData> = {};

        if (category) query.category = category;
        if (language) query.language = language;
        if (feedName) query.feedName = feedName;
        if (sentiment) query['analysis.sentiment'] = sentiment;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { summary: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await collection.countDocuments(query);
        const documents = await collection
            .find(query)
            .sort({ publicationDate: -1, fetchedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        return {
            articles: documents as ProcessedArticleData[],
            total
        };
    }

    /**
     * Récupère les articles qui n'ont pas encore été analysés par l'IA.
     */
    public static async findPendingAnalysis(limit: number = 50): Promise<ProcessedArticleData[]> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        const documents = await collection
            .find({ analysis: null })
            .limit(limit)
            .toArray();
        return documents;
    }

    /**
     * Récupère un article RSS par son lien.
     */
    public static async findByLink(link: string): Promise<ProcessedArticleData | null> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        const document = await collection.findOne({ link });
        return document;
    }

    /**
     * Supprime tous les articles RSS de la base de données.
     */
    public static async deleteAll(): Promise<number> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        const result = await collection.deleteMany({});
        return result.deletedCount;
    }

    /**
     * Enregistre un nouvel article RSS dans la base de données.
     */
    public static async save(articleData: ProcessedArticleData): Promise<void> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        await collection.insertOne(articleData);
    }

    /**
     * Met à jour un article RSS existant par son ID MongoDB.
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
     * Supprime un article RSS par son lien.
     */
    public static async deleteByLink(link: string): Promise<boolean> {
        const db = getDatabase();
        const collection = db.collection<ProcessedArticleData>(COLLECTION_NAME);
        const result = await collection.deleteOne({ link });
        return result.deletedCount > 0;
    }

    /**
     * Met à jour un article s'il existe par lien, sinon l'insère (upsert).
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
     * Met à jour le statut d'erreur pour un article.
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