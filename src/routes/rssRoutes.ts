// src/routes/rssRoutes.ts
import { Router } from 'express';
import { getRssArticles, processRssFeeds, deleteAllRssArticles, getRssArticleByLink } from '@/controllers/rssController';

const router = Router();

/**
 * @route   GET /api/rss
 * @desc    Get all RSS articles
 * @access  Public
 */
router.get('/', getRssArticles);

/**
 * @route   POST /api/rss/process
 * @desc    Trigger RSS feed processing
 * @access  Public
 */
router.post('/process', processRssFeeds);

/**
 * @route   GET /api/rss/search
 * @desc    Get RSS article by link
 * @access  Public
 */
router.get('/search', getRssArticleByLink);

/**
 * @route   DELETE /api/rss
 * @desc    Delete all RSS articles
 * @access  Public (should be protected in production)
 */
router.delete('/', deleteAllRssArticles);

export default router;
