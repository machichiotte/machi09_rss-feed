// src/routes/analyticsRoutes.ts
import { Router } from 'express';
import {
    getSentimentAnalytics,
    getTopicsAnalytics,
    getTimelineAnalytics
} from '@/controllers/analyticsController';

const router: Router = Router();

/**
 * @route   GET /api/analytics/sentiment
 * @desc    Get sentiment distribution analytics
 * @access  Public
 */
router.get('/sentiment', getSentimentAnalytics);

/**
 * @route   GET /api/analytics/topics
 * @desc    Get hot topics analytics
 * @access  Public
 */
router.get('/topics', getTopicsAnalytics);

/**
 * @route   GET /api/analytics/timeline
 * @desc    Get timeline sentiment analytics
 * @access  Public
 */
router.get('/timeline', getTimelineAnalytics);

export default router;
