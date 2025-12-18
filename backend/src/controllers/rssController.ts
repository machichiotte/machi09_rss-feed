// src/controllers/rssController.ts
import { Request, Response } from 'express';
import { RssRepository } from '@/repositories/rssRepository';
import { RssService } from '@/services/rssService';
import { handleControllerError } from '@/utils/errorHandler';
import logger from '@/utils/logger';

/**
 * Récupère les articles RSS avec pagination et filtrage.
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

    logger.info(`Fetching RSS articles: page=${page}, limit=${limit}, category=${category}, search=${search}, source=${feedName}`);

    const { articles, total } = await RssRepository.fetchAll({
      page,
      limit,
      category,
      sentiment,
      language,
      search,
      feedName
    });

    res.status(200).json({
      message: 'Données RSS récupérées avec succès',
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
 * Déclenche le traitement de tous les flux RSS.
 */
async function processRssFeeds(_req: Request, res: Response): Promise<void> {
  try {
    logger.info('Manual RSS processing triggered');
    res.status(202).json({
      message: 'Traitement RSS démarré...',
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
 * Supprime tous les articles RSS de la base de données.
 */
async function deleteAllRssArticles(_req: Request, res: Response): Promise<void> {
  try {
    logger.info('Deleting all RSS articles from database');
    const deletedCount = await RssRepository.deleteAll();

    res.status(200).json({
      message: 'Tous les articles RSS ont été supprimés',
      deletedCount,
    });
  } catch (error) {
    handleControllerError(res, error, deleteAllRssArticles.name);
  }
}

/**
 * Récupère un article RSS par son lien.
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
      message: 'Article trouvé',
      data: article,
    });
  } catch (error) {
    handleControllerError(res, error, getRssArticleByLink.name);
  }
}

/**
 * Récupère les métadonnées (catégories, sources, langues) depuis la configuration.
 */
async function getMetadata(_req: Request, res: Response): Promise<void> {
  try {
    const { rssSources } = await import('@/config/sources');

    const categories = Object.keys(rssSources);
    const languages = new Set<string>();
    const sources = new Set<string>();

    for (const feeds of Object.values(rssSources)) {
      for (const feed of feeds) {
        if (feed.language) languages.add(feed.language);
        sources.add(feed.name);
      }
    }

    res.status(200).json({
      categories,
      languages: Array.from(languages).sort(),
      sources: Array.from(sources).sort(),
    });
  } catch (error) {
    handleControllerError(res, error, getMetadata.name);
  }
}

export { getRssArticles, processRssFeeds, deleteAllRssArticles, getRssArticleByLink, getMetadata };