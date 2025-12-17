// src/repositories/rssRepository.ts
import { getDatabase } from '@/config/database';
import { ProcessedArticleData } from '@/types/rss';
import { databaseConfig } from '@/config/rssConfig';
import { ObjectId } from 'mongodb';

const COLLECTION_NAME = databaseConfig.collection.rssArticles;

export class RssRepository {
    /**
     * Récupère tous les articles RSS de la base de données.
     */
    public static async fetchAll(): Promise<ProcessedArticleData[]> {
        const db = getDatabase();
        const documents = await db.collection(COLLECTION_NAME).find({}).toArray();
        return documents as ProcessedArticleData[];
    }

    /**
     * Récupère un article RSS par son lien.
     */
    public static async findByLink(link: string): Promise<ProcessedArticleData | null> {
        const db = getDatabase();
        const document = await db.collection(COLLECTION_NAME).findOne({ link });
        return document as ProcessedArticleData | null;
    }

    /**
     * Supprime tous les articles RSS de la base de données.
     */
    public static async deleteAll(): Promise<number> {
        const db = getDatabase();
        const result = await db.collection(COLLECTION_NAME).deleteMany({});
        return result.deletedCount;
    }

    /**
     * Enregistre un nouvel article RSS dans la base de données.
     */
    public static async save(articleData: ProcessedArticleData): Promise<void> {
        const db = getDatabase();
        await db.collection(COLLECTION_NAME).insertOne(articleData);
    }

    /**
     * Met à jour un article RSS existant par son ID MongoDB.
     */
    public static async updateById(
        articleId: string | ObjectId,
        updateData: Partial<ProcessedArticleData>
    ): Promise<boolean> {
        const db = getDatabase();
        const _id = typeof articleId === 'string' ? new ObjectId(articleId) : articleId;
        const result = await db.collection(COLLECTION_NAME).updateOne(
            { _id },
            { $set: updateData }
        );
        return result.modifiedCount > 0;
    }

    /**
     * Supprime un article RSS par son lien.
     */
    public static async deleteByLink(link: string): Promise<boolean> {
        const db = getDatabase();
        const result = await db.collection(COLLECTION_NAME).deleteOne({ link });
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
        const filter = { link: articleData.link };
        const existing = await db.collection(COLLECTION_NAME).findOne(filter);

        if (existing) {
            // Update existing document
            const dataToSet = { ...articleData };
            delete dataToSet.link;
            delete dataToSet._id;

            if (Object.keys(dataToSet).length > 0) {
                const result = await db.collection(COLLECTION_NAME).updateOne(
                    filter,
                    { $set: dataToSet }
                );
                return { updated: result.modifiedCount > 0, upserted: false };
            }
            return { updated: false, upserted: false };
        } else {
            // Insert new document
            await db.collection(COLLECTION_NAME).insertOne(articleData as ProcessedArticleData);
            return { updated: false, upserted: true };
        }
    }

    /**
     * Met à jour le statut d'erreur pour un article.
     */
    public static async updateErrorStatus(link: string, errorMessage: string): Promise<boolean> {
        const db = getDatabase();
        const result = await db.collection(COLLECTION_NAME).updateOne(
            { link },
            {
                $set: {
                    error: errorMessage,
                    processedAt: new Date().toISOString(),
                },
            }
        );
        return result.modifiedCount > 0;
    }
}