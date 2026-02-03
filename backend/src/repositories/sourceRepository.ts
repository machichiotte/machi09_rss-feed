// src/repositories/sourceRepository.ts
import { getDatabase } from '@/config/database';
import { rssSources as staticSources } from '@/config/sources';
import logger from '@/utils/logger';

const COLLECTION_NAME = 'rssSources';

export interface SourceConfig {
    name: string;
    url?: string;
    category: string;
    language?: string;
    enabled: boolean;
    color?: string;
    maxArticles?: number;
}

export class SourceRepository {
    /**
     * Initializes the sources collection from static config if it's empty.
     */
    public static async initializeSources(): Promise<void> {
        const db = getDatabase();
        const collection = db.collection<SourceConfig>(COLLECTION_NAME);
        const count = await collection.countDocuments();

        if (count === 0) {
            logger.info('Initializing rssSources collection from static config...');
            const docs: SourceConfig[] = [];
            for (const [category, feeds] of Object.entries(staticSources)) {
                for (const feed of feeds) {
                    docs.push({
                        name: feed.name,
                        url: feed.url,
                        category,
                        language: feed.language,
                        enabled: feed.enabled !== false,
                        color: feed.color,
                        maxArticles: feed.maxArticles || 20 // Default limit if not set
                    });
                }
            }
            if (docs.length > 0) {
                await collection.insertMany(docs);
                logger.info(`Initialized ${docs.length} sources.`);
            }
        }
    }

    /**
     * Fetches all sources from the database.
     */
    public static async getAllSources(): Promise<SourceConfig[]> {
        const db = getDatabase();
        const collection = db.collection<SourceConfig>(COLLECTION_NAME);
        return await collection.find({}).toArray();
    }

    /**
     * Toggles the enabled state of a source.
     */
    public static async toggleSource(name: string, enabled: boolean): Promise<boolean> {
        return this.updateSource(name, { enabled });
    }

    /**
     * Updates source properties by name.
     */
    public static async updateSource(name: string, data: Partial<SourceConfig>): Promise<boolean> {
        const db = getDatabase();
        const collection = db.collection<SourceConfig>(COLLECTION_NAME);
        const result = await collection.updateOne(
            { name },
            { $set: data }
        );
        return result.modifiedCount > 0;
    }

    /**
     * Adds a new source to the database.
     */
    public static async addSource(source: SourceConfig): Promise<boolean> {
        const db = getDatabase();
        const collection = db.collection<SourceConfig>(COLLECTION_NAME);
        // Check if source already exists
        const existing = await collection.findOne({ name: source.name });
        if (existing) return false;

        const result = await collection.insertOne(source);
        return result.acknowledged;
    }

    /**
     * Deletes a source by name.
     */
    public static async deleteSource(name: string): Promise<boolean> {
        const db = getDatabase();
        const collection = db.collection<SourceConfig>(COLLECTION_NAME);
        const result = await collection.deleteOne({ name });
        return result.deletedCount > 0;
    }

    /**
     * Returns only enabled sources, grouped by category.
     */
    public static async getEnabledSources(): Promise<Record<string, SourceConfig[]>> {
        const db = getDatabase();
        const collection = db.collection<SourceConfig>(COLLECTION_NAME);
        const sources = await collection.find({ enabled: true }).toArray();

        const grouped: Record<string, SourceConfig[]> = {};
        for (const source of sources) {
            if (!grouped[source.category]) {
                grouped[source.category] = [];
            }
            grouped[source.category].push(source);
        }
        return grouped;
    }
}
