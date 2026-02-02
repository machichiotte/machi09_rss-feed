import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rss_aggregator';
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('rssSources');

        const count = await collection.countDocuments();
        console.log(`Found ${count} sources.`);

        // Update any source that doesn't have maxArticles
        const result = await collection.updateMany(
            { maxArticles: { $exists: false } },
            { $set: { maxArticles: 20 } }
        );

        console.log(`Updated ${result.modifiedCount} sources with default maxArticles: 20.`);

        const samples = await collection.find().limit(3).toArray();
        console.log('Sample sources:', JSON.stringify(samples, null, 2));

    } finally {
        await client.close();
    }
}

run().catch(console.dir);
