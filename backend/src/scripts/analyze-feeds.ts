
import Parser from 'rss-parser';

// Custom parser
const parser = new Parser({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    customFields: {
        item: [
            ['media:content', 'mediaContent'],
            ['media:thumbnail', 'mediaThumbnail'],
            ['content:encoded', 'contentEncoded'],
            ['dc:creator', 'creator'],
            ['dc:date', 'date'],
            ['content', 'content'],
            ['description', 'description'],
            ['enclosure', 'enclosure'],
            ['image', 'image'],
            ['category', 'category'], // Standard RSS category
            ['dc:subject', 'dcSubject'], // Dublin Core subject/category
        ]
    }
});

const feedsToTest = [
    'https://www.cnbc.com/id/10000664/device/rss/rss.html',
    'https://techcrunch.com/feed/',
    'https://cryptoast.fr/feed/',
    'https://www.numerama.com/feed',
    'https://coinacademy.fr/actu?feed=gn'
];

async function analyzeFeeds() {
    console.log('🔍 Analyzing Missing Images & Categories...\n');

    for (const url of feedsToTest) {
        console.log(`\n---------------------------------------------------`);
        console.log(`📡 Analyzing: ${url}`);
        try {
            const feed = await parser.parseURL(url);
            console.log(`✅ Title: ${feed.title}`);

            if (feed.items.length === 0) {
                console.log('⚠️ No items found.');
                continue;
            }

            const item = feed.items[0];
            console.log(`📝 First Item: ${item.title}`);

            // --- Categories ---
            console.log(`🏷️ Categories (standard): ${JSON.stringify(item.categories)}`);
            // @ts-ignore
            if (item.category) console.log(`🏷️ Category (custom): ${JSON.stringify(item.category)}`);
            // @ts-ignore
            if (item.dcSubject) console.log(`🏷️ DC:Subject: ${JSON.stringify(item.dcSubject)}`);

            // --- Images ---
            if (item.enclosure) console.log(`   👉 enclosure: ${JSON.stringify(item.enclosure)}`);
            // @ts-ignore
            if (item.mediaContent) console.log(`   👉 media:content: ${JSON.stringify(item.mediaContent)}`);
            // @ts-ignore
            if (item.mediaThumbnail) console.log(`   👉 media:thumbnail: ${JSON.stringify(item.mediaThumbnail)}`);
            // @ts-ignore
            if (item.image) console.log(`   👉 image: ${JSON.stringify(item.image)}`);

            const checkHtmlImage = (html: string, source: string) => {
                if (!html) return;
                const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (imgMatch) {
                    console.log(`   👉 Found <img> in ${source}: ${imgMatch[1].substring(0, 80)}...`);
                }
            };

            // @ts-ignore
            checkHtmlImage(item.contentEncoded, 'content:encoded');
            checkHtmlImage(item.content, 'content');
            checkHtmlImage(item.description, 'description');

        } catch (error) {
            // @ts-ignore
            console.error(`❌ Failed: ${error.message}`);
        }
    }
}

analyzeFeeds();
