// src/scripts/create_indexes.ts
import { getDatabase, connectToDatabase } from '@/config/database';
import { databaseConfig } from '@/config/rssConfig';
import logger from '@/utils/logger';

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

    // 1. Primary sorting index (most important)
    logger.info('Creating sort_by_date index...');
    await collection.createIndex(
      { publicationDate: -1, fetchedAt: -1 },
      { name: 'sort_by_date', background: true }
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
        background: true
      }
    );

    // 7. Unique link index (prevents duplicates)
    logger.info('Creating unique_link index...');
    await collection.createIndex(
      { link: 1 },
      { unique: true, name: 'unique_link', background: true }
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
    logger.info(`📊 Total indexes: ${indexes.length}`);
    indexes.forEach(idx => {
      logger.info(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
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
