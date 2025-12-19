import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RssService } from '../rssService';
import { RssRepository } from '@/repositories/rssRepository';
import { aiService } from '../aiService';
import { rssConfig } from '@/config/rssConfig';
import { ProcessedArticleData, RssFeedConfig } from '@/types/rss';

const { mockParseURL } = vi.hoisted(() => ({
    mockParseURL: vi.fn()
}));

vi.mock('rss-parser', () => ({
    default: vi.fn().mockImplementation(() => ({
        parseURL: mockParseURL
    }))
}));

vi.mock('@/repositories/rssRepository', () => ({
    RssRepository: {
        findByLink: vi.fn(),
        save: vi.fn(),
        findPendingAnalysis: vi.fn(),
        updateById: vi.fn()
    }
}));

vi.mock('../aiService', () => ({
    aiService: {
        init: vi.fn().mockResolvedValue(undefined),
        analyzeArticle: vi.fn()
    }
}));

vi.mock('@/utils/logger', () => ({
    default: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() }
}));

// Helper for private method access
interface RssServiceInternal {
    isAnalyzing: boolean;
    fetchFeedOnly(feed: RssFeedConfig, category: string): Promise<number>;
    runBackgroundAnalysis(): Promise<void>;
}

const serviceInternal = RssService as unknown as RssServiceInternal;

describe('RssService Feed Fetching', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        serviceInternal.isAnalyzing = false;
    });

    it('should save new articles', async () => {
        const mockFeed = {
            items: [{ link: 'url1', title: 'T1', contentSnippet: 'S1', isoDate: '2023' }]
        };
        mockParseURL.mockResolvedValue(mockFeed);
        vi.mocked(RssRepository.findByLink).mockResolvedValue(null);

        const feed: RssFeedConfig = { url: 'u1', name: 'n1', enabled: true };
        const count = await serviceInternal.fetchFeedOnly(feed, 'cat');

        expect(count).toBe(1);
        expect(RssRepository.save).toHaveBeenCalled();
    });

    it('should skip existing articles', async () => {
        mockParseURL.mockResolvedValue({ items: [{ link: 'url1' }] });
        vi.mocked(RssRepository.findByLink).mockResolvedValue({ link: 'url1' } as ProcessedArticleData);

        const feed: RssFeedConfig = { url: 'u1', name: 'n1', enabled: true };
        const count = await serviceInternal.fetchFeedOnly(feed, 'cat');

        expect(count).toBe(0);
        expect(RssRepository.save).not.toHaveBeenCalled();
    });
});

describe('RssService Background Analysis', () => {
    it('should process pending articles', async () => {
        const pending = [{ _id: '1', title: 'T1', summary: 'S1', link: 'L1', fetchedAt: '2023' }];
        vi.mocked(RssRepository.findPendingAnalysis)
            .mockResolvedValueOnce(pending as unknown as ProcessedArticleData[])
            .mockResolvedValueOnce([]);

        vi.mocked(aiService.analyzeArticle).mockResolvedValue({
            analysis: { sentiment: 'bullish', sentimentScore: 0.9 },
            translations: {}
        });

        await serviceInternal.runBackgroundAnalysis();

        expect(aiService.init).toHaveBeenCalled();
        expect(RssRepository.updateById).toHaveBeenCalledWith('1', expect.objectContaining({
            analysis: { sentiment: 'bullish', sentimentScore: 0.9 }
        }));
    });
});

describe('RssService Orchestration', () => {
    it('should process all enabled feeds', async () => {
        const mockConfig = rssConfig as unknown as { categories: Record<string, RssFeedConfig[]> };
        mockConfig.categories = {
            'c1': [{ name: 'f1', url: 'u1', enabled: true }]
        };

        const fetchSpy = vi.spyOn(serviceInternal, 'fetchFeedOnly').mockResolvedValue(1);
        const analysisSpy = vi.spyOn(serviceInternal, 'runBackgroundAnalysis').mockImplementation(async () => { });

        const results = await RssService.processAllFeeds();

        expect(results.processed).toBe(1);
        expect(fetchSpy).toHaveBeenCalled();
        expect(analysisSpy).toHaveBeenCalled();
    });
});
