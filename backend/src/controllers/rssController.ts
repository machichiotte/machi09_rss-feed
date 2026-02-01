// src/controllers/rssController.ts
import { Request, Response } from 'express';
import { RssRepository } from '@/repositories/rssRepository';
import { RssService } from '@/services/rssService';
import { handleControllerError } from '@/utils/errorHandler';
import logger from '@/utils/logger';

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

    logger.info(`Fetching RSS articles: page=${page}, limit=${limit}, category=${category}, search=${search}, source=${feedName}, onlyInsights=${onlyInsights}, dateRange=${dateRange}`);

    const { articles, total } = await RssRepository.fetchAll({
      page,
      limit,
      category,
      sentiment,
      language,
      search,
      feedName,
      translationStatus,
      onlyInsights,
      dateRange
    });

    res.status(200).json({
      message: 'RSS articles retrieved successfully',
      total,
      page,
      limit,
      count: articles.length,
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
    const { rssSources } = await import('@/config/sources');

    const categories = Object.keys(rssSources);
    const languages = new Set<string>();
    const sources = new Set<string>();
    const groupedSources: Record<string, string[]> = {};

    for (const [category, feeds] of Object.entries(rssSources)) {
      groupedSources[category] = [];
      for (const feed of feeds) {
        if (feed.language) languages.add(feed.language);
        sources.add(feed.name);
        groupedSources[category].push(feed.name);
      }
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

export { getRssArticles, processRssFeeds, deleteAllRssArticles, getRssArticleByLink, getMetadata };