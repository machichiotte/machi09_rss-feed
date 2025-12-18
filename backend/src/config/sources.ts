import { RssCategoryConfig } from '@/types/rss';

export const rssSources: RssCategoryConfig = {
    'Crypto News': [
        // English - Major
        { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', enabled: true, language: 'en' },
        { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss', enabled: true, language: 'en' },
        { name: 'Decrypt', url: 'https://decrypt.co/feed', enabled: true, language: 'en' },
        { name: 'The Block', url: 'https://www.theblock.co/feed/', enabled: false, language: 'en' }, // Often limited
        { name: 'Crypto Briefing', url: 'https://cryptobriefing.com/feed/', enabled: true, language: 'en' },
        { name: 'CoinJournal', url: 'https://coinjournal.net/feed/', enabled: true, language: 'en' },
        { name: 'NewsBTC', url: 'https://www.newsbtc.com/feed/', enabled: true, language: 'en' },
        { name: 'CryptoSlate', url: 'https://cryptoslate.com/feed/', enabled: false, language: 'en' }, // Status code 403 (Forbidden)
        { name: 'AMBCrypto', url: 'https://ambcrypto.com/feed/', enabled: false, language: 'en' }, // Request timed out recently
        { name: 'U.Today', url: 'https://u.today/rss', enabled: true, language: 'en' },
        { name: 'NullTX', url: 'https://nulltx.com/feed/', enabled: true, language: 'en' },
        { name: 'ZyCrypto', url: 'https://zycrypto.com/feed/', enabled: true, language: 'en' },
        { name: 'Coin Quora', url: 'https://coinquora.com/feed/', enabled: false, language: 'en' }, // Consistently timing out
        { name: 'Blockworks', url: 'https://blockworks.co/feed/', enabled: true, language: 'en' },

        // French
        { name: 'CoinTribune', url: 'https://www.cointribune.com/feed/', enabled: false, language: 'fr' }, // heavy
        { name: 'Cryptoast', url: 'https://cryptoast.fr/feed/', enabled: true, language: 'fr' },
        { name: 'Journal du Coin', url: 'https://journalducoin.com/feed/', enabled: true, language: 'fr' },
        { name: 'BeInCrypto FR', url: 'https://fr.beincrypto.com/feed/', enabled: true, language: 'fr' },
        { name: 'Coin Academy', url: 'https://coinacademy.fr/actu?feed=gn', enabled: true, language: 'fr' },

        // Spanish
        { name: 'Cointelegraph ES', url: 'https://es.cointelegraph.com/rss', enabled: true, language: 'es' },
        { name: 'Bitcoin.es', url: 'https://bitcoin.es/feed/', enabled: true, language: 'es' },
        { name: 'BeInCrypto ES', url: 'https://es.beincrypto.com/feed/', enabled: true, language: 'es' },
        { name: 'DiarioBitcoin', url: 'https://www.diariobitcoin.com/feed/', enabled: true, language: 'es' },
        { name: 'CriptoNoticias', url: 'https://www.criptonoticias.com/feed/', enabled: true, language: 'es' },
        { name: 'Xataka Cripto', url: 'https://www.xataka.com/feedburner.xml', enabled: true, language: 'es' },

        // German
        { name: 'Cointelegraph DE', url: 'https://de.cointelegraph.com/rss', enabled: true, language: 'de' },
        { name: 'BeInCrypto DE', url: 'https://de.beincrypto.com/feed/', enabled: true, language: 'de' },
        { name: 'BTC-ECHO', url: 'https://www.btc-echo.de/feed/', enabled: true, language: 'de' },

        // Portuguese (Brazil)
        { name: 'Cointelegraph BR', url: 'https://br.cointelegraph.com/rss', enabled: true, language: 'pt' },
        { name: 'BeInCrypto BR', url: 'https://br.beincrypto.com/feed/', enabled: true, language: 'pt' },
        { name: 'CriptoFácil', url: 'https://www.criptofacil.com/feed/', enabled: true, language: 'pt' },
        { name: 'Livecoins', url: 'https://livecoins.com.br/feed/', enabled: true, language: 'pt' },
        { name: 'Portal do Bitcoin', url: 'https://portaldobitcoin.uol.com.br/feed/', enabled: false, language: 'pt' }, // Status code 403 (Forbidden)

        // Arabic
        { name: 'Cointelegraph Arabic', url: 'https://ar.cointelegraph.com/rss', enabled: true, language: 'ar' },
        { name: 'Arab Bitcoin', url: 'https://arab-btc.net/feed/', enabled: true, language: 'ar' },
        { name: 'Bitcoin News AE', url: 'https://bitcoinnews.ae/feed/', enabled: true, language: 'ar' },
        { name: 'Arabbit', url: 'https://arabbit.net/feed/', enabled: true, language: 'ar' },

        // Asian Markets
        { name: 'Cointelegraph CN', url: 'https://cn.cointelegraph.com/rss', enabled: true, language: 'zh' },
        { name: 'Cointelegraph JP', url: 'https://jp.cointelegraph.com/rss', enabled: true, language: 'ja' },
        { name: 'CoinPost', url: 'https://coinpost.jp/?feed=rss2', enabled: true, language: 'ja' },
        { name: 'CoinChoice', url: 'https://coinchoice.net/feed/', enabled: true, language: 'ja' },
        { name: 'BTCN', url: 'https://btcnews.jp/feed', enabled: false, language: 'ja' },
    ],
    'Finance': [
        // English
        { name: 'CNBC Finance', url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', enabled: true, language: 'en' },
        { name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss', enabled: true, language: 'en' },
        { name: 'Bloomberg Wealth', url: 'https://feeds.bloomberg.com/wealth/news.rss', enabled: true, language: 'en' },
        { name: 'WSJ Business', url: 'https://feeds.content.dowjones.io/public/rss/WSJcomUSBusiness', enabled: true, language: 'en' },
        { name: 'Dow Jones Markets', url: 'https://feeds.content.dowjones.io/public/rss/RSSMarketsMain', enabled: true, language: 'en' },
        { name: 'Investing UK', url: 'https://uk.investing.com/rss/news/cryptocurrency.rss', enabled: false, language: 'en' }, // Specific crypto
        { name: 'Investing AU', url: 'https://au.investing.com/rss/news/cryptocurrency.rss', enabled: false, language: 'en' },

        // French
        { name: 'Finance et Investissement', url: 'https://www.finance-investissement.com/rss/', enabled: true, language: 'fr' },
        { name: 'Actu Finance', url: 'https://www.actufinance.fr/feed/', enabled: true, language: 'fr' },
        { name: 'Le Figaro Économie', url: 'https://www.lefigaro.fr/rss/figaro_economie.xml', enabled: true, language: 'fr' },
        { name: 'Capital Finance', url: 'https://capitalfinance.lesechos.fr/rss', enabled: false, language: 'fr' }, // SSL or 403 issues recently
        { name: 'Boursier.com', url: 'https://www.boursier.com/rss/actualites/actualites.rss', enabled: false, language: 'fr' }, // Status code 403 (Forbidden)
        { name: 'L\'Opinion', url: 'https://www.lopinion.fr/abonnement/rss', enabled: false, language: 'fr' }, // URL frequently broken or restricted
    ],
    'Tech News': [
        // English
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', enabled: true, language: 'en' },
        { name: 'Wired', url: 'https://www.wired.com/feed/rss', enabled: true, language: 'en' },
        { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', enabled: true, language: 'en' },
        { name: 'Bloomberg Technology', url: 'https://feeds.bloomberg.com/technology/news.rss', enabled: true, language: 'en' },

        // French
        { name: '01net', url: 'https://www.01net.com/actualites/feed/', enabled: true, language: 'fr' },
        { name: 'Frandroid', url: 'https://www.frandroid.com/feed', enabled: false, language: 'fr' }, // Request timed out recently
        { name: 'Numerama', url: 'https://www.numerama.com/feed', enabled: true, language: 'fr' },
        { name: 'Les Numériques', url: 'https://www.lesnumeriques.com/rss.xml', enabled: true, language: 'fr' },
        { name: 'ZDNet France', url: 'https://www.zdnet.fr/rss/', enabled: true, language: 'fr' },
        { name: 'Usine Digitale', url: 'https://www.usine-digitale.fr/rss', enabled: true, language: 'fr' },
        { name: 'Next INpact', url: 'https://beta.next.ink/feed', enabled: false, language: 'fr' }, // Invalid character in entity name (XML error)
        { name: 'Journal du Net', url: 'https://www.journaldunet.com/rss/', enabled: true, language: 'fr' },
        { name: 'Clubic', url: 'https://www.clubic.com/rss/news.rss', enabled: true, language: 'fr' },
        { name: 'Siècle Digital', url: 'https://siecledigital.fr/feed/', enabled: true, language: 'fr' },
        { name: 'Phonandroid', url: 'https://www.phonandroid.com/feed', enabled: true, language: 'fr' },
        { name: 'CNET France', url: 'https://www.cnetfrance.fr/rss/news/', enabled: false, language: 'fr' }, // Status code 404
        { name: 'Developpez.com', url: 'https://www.developpez.com/index/rss/', enabled: true, language: 'fr' },
    ],
    'General News': [
        // English / International
        { name: 'France 24 English', url: 'https://www.france24.com/en/rss', enabled: true, language: 'en' },
        { name: 'Reuters Best', url: 'https://reutersbest.com/feed/', enabled: true, language: 'en' },
        { name: 'Reuters My News', url: 'https://www.reuters.com/my-news/feed/', enabled: false, language: 'en' }, // Status code 401 (Unauthorized)
        { name: 'FT UK', url: 'https://www.ft.com/rss/home/uk', enabled: true, language: 'en' },
        { name: 'Dow Jones World', url: 'https://feeds.content.dowjones.io/public/rss/RSSWorldNews', enabled: true, language: 'en' },

        // French
        { name: 'AFP Actualités', url: 'https://www.afp.com/fr/actus/afp_actualite/792,31,9,7,33/feed', enabled: true, language: 'fr' },
        { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/en_continu.xml', enabled: true, language: 'fr' },
        { name: 'Libération', url: 'https://www.liberation.fr/rss/', enabled: false, language: 'fr' }, // 410 or invalid recently; disabling for stability
        { name: '20 Minutes', url: 'https://www.20minutes.fr/feeds/rss-20minutes_fr_articles.xml', enabled: false, language: 'fr' }, // Status code 403 (Forbidden)
        { name: 'Le Figaro', url: 'http://www.lefigaro.fr/rss/figaro_actualites.xml', enabled: true, language: 'fr' },
        { name: 'L\'Express', url: 'https://www.lexpress.fr/rss/alaune.xml', enabled: true, language: 'fr' },
        { name: 'Le Point', url: 'https://www.lepoint.fr/24h-infos/rss.xml', enabled: false, language: 'fr' }, // Invalid character in tag name (XML error)
        { name: 'HuffPost FR', url: 'https://www.huffingtonpost.fr/feeds/index.xml', enabled: true, language: 'fr' },
        { name: 'Mediapart', url: 'https://www.mediapart.fr/articles/feed', enabled: true, language: 'fr' },
        { name: 'Ouest-France', url: 'https://www.ouest-france.fr/rss/une.xml', enabled: false, language: 'fr' }, // Status code 403 (Forbidden)
        { name: 'Le Parisien', url: 'https://feeds.leparisien.fr/leparisien/rss/actualites', enabled: false, language: 'fr' }, // Currently empty and causing parsing errors
        { name: 'Courrier International', url: 'https://www.courrierinternational.com/rss/rss_a_la_une.xml', enabled: false, language: 'fr' }, // Attribute without value (XML error)
    ],
    'Politics': [
        { name: 'Bloomberg Politics', url: 'https://feeds.bloomberg.com/politics/news.rss', enabled: true, language: 'en' },
        { name: 'Le Monde Politique', url: 'https://www.lemonde.fr/politique/rss_full.xml', enabled: true, language: 'fr' },
        { name: 'Dow Jones Politics', url: 'https://feeds.content.dowjones.io/public/rss/socialpoliticsfeed', enabled: true, language: 'en' },
    ]
};
