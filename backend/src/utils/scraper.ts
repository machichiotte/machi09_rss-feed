import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import logger from './logger';

/**
 * Service to extract the main text content from a news article URL.
 * Designed to bypass noise like ads, navigation, and footers using Readability engine.
 */
export class ScraperService {
    private static USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    /**
     * Fetches the URL and extracts the meaningful text content.
     */
    public static async extractFullText(url: string): Promise<string | null> {
        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': this.USER_AGENT },
                timeout: 15000, // Slightly longer timeout for deep scraping
            });

            if (response.status !== 200) return null;

            const dom = new JSDOM(response.data, { url });
            const reader = new Readability(dom.window.document);
            const article = reader.parse();

            if (!article || !article.textContent) {
                logger.warn(`⚠️ Readability failed to parse content for ${url}`);
                return null;
            }

            const cleanContent = article.textContent
                .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines
                .trim();

            if (cleanContent.length < 100) {
                logger.warn(`⚠️ Scraping resulted in very short content for ${url}`);
                return null;
            }

            return cleanContent;
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`❌ Error scraping ${url}: ${msg}`);
            return null;
        }
    }

    /**
     * Attempts to extract the main image from an article URL.
     */
    public static async extractMainImage(url: string): Promise<string | null> {
        try {
            const response = await axios.get(url, { headers: { 'User-Agent': this.USER_AGENT }, timeout: 8000 });
            if (response.status !== 200) return null;

            const dom = new JSDOM(response.data, { url });
            const doc = dom.window.document;

            return this.getImageFromMeta(doc) || this.getImageFromContent(doc);
        } catch {
            return null;
        }
    }

    private static getImageFromMeta(doc: any): string | null { // eslint-disable-line @typescript-eslint/no-explicit-any
        return doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
            doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
            null;
    }

    private static getImageFromContent(doc: any): string | null { // eslint-disable-line @typescript-eslint/no-explicit-any
        const mainImg = doc.querySelector('article img, main img, .content img');
        if (mainImg) {
            const src = mainImg.getAttribute('src');
            if (src && (src.startsWith('http') || src.startsWith('//'))) {
                return src.startsWith('//') ? `https:${src}` : src;
            }
        }
        return null;
    }
}
