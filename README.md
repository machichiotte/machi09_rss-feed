# 📰 machi09_rss-feed - RSS Feed Aggregator & Processor

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)

> Intelligent RSS feed aggregator with AI-powered content analysis and summarization

## 🎯 Overview

machi09_rss-feed is a powerful RSS feed aggregator extracted from the machi00-shad project. It collects articles from multiple RSS feeds, processes them, and provides intelligent analysis using AI.

### ✨ Key Features

- 📡 **Multi-Feed Aggregation** - Collect from multiple RSS sources simultaneously
- 🤖 **AI-Powered Analysis** - Automatic content summarization and sentiment analysis
- 🗄️ **MongoDB Storage** - Persistent storage of articles and metadata
- ⏱️ **Scheduled Processing** - Automated feed checking with cron jobs
- 🔍 **Content Scraping** - Full article extraction when RSS content is insufficient
- 📊 **RESTful API** - Easy integration with other applications
- 🏷️ **Category Management** - Organize feeds by categories

## 📁 Project Structure

```
machi09_rss-feed/
├── src/
│   ├── controllers/      # API controllers
│   ├── services/         # Business logic (RSS processing, fetching)
│   ├── repositories/     # Database access layer
│   ├── routes/           # API routes
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── config/           # Configuration files
│   └── index.ts          # Application entry point
├── tests/                # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **Yarn** >= 1.22.x
- **MongoDB** >= 6.x

### Installation

```bash
# Clone or navigate to the project
cd machi09_rss-feed

# Install dependencies
yarn install
```

### Configuration

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rss_feed
# Or MongoDB Atlas
MONGODB_USER=your_username
MONGODB_PASSWORD=your_password
MONGODB_CLUSTER=your_cluster
MONGODB_DATABASE=rss_feed

# RSS Configuration
RSS_ENABLED=true
RSS_DELAY_BETWEEN_ARTICLES_MS=2000
RSS_DELAY_BETWEEN_FEEDS_MS=5000
RSS_MIN_CONTENT_LENGTH=200
RSS_SCRAPE_RETRY_DELAY_MS=3000

# Cron Schedule (every 30 minutes)
RSS_CRON_SCHEDULE=*/30 * * * *

# Optional: AI Analysis (if using Gemini or similar)
GEMINI_API_KEY=your_api_key
GEMINI_REQUEST_DELAY_MS=1000
```

### Launch

```bash
# Development mode with hot reload
yarn dev

# Build for production
yarn build

# Run production build
yarn start
```

## 📡 API Endpoints

### Get All RSS Articles

```http
GET /api/rss/get
```

Returns all processed RSS articles from the database.

**Response:**
```json
{
  "message": "Données Rss récupérées avec succès",
  "data": [
    {
      "_id": "...",
      "title": "Article Title",
      "link": "https://...",
      "publicationDate": "2024-01-01T00:00:00Z",
      "sourceFeed": "https://feed.url/rss",
      "feedName": "Feed Name",
      "category": "News",
      "summary": "Article summary...",
      "analysis": {
        "isRelevant": "Yes",
        "financialSentiment": "Positive",
        "mentionedAssets": ["BTC", "ETH"]
      }
    }
  ]
}
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.5
- **Database**: MongoDB 6.3
- **RSS Parser**: rss-parser 3.13
- **Web Scraping**: Cheerio 1.0
- **Scheduling**: node-cron 3.0
- **Logging**: Winston 3.11
- **API Framework**: Express.js 4.18

## 📝 RSS Feed Configuration

Edit the RSS feed sources in your configuration file:

```typescript
{
  "rssConfig": {
    "enabled": true,
    "categories": {
      "Crypto News": [
        {
          "name": "CoinDesk",
          "url": "https://www.coindesk.com/arc/outboundfeeds/rss/",
          "enabled": true
        },
        {
          "name": "CoinTelegraph",
          "url": "https://cointelegraph.com/rss",
          "enabled": true
        }
      ],
      "Tech News": [
        {
          "name": "TechCrunch",
          "url": "https://techcrunch.com/feed/",
          "enabled": true
        }
      ]
    }
  }
}
```

## 🧪 Testing

```bash
# Run tests
yarn test

# Run tests with coverage
yarn test --coverage
```

## 🔒 Security

- ✅ Environment variables for sensitive data
- ✅ Helmet for HTTP security headers
- ✅ CORS configuration
- ✅ Input validation
- ✅ Rate limiting on API endpoints

## 📊 Features Roadmap

- [ ] WebSocket support for real-time updates
- [ ] Advanced filtering and search
- [ ] User authentication and personalized feeds
- [ ] Email notifications for specific keywords
- [ ] Export to various formats (JSON, CSV, PDF)
- [ ] Dashboard UI for feed management
- [ ] Multi-language support
- [ ] Duplicate detection

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Machi Chiotte**

- GitHub: [@machichiotte](https://github.com/machichiotte)
- Email: [machichiotte@gmail.com](mailto:machichiotte@gmail.com)

## 🙏 Acknowledgments

This project was extracted from [machi00-shad](https://github.com/machichiotte/machi00_shad), a full-stack cryptocurrency trading platform.

---

⭐ If you find this project useful, please give it a star!
