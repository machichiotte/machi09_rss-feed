// src/controllers/analyticsController.ts
import { Request, Response } from 'express';
import { AnalyticsService } from '@/services/analyticsService';
import { handleControllerError } from '@/utils/errorHandler';
import logger from '@/utils/logger';

/**
 * Get sentiment distribution analytics
 * 
 * @route GET /api/analytics/sentiment
 */
export async function getSentimentAnalytics(req: Request, res: Response): Promise<void> {
    try {
        const dateRange = (req.query.dateRange as 'today' | 'week' | 'month' | 'all') || 'all';
        const category = req.query.category as string | undefined;
        const source = req.query.source as string | undefined;

        logger.info(`Fetching sentiment analytics: range=${dateRange}, category=${category}, source=${source}`);

        const data = await AnalyticsService.getSentimentDistribution(dateRange, category, source);

        res.status(200).json({
            message: 'Sentiment analytics retrieved successfully',
            data
        });
    } catch (error) {
        handleControllerError(res, error, getSentimentAnalytics.name);
    }
}

/**
 * Get hot topics analytics
 * 
 * @route GET /api/analytics/topics
 */
export async function getTopicsAnalytics(req: Request, res: Response): Promise<void> {
    try {
        const dateRange = (req.query.dateRange as 'today' | 'week' | 'month' | 'all') || 'all';
        const category = req.query.category as string | undefined;
        const source = req.query.source as string | undefined;
        const limit = parseInt(req.query.limit as string) || 50;

        logger.info(`Fetching topics analytics: range=${dateRange}, limit=${limit}`);

        const data = await AnalyticsService.getHotTopics(dateRange, category, source, limit);

        res.status(200).json({
            message: 'Topics analytics retrieved successfully',
            data
        });
    } catch (error) {
        handleControllerError(res, error, getTopicsAnalytics.name);
    }
}

/**
 * Get timeline analytics
 * 
 * @route GET /api/analytics/timeline
 */
export async function getTimelineAnalytics(req: Request, res: Response): Promise<void> {
    try {
        const dateRange = (req.query.dateRange as 'today' | 'week' | 'month' | 'all') || 'week';
        const category = req.query.category as string | undefined;
        const source = req.query.source as string | undefined;
        const granularity = (req.query.granularity as 'hour' | 'day' | 'week') || 'day';

        logger.info(`Fetching timeline analytics: range=${dateRange}, granularity=${granularity}`);

        const data = await AnalyticsService.getTimeline(dateRange, category, source, granularity);

        res.status(200).json({
            message: 'Timeline analytics retrieved successfully',
            data
        });
    } catch (error) {
        handleControllerError(res, error, getTimelineAnalytics.name);
    }
}
