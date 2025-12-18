import { MongoClient, Db } from 'mongodb';
import logger from '@/utils/logger';

let client: MongoClient | null = null;
let database: Db | null = null;

/**
 * Connects to MongoDB using the MONGODB_URI environment variable.
 * Initializes the singleton database instance.
 * 
 * @returns {Promise<Db>} The initialized database instance.
 * @throws {Error} If MONGODB_URI is not defined or connection fails.
 */
export async function connectToDatabase(): Promise<Db> {
    if (database) {
        return database;
    }

    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }

    try {
        client = new MongoClient(uri);
        await client.connect();

        // Extract database name from URI or use default
        const dbName = process.env.MONGODB_DATABASE || 'rss_feed';
        database = client.db(dbName);

        logger.info('✅ Successfully connected to MongoDB Atlas');
        logger.info(`📊 Database: ${dbName}`);

        return database;
    } catch (error) {
        logger.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

/**
 * Get the database instance
 */
export function getDatabase(): Db {
    if (!database) {
        throw new Error('Database not initialized. Call connectToDatabase() first.');
    }
    return database;
}

/**
 * Closes the MongoDB connection and resets the singleton instances.
 * 
 * @returns {Promise<void>}
 */
export async function closeDatabaseConnection(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        database = null;
        logger.info('🔌 MongoDB connection closed');
    }
}

// Handle application termination
process.on('SIGINT', async () => {
    await closeDatabaseConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeDatabaseConnection();
    process.exit(0);
});
