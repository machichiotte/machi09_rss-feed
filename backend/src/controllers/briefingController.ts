import { Request, Response } from 'express';
import { BriefingService } from '@/services/briefingService';
import { handleControllerError } from '@/utils/errorHandler';
import logger from '@/utils/logger';

/**
 * Generates and returns a global briefing for the user.
 */
export async function getDailyBriefing(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.params.userId as string;

        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }

        logger.info(`Briefing request for user: ${userId}`);
        const briefing = await BriefingService.generateDailyBriefing(userId);

        res.status(200).json(briefing);
    } catch (error) {
        handleControllerError(res, error, 'getDailyBriefing');
    }
}
