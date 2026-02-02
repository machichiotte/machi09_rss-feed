import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DATABASE || 'rss_feed';

async function initDb() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI not found');
        return;
    }

    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection('rssArticles');

        console.log('🚀 Initializing Indexes for rssArticles...');

        // 1. Text Index for Search (title and summary)
        await collection.createIndex(
            { title: 'text', summary: 'text' },
            {
                name: 'TextSearchIndex',
                default_language: 'french',
                language_override: 'dummy' // Prevents 'language' field from triggering unsupported stemming (e.g., 'ar')
            }
        );
        console.log('✅ Created Text Index for search');

        // 2. Compound Indexes for Filtering + Sorting
        // These will speed up the category/source/language/sentiment filtering
        await collection.createIndex({ category: 1, publicationDate: -1 });
        await collection.createIndex({ sourceFeed: 1, publicationDate: -1 });
        await collection.createIndex({ language: 1, publicationDate: -1 });
        await collection.createIndex({ 'analysis.sentiment': 1, publicationDate: -1 });
        await collection.createIndex({ publicationDate: -1, fetchedAt: -1 });

        console.log('✅ Created filtering and sorting indexes');
        console.log('✨ Database initialization complete.');
    } catch (error) {
        console.error('❌ Initialization failed:', error);
    } finally {
        await client.close();
    }
}

initDb();
