// src/routes/rssRoutes.ts
import { Router } from 'express';
import {
    getRssArticles,
    processRssFeeds,
    deleteAllRssArticles,
    getRssArticleByLink,
    getMetadata,
    toggleSource,
    toggleBookmark,
    updateSourceSettings
} from '@/controllers/rssController';

const router: Router = Router();

/**
 * @route   PATCH /api/rss/sources/:name/toggle
 * @desc    Toggle a source on or off
 * @access  Public
 */
router.patch('/sources/:name/toggle', toggleSource);
router.patch('/sources/:name', updateSourceSettings);

/**
 * @route   PATCH /api/rss/articles/:id/bookmark
 * @desc    Toggle an article bookmark status
 * @access  Public
 */
router.patch('/articles/:id/bookmark', toggleBookmark);

/**
 * @route   GET /api/rss/metadata
 * @desc    Get categories, sources and languages
 * @access  Public
 */
router.get('/metadata', getMetadata);

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
