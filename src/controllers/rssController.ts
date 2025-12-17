// src/controllers/rssController.ts
import { Request, Response } from 'express';
import { RssRepository } from '@/repositories/rssRepository';
import { RssService } from '@/services/rssService';
import { handleControllerError } from '@/utils/errorHandler';
import logger from '@/utils/logger';

/**
 * Récupère les dernières données RSS de la base de données.
 */
async function getRssArticles(req: Request, res: Response): Promise<void> {
  try {
    logger.info('Fetching RSS articles from database');
    const data = await RssRepository.fetchAll();

    res.status(200).json({
      message: 'Données RSS récupérées avec succès',
      count: data.length,
      data,
    });
  } catch (error) {
    handleControllerError(res, error, getRssArticles.name);
  }
}

/**
 * Déclenche le traitement de tous les flux RSS.
 */
async function processRssFeeds(req: Request, res: Response): Promise<void> {
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
async function deleteAllRssArticles(req: Request, res: Response): Promise<void> {
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

export { getRssArticles, processRssFeeds, deleteAllRssArticles, getRssArticleByLink };