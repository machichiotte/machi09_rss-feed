import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from './logger';

/**
 * Service to extract the main text content from a news article URL.
 * Designed to bypass noise like ads, navigation, and footers.
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
                timeout: 10000, // 10s cutoff
            });

            if (response.status !== 200) return null;

            const $ = cheerio.load(response.data);

            // 1. Remove obvious noise
            $('script, style, nav, footer, header, aside, .ads, .advertisement, .social-share, .comments').remove();

            // 2. Targeted Selection (Ordered by likelihood of quality)
            // We search for the main article body first
            const selectors = [
                'article',
                '[role="main"]',
                'main',
                '.article-content',
                '.post-content',
                '.entry-content',
                '.content'
            ];

            let content = '';
            for (const selector of selectors) {
                const element = $(selector);
                if (element.length > 0) {
                    // Extract text from paragraphs within this element
                    content = element.find('p').map((_, el) => $(el).text().trim()).get().join('\n\n');
                    if (content.length > 200) break; // Found something substantial
                }
            }

            // 3. Fallback: just get all paragraphs if targeted selectors failed
            if (content.length < 200) {
                content = $('p').map((_, el) => $(el).text().trim()).get().join('\n\n');
            }

            // 4. Final cleaning: remove excessive whitespace
            const cleanContent = content
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

            const $ = cheerio.load(response.data);

            const metaImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
            if (metaImage) return metaImage;

            return this.findSignificantImage($);
        } catch {
            return null;
        }
    }

    private static findSignificantImage($: cheerio.CheerioAPI): string | null {
        const selectors = ['article img', '.article-header img', '.post-thumbnail img', '.entry-content img', 'main img'];
        for (const selector of selectors) {
            const src = $(selector).first().attr('src');
            if (src && (src.startsWith('http') || src.startsWith('//'))) {
                return src.startsWith('//') ? `https:${src}` : src;
            }
        }
        return null;
    }
}
