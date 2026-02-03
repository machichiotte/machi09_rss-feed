// src/controllers/rssController.ts
import { Request, Response } from 'express';
import { RssRepository } from '@/repositories/rssRepository';
import { RssService } from '@/services/rssService';
import { handleControllerError } from '@/utils/errorHandler';
import logger from '@/utils/logger';
import { SourceRepository } from '@/repositories/sourceRepository';

/**
 * Retrieves RSS articles with pagination, sorting and filtering.
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

    const { articles, total, stats } = await RssRepository.fetchAll({
      page, limit, category, sentiment, language, search, feedName,
      translationStatus, onlyInsights, dateRange, isBookmarked, bookmarkIds
    });

    res.status(200).json({
      message: 'RSS articles retrieved successfully',
      total, page, limit, count: articles.length, stats, data: articles,
    });
  } catch (error) {
    handleControllerError(res, error, getRssArticles.name);
  }
}

async function processRssFeeds(_req: Request, res: Response): Promise<void> {
  try {
    res.status(202).json({ message: 'RSS processing started...', status: 'processing' });
    RssService.processAllFeeds().catch(error => logger.error('RSS processing failed:', error));
  } catch (error) {
    handleControllerError(res, error, processRssFeeds.name);
  }
}

async function deleteAllRssArticles(_req: Request, res: Response): Promise<void> {
  try {
    const deletedCount = await RssRepository.deleteAll();
    res.status(200).json({ message: 'All RSS articles have been deleted', deletedCount });
  } catch (error) {
    handleControllerError(res, error, deleteAllRssArticles.name);
  }
}

async function getRssArticleByLink(req: Request, res: Response): Promise<void> {
  try {
    const link = req.query.link as string;
    if (!link) {
      res.status(400).json({ error: 'Link parameter is required' });
      return;
    }
    const article = await RssRepository.findByLink(link);
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    res.status(200).json({ message: 'Article found', data: article });
  } catch (error) {
    handleControllerError(res, error, getRssArticleByLink.name);
  }
}

async function getMetadata(_req: Request, res: Response): Promise<void> {
  try {
    await SourceRepository.initializeSources();
    const dbSources = await SourceRepository.getAllSources();
    const categories = Array.from(new Set(dbSources.map(s => s.category))).sort();
    const languages = new Set<string>();
    const sources = new Set<string>();
    const groupedSources: Record<string, { name: string; language: string; enabled: boolean; maxArticles?: number }[]> = {};

    for (const source of dbSources) {
      if (source.language) languages.add(source.language);
      sources.add(source.name);
      if (!groupedSources[source.category]) groupedSources[source.category] = [];
      groupedSources[source.category].push({
        name: source.name,
        language: source.language || 'en',
        enabled: source.enabled,
        maxArticles: source.maxArticles
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

async function toggleSource(req: Request, res: Response): Promise<void> {
  try {
    const name = req.params.name as string;
    const enabled = req.body.enabled === true;
    const success = await SourceRepository.toggleSource(name, enabled);
    if (!success) {
      res.status(404).json({ error: 'Source not found' });
      return;
    }
    res.status(200).json({ message: `Source ${name} status updated`, name, enabled });
  } catch (error) {
    handleControllerError(res, error, toggleSource.name);
  }
}

async function updateSourceSettings(req: Request, res: Response): Promise<void> {
  try {
    const name = req.params.name as string;
    const data = req.body;
    const success = await SourceRepository.updateSource(name, data);
    if (!success) {
      res.status(404).json({ error: 'Source not found' });
      return;
    }
    res.status(200).json({ message: `Source ${name} settings updated`, name, ...data });
  } catch (error) {
    handleControllerError(res, error, updateSourceSettings.name);
  }
}

async function createSource(req: Request, res: Response): Promise<void> {
  try {
    const { name, url, category, language, enabled, color, maxArticles } = req.body;
    if (!name || !url || !category) {
      res.status(400).json({ error: 'Name, URL and Category are required' });
      return;
    }
    const success = await SourceRepository.addSource({
      name, url, category,
      language: (language as string) || 'en',
      enabled: enabled !== false,
      color: (color as string) || '#6366f1',
      maxArticles: maxArticles || 20
    });
    if (!success) {
      res.status(409).json({ error: 'Source already exists' });
      return;
    }
    res.status(201).json({ message: 'Source created successfully', source: { name, url, category } });
  } catch (error) {
    handleControllerError(res, error, createSource.name);
  }
}

async function removeSource(req: Request, res: Response): Promise<void> {
  try {
    const name = req.params.name as string;
    const success = await SourceRepository.deleteSource(name);
    if (!success) {
      res.status(404).json({ error: 'Source not found' });
      return;
    }
    res.status(200).json({ message: `Source ${name} removed successfully` });
  } catch (error) {
    handleControllerError(res, error, removeSource.name);
  }
}

async function toggleBookmark(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const isBookmarked = await RssRepository.toggleBookmark(id);
    res.status(200).json({ message: isBookmarked ? 'Article bookmarked' : 'Bookmark removed', id, isBookmarked });
  } catch (error) {
    handleControllerError(res, error, toggleBookmark.name);
  }
}

export {
  getRssArticles,
  processRssFeeds,
  deleteAllRssArticles,
  getRssArticleByLink,
  getMetadata,
  toggleSource,
  toggleBookmark,
  updateSourceSettings,
  createSource,
  removeSource
};