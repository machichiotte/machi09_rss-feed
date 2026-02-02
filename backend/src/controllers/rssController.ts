// src/controllers/rssController.ts
import { Request, Response } from 'express';
import { RssRepository } from '@/repositories/rssRepository';
import { RssService } from '@/services/rssService';
import { handleControllerError } from '@/utils/errorHandler';
import logger from '@/utils/logger';
import { SourceRepository } from '@/repositories/sourceRepository';

/**
 * Retrieves RSS articles with pagination, sorting and filtering.
 * Expects query parameters: page, limit, category, sentiment, language, search, source.
 * 
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>}
 */
async function getRssArticles(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const sentiment = req.query.sentiment as string;
    const language = req.query.language as string;
    const search = req.query.search as string;
    const feedName = req.query.source as string;
    const translationStatus = req.query.translationStatus as 'all' | 'translated' | 'original';
    const onlyInsights = req.query.onlyInsights === 'true';
    const dateRange = req.query.dateRange as string;
    const isBookmarked = req.query.isBookmarked === 'true';
    const bookmarkIds = req.query.bookmarkIds as string;

    logger.info(`Fetching RSS articles: page=${page}, limit=${limit}, category=${category}, search=${search}, source=${feedName}, onlyInsights=${onlyInsights}, dateRange=${dateRange}`);

    const { articles, total, stats } = await RssRepository.fetchAll({
      page,
      limit,
      category,
      sentiment,
      language,
      search,
      feedName,
      translationStatus,
      onlyInsights,
      dateRange,
      isBookmarked,
      bookmarkIds
    });

    res.status(200).json({
      message: 'RSS articles retrieved successfully',
      total,
      page,
      limit,
      count: articles.length,
      stats,
      data: articles,
    });
  } catch (error) {
    handleControllerError(res, error, getRssArticles.name);
  }
}

/**
 * Triggers the background processing of all configured RSS feeds.
 * Responds with a 202 status immediately while the task runs in the background.
 * 
 * @param {Request} _req - Express request object (unused).
 * @param {Response} res - Express response object.
 * @returns {Promise<void>}
 */
async function processRssFeeds(_req: Request, res: Response): Promise<void> {
  try {
    logger.info('Manual RSS processing triggered');
    res.status(202).json({
      message: 'RSS processing started...',
      status: 'processing',
    });

    // Process in background
    RssService.processAllFeeds()
      .then(result => {
        logger.info(`RSS processing completed: ${JSON.stringify(result)}`);
      })
      .catch(error => {
        logger.error('RSS processing failed:', error);
      });
  } catch (error) {
    handleControllerError(res, error, processRssFeeds.name);
  }
}

/**
 * Deletes all RSS articles from the database.
 * 
 * @param {Request} _req - Express request object (unused).
 * @param {Response} res - Express response object.
 * @returns {Promise<void>}
 */
async function deleteAllRssArticles(_req: Request, res: Response): Promise<void> {
  try {
    logger.info('Deleting all RSS articles from database');
    const deletedCount = await RssRepository.deleteAll();

    res.status(200).json({
      message: 'All RSS articles have been deleted',
      deletedCount,
    });
  } catch (error) {
    handleControllerError(res, error, deleteAllRssArticles.name);
  }
}

/**
 * Retrieves a single RSS article by its unique link.
 * 
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>}
 */
async function getRssArticleByLink(req: Request, res: Response): Promise<void> {
  try {
    const { link } = req.query;

    if (!link || typeof link !== 'string') {
      res.status(400).json({ error: 'Link parameter is required' });
      return;
    }

    logger.info(`Fetching RSS article by link: ${link}`);
    const article = await RssRepository.findByLink(link);

    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.status(200).json({
      message: 'Article found',
      data: article,
    });
  } catch (error) {
    handleControllerError(res, error, getRssArticleByLink.name);
  }
}

/**
 * Compiles and returns metadata for the frontend to build filter UI.
 * Aggregates categories, languages, and source names from feed configuration.
 * 
 * @param {Request} _req - Express request object (unused).
 * @param {Response} res - Express response object.
 * @returns {Promise<void>}
 */
async function getMetadata(_req: Request, res: Response): Promise<void> {
  try {
    // Ensure sources are initialized in DB
    await SourceRepository.initializeSources();

    const dbSources = await SourceRepository.getAllSources();

    const categories = Array.from(new Set(dbSources.map(s => s.category))).sort();
    const languages = new Set<string>();
    const sources = new Set<string>();
    const groupedSources: Record<string, { name: string; language: string; enabled: boolean }[]> = {};

    for (const source of dbSources) {
      if (source.language) languages.add(source.language);
      sources.add(source.name);

      if (!groupedSources[source.category]) {
        groupedSources[source.category] = [];
      }

      groupedSources[source.category].push({
        name: source.name,
        language: source.language || 'en',
        enabled: source.enabled
      });
    }

    res.status(200).json({
      categories,
      languages: Array.from(languages).sort(),
      sources: Array.from(sources).sort(),
      groupedSources
    });
  } catch (error) {
    handleControllerError(res, error, getMetadata.name);
  }
}

/**
 * Toggles the enabled state of a specific RSS source.
 * 
 * @route   PATCH /api/rss/sources/:name/toggle
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>}
 */
async function toggleSource(req: Request, res: Response): Promise<void> {
  try {
    const { name } = req.params;
    const enabled = req.body.enabled === true;

    if (name === undefined) {
      res.status(400).json({ error: 'Source name is required' });
      return;
    }

    logger.info(`Toggling source ${name} to ${enabled}`);
    const success = await SourceRepository.toggleSource(name as string, enabled);

    if (!success) {
      res.status(404).json({ error: 'Source not found or no change made' });
      return;
    }

    res.status(200).json({
      message: `Source ${name} status updated`,
      name,
      enabled
    });
  } catch (error) {
    handleControllerError(res, error, toggleSource.name);
  }
}

/**
 * Toggles the bookmark status of an article.
 * 
 * @route   PATCH /api/rss/articles/:id/bookmark
 */
async function toggleBookmark(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Article ID is required' });
      return;
    }

    logger.info(`Toggling bookmark for article ${id}`);
    const isBookmarked = await RssRepository.toggleBookmark(id as string);

    res.status(200).json({
      message: isBookmarked ? 'Article bookmarked' : 'Bookmark removed',
      id,
      isBookmarked
    });
  } catch (error) {
    handleControllerError(res, error, toggleBookmark.name);
  }
}

export { getRssArticles, processRssFeeds, deleteAllRssArticles, getRssArticleByLink, getMetadata, toggleSource, toggleBookmark };