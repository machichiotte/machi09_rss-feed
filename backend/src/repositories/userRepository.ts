import { getDatabase } from '@/config/database';
import { UserProfile } from '@/types/user';
import { Filter } from 'mongodb';
import logger from '@/utils/logger';

const COLLECTION_NAME = 'users';

export class UserRepository {
    /**
     * Get or create a user profile by ID
     */
    public static async getProfile(userId: string): Promise<UserProfile | null> {
        const db = getDatabase();
        const collection = db.collection<UserProfile>(COLLECTION_NAME);
        return collection.findOne({ _id: userId } as Filter<UserProfile>);
    }

    /**
     * Update or create a user profile
     */
    public static async updateProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
        const db = getDatabase();
        const collection = db.collection<UserProfile>(COLLECTION_NAME);

        const updateData = {
            ...data,
            updatedAt: new Date().toISOString()
        };

        await collection.updateOne(
            { _id: userId } as Filter<UserProfile>,
            { $set: updateData },
            { upsert: true }
        );
        logger.debug(`User profile updated for ${userId}`);
    }

    /**
     * Specialized update for bookmarks
     */
    public static async toggleBookmark(userId: string, articleId: string): Promise<string[]> {
        const profile = await this.getProfile(userId);
        let bookmarks = profile?.bookmarks || [];

        if (bookmarks.includes(articleId)) {
            bookmarks = bookmarks.filter(id => id !== articleId);
        } else {
            bookmarks.push(articleId);
        }

        await this.updateProfile(userId, { bookmarks });
        return bookmarks;
    }
}
