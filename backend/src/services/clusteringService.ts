// src/services/clusteringService.ts
import { ProcessedArticleData } from '@/types/rss';

export class ClusteringService {
    /**
     * Calcualtes the Jaccard Similarity between two strings.
     * Simple "Zero Token" approach based on word sets.
     */
    public static calculateSimilarity(text1: string, text2: string): number {
        const set1 = new Set(this.tokenize(text1));
        const set2 = new Set(this.tokenize(text2));

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return intersection.size / union.size;
    }

    /**
     * Tokenizes and cleans a string for similarity comparison.
     */
    private static tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
            .split(/\s+/)
            .filter(word => word.length > 3); // Ignore stop words and short junk
    }

    /**
     * Checks if a new article belongs to an existing cluster.
     * Returns the cluster ID if a match is found, otherwise null.
     */
    public static findMatch(newArticle: ProcessedArticleData, existingArticles: ProcessedArticleData[], threshold: number = 0.4): string | null {
        for (const article of existingArticles) {
            const similarity = this.calculateSimilarity(newArticle.title, article.title);
            if (similarity >= threshold) {
                return article.clusterId || article._id?.toString() || null;
            }
        }
        return null;
    }
}
