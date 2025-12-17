import { Response } from 'express';
import logger from './logger';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export function handleControllerError(
    res: Response,
    error: unknown,
    controllerName: string
): void {
    logger.error(`Error in ${controllerName}:`, error);

    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            error: error.message,
            statusCode: error.statusCode,
        });
    } else if (error instanceof Error) {
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    } else {
        res.status(500).json({
            error: 'Unknown error occurred',
        });
    }
}
