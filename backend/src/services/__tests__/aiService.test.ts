import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from '../aiService';
import { pipeline } from '@xenova/transformers';

interface AiServiceInternal {
    isInitialized: boolean;
    sentimentPipeline: unknown;
}

const serviceInternal = aiService as unknown as AiServiceInternal;

vi.mock('@xenova/transformers', () => ({
    pipeline: vi.fn(),
    env: { cacheDir: '' }
}));

vi.mock('@/utils/logger', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn()
    }
}));

const mockPipeline = vi.mocked(pipeline);

describe('AiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        serviceInternal.isInitialized = false;
        serviceInternal.sentimentPipeline = null;
    });

    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            const mockFn = vi.fn();
            mockPipeline.mockResolvedValue(mockFn as unknown as never);
            await aiService.init();
            expect(mockPipeline).toHaveBeenCalled();
            expect(serviceInternal.isInitialized).toBe(true);
        });
    });

    describe('Sentiment Analysis', () => {
        it('should analyze correctly', async () => {
            const mockFn = vi.fn().mockResolvedValue([{ label: 'POSITIVE', score: 0.99 }]);
            mockPipeline.mockResolvedValue(mockFn as unknown as never);

            const result = await aiService.analyzeSentiment('test');
            expect(result?.label).toBe('POSITIVE');
        });

        it('should truncate text', async () => {
            const mockFn = vi.fn().mockResolvedValue([{ label: 'POSITIVE', score: 0.9 }]);
            mockPipeline.mockResolvedValue(mockFn as unknown as never);

            await aiService.analyzeSentiment('a'.repeat(1000));
            expect(mockFn).toHaveBeenCalledWith('a'.repeat(512));
        });
    });

    describe('Article Analysis', () => {
        it('should map to bullish/bearish', async () => {
            const mockFn = vi.fn().mockResolvedValue([{ label: 'NEGATIVE', score: 0.8 }]);
            mockPipeline.mockResolvedValue(mockFn as unknown as never);

            const result = await aiService.analyzeArticle('title', 'summary');
            expect(result.analysis.sentiment).toBe('bearish');
            expect(result.analysis.sentimentScore).toBe(0.8);
        });
    });
});
