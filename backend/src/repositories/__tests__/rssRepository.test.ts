import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RssRepository } from '../rssRepository';
import { getDatabase } from '@/config/database';
import { Collection, Db } from 'mongodb';
import { ProcessedArticleData } from '@/types/rss';

vi.mock('@/config/database', () => ({
    getDatabase: vi.fn()
}));

// Mock simplifié satisfaisant à la fois Collection et Cursor pour les tests
const collectionMock = {
    find: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    toArray: vi.fn(),
    countDocuments: vi.fn(),
    findOne: vi.fn(),
    deleteMany: vi.fn(),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
};

const mockCollection = collectionMock as unknown as Collection;
const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollection)
} as unknown as Db;

describe('RssRepository Basic Operations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getDatabase).mockReturnValue(mockDb);
    });

    it('should fetch all articles with default parameters', async () => {
        vi.mocked(collectionMock.countDocuments).mockResolvedValue(100);
        vi.mocked(collectionMock.toArray).mockResolvedValue([{ title: 'Test Article' }]);

        const result = await RssRepository.fetchAll();

        expect(mockDb.collection).toHaveBeenCalled();
        expect(collectionMock.find).toHaveBeenCalledWith({});
        expect(result.total).toBe(100);
        expect(result.articles).toHaveLength(1);
    });

    it('should find article by link', async () => {
        vi.mocked(collectionMock.findOne).mockResolvedValue({ link: 'http://link.com' });

        const result = await RssRepository.findByLink('http://link.com');

        expect(collectionMock.findOne).toHaveBeenCalledWith({ link: 'http://link.com' });
        expect(result?.link).toBe('http://link.com');
    });
});

describe('RssRepository Specialized Queries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getDatabase).mockReturnValue(mockDb);
    });

    it('should find pending analysis articles', async () => {
        vi.mocked(collectionMock.toArray).mockResolvedValue([{ title: 'Pending' }]);

        const result = await RssRepository.findPendingAnalysis(10);

        expect(collectionMock.find).toHaveBeenCalledWith({ analysis: null });
        expect(collectionMock.limit).toHaveBeenCalledWith(10);
        expect(result).toHaveLength(1);
    });

    it('should save an article', async () => {
        const article = { title: 'New' } as ProcessedArticleData;
        await RssRepository.save(article);

        expect(collectionMock.insertOne).toHaveBeenCalledWith(article);
    });
});
