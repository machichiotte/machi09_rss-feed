// src/scripts/create_indexes.ts
import { getDatabase, connectToDatabase } from '@/config/database';
import { databaseConfig } from '@/config/rssConfig';
import logger from '@/utils/logger';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const COLLECTION_NAME = databaseConfig.collection.rssArticles;

/**
 * Creates optimized MongoDB indexes for the RSS articles collection.
 * This significantly improves query performance for sorting, filtering, and searching.
 * 
 * Note: This function is intentionally long as it creates multiple indexes sequentially.
 */
// eslint-disable-next-line max-lines-per-function
async function createIndexes() {
  try {
    await connectToDatabase();
    const db = getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    logger.info('🚀 Creating MongoDB indexes for performance optimization...');

    // Drop existing indexes to avoid conflicts
    try {
      logger.info('🗑️ Dropping existing indexes to ensure clean state...');
      await collection.dropIndexes();
      logger.info('✅ Existing indexes dropped.');
    } catch {
      logger.warn('⚠️ Could not drop indexes (maybe none existed), continuing...');
    }

    // 1. Primary sorting index (most important)
    logger.info('Creating sort_by_date index...');
    await collection.createIndex(
      { publicationDate: -1, fetchedAt: -1 },
      { background: true, name: 'sort_by_date' }
    );

    // 2. Category filter index
    logger.info('Creating filter_category index...');
    await collection.createIndex(
      { category: 1, publicationDate: -1 },
      { name: 'filter_category', background: true }
    );

    // 3. Language filter index
    logger.info('Creating filter_language index...');
    await collection.createIndex(
      { language: 1, publicationDate: -1 },
      { name: 'filter_language', background: true }
    );

    // 4. Sentiment filter index
    logger.info('Creating filter_sentiment index...');
    await collection.createIndex(
      { 'analysis.sentiment': 1, publicationDate: -1 },
      { name: 'filter_sentiment', background: true }
    );

    // 5. Feed name filter index
    logger.info('Creating filter_feedname index...');
    await collection.createIndex(
      { feedName: 1, publicationDate: -1 },
      { name: 'filter_feedname', background: true }
    );

    // 6. Text search index
    logger.info('Creating text_search index...');
    await collection.createIndex(
      { title: 'text', summary: 'text' },
      {
        name: 'text_search',
        default_language: 'english',
        language_override: 'dummy_language_field', // Fix for "language override unsupported: ar"
        background: true
      }
    );

    // 7. Link index
    logger.info('Creating link index...');
    await collection.createIndex(
      { link: 1 },
      { name: 'unique_link', background: true } // Removed unique: true to handle existing duplicates
    );

    // 8. Pending analysis index (for AI processing)
    logger.info('Creating pending_analysis index...');
    await collection.createIndex(
      { analysis: 1, publicationDate: -1 },
      { name: 'pending_analysis', background: true }
    );

    logger.info('✅ All indexes created successfully!');

    // Display created indexes
    const indexes = await collection.indexes();
    logger.info(`📊 Total indexes: ${indexes.length} `);
    indexes.forEach(idx => {
      logger.info(`  - ${idx.name}: ${JSON.stringify(idx.key)} `);
    });

    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to create indexes:', error);
    process.exit(1);
  }
}

// Run immediately when script is executed
createIndexes();

export { createIndexes };
