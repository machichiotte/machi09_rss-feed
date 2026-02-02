import { Router, Request, Response } from 'express';
import { UserRepository } from '@/repositories/userRepository';
import logger from '@/utils/logger';

const router: Router = Router();

/**
 * GET /api/user/:userId/profile
 */
router.get('/:userId/profile', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId as string;
        const profile = await UserRepository.getProfile(userId);

        if (!profile) {
            return res.json({
                bookmarks: [],
                customTags: [],
                settings: null
            });
        }

        res.json(profile);
    } catch (error) {
        logger.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * POST /api/user/:userId/profile
 */
router.post('/:userId/profile', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId as string;
        const data = req.body;
        await UserRepository.updateProfile(userId, data);
        res.json({ success: true });
    } catch (error) {
        logger.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * POST /api/user/:userId/bookmarks/toggle
 */
router.post('/:userId/bookmarks/toggle', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId as string;
        const { articleId } = req.body;

        if (!articleId) {
            return res.status(400).json({ error: 'articleId is required' });
        }

        const bookmarks = await UserRepository.toggleBookmark(userId, articleId);
        res.json({ bookmarks });
    } catch (error) {
        logger.error('Error toggling bookmark:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * GET /api/user/:userId/briefing
 */
import { getDailyBriefing } from '@/controllers/briefingController';
router.get('/:userId/briefing', getDailyBriefing);

export default router;
