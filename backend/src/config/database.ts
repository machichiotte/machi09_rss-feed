import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let database: Db | null = null;

/**
 * Connect to MongoDB
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

        console.log('✅ Successfully connected to MongoDB Atlas');
        console.log(`📊 Database: ${dbName}`);

        return database;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
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
 * Close MongoDB connection
 */
export async function closeDatabaseConnection(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        database = null;
        console.log('🔌 MongoDB connection closed');
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
