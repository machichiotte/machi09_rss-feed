import { RssCategoryConfig } from '@/types/rss';

export const rssConfig = {
    enabled: process.env.RSS_ENABLED === 'true',
    delayBetweenArticlesMs: parseInt(process.env.RSS_DELAY_BETWEEN_ARTICLES_MS || '2000'),
    delayBetweenFeedsMs: parseInt(process.env.RSS_DELAY_BETWEEN_FEEDS_MS || '5000'),
    minContentLengthForScraping: parseInt(process.env.RSS_MIN_CONTENT_LENGTH || '250'),
    scrapeRetryDelayMs: parseInt(process.env.RSS_SCRAPE_RETRY_DELAY_MS || '1000'),
    geminiRequestDelayMs: parseInt(process.env.GEMINI_REQUEST_DELAY_MS || '8000'),

    categories: {
        'Crypto News': [
            // Major English
            { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', enabled: true },
            { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss', enabled: true },
            { name: 'Decrypt', url: 'https://decrypt.co/feed', enabled: true },
            { name: 'Crypto Briefing', url: 'https://cryptobriefing.com/feed/', enabled: true },
            { name: 'CoinJournal', url: 'https://coinjournal.net/feed/', enabled: true },

            // French Crypto
            { name: 'CoinTribune', url: 'https://www.cointribune.com/feed/', enabled: false }, // Often heavy
            { name: 'Cryptoast', url: 'https://cryptoast.fr/feed/', enabled: true },
            { name: 'Journal du Coin', url: 'https://journalducoin.com/feed/', enabled: true },
            { name: 'BeInCrypto FR', url: 'https://fr.beincrypto.com/feed/', enabled: true },
            { name: 'Coin Academy', url: 'https://coinacademy.fr/actu?feed=gn', enabled: true },

            // International
            { name: 'Cointelegraph China', url: 'https://cn.cointelegraph.com/rss', enabled: true },
            { name: 'Cointelegraph Japan', url: 'https://jp.cointelegraph.com/rss', enabled: true },
            { name: 'CoinPost (JP)', url: 'https://coinpost.jp/?feed=rss2', enabled: true },
            { name: 'Cointelegraph Arabic', url: 'https://ar.cointelegraph.com/rss', enabled: true },
        ],
        'Finance': [
            { name: 'CNBC Finance', url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', enabled: true },
            { name: 'Finance et Investissement', url: 'https://www.finance-investissement.com/rss/', enabled: true },
            { name: 'Actu Finance', url: 'https://www.actufinance.fr/feed/', enabled: true },
            { name: 'Le Figaro Économie', url: 'https://www.lefigaro.fr/rss/figaro_economie.xml', enabled: true },
            { name: 'Capital Finance', url: 'https://www.capitalfinance.fr/rss', enabled: true },
            { name: 'Bloomberg Wealth', url: 'https://feeds.bloomberg.com/wealth/news.rss', enabled: true },
            { name: 'WSJ Business', url: 'https://feeds.content.dowjones.io/public/rss/WSJcomUSBusiness', enabled: true },
        ],
        'Tech News': [
            { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', enabled: true },
            { name: 'Wired', url: 'https://www.wired.com/feed/rss', enabled: true },
            { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', enabled: true },
            { name: 'Bloomberg Technology', url: 'https://feeds.bloomberg.com/technology/news.rss', enabled: true },

            // French Tech
            { name: '01net', url: 'https://www.01net.com/actualites/feed/', enabled: true },
            { name: 'Frandroid', url: 'https://www.frandroid.com/feed', enabled: true },
            { name: 'Numerama', url: 'https://www.numerama.com/feed', enabled: true },
            { name: 'Les Numériques', url: 'https://www.lesnumeriques.com/rss.xml', enabled: true },
            { name: 'ZDNet France', url: 'https://www.zdnet.fr/rss/', enabled: true },
            { name: 'Usine Digitale', url: 'https://www.usine-digitale.fr/rss.xml', enabled: true },
            { name: 'Next INpact', url: 'https://www.nextinpact.com/rss/news.xml', enabled: true },
            { name: 'Journal du Net', url: 'https://www.journaldunet.com/rss/', enabled: true },
        ],
        'General News': [
            { name: 'France 24 English', url: 'https://www.france24.com/en/rss', enabled: true },
            { name: 'Reuters Best', url: 'https://reutersbest.com/feed/', enabled: true },
            { name: 'AFP Actualités', url: 'https://www.afp.com/fr/actus/afp_actualite/792,31,9,7,33/feed', enabled: true },
            { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/en_continu.xml', enabled: true },
            { name: 'Libération', url: 'https://www.liberation.fr/rss/dernieres-infos/', enabled: true },
            { name: '20 Minutes', url: 'https://www.20minutes.fr/feeds/rss-20minutes_fr_articles.xml', enabled: true },
        ],
        'Politics': [
            { name: 'Bloomberg Politics', url: 'https://feeds.bloomberg.com/politics/news.rss', enabled: true },
            { name: 'Le Monde Politique', url: 'https://www.lemonde.fr/politique/rss_full.xml', enabled: true },
        ]
    } as RssCategoryConfig,
};

export const databaseConfig = {
    collection: {
        rssArticles: 'rssArticles',
    },
};
