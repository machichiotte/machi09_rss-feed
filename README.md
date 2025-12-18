# 📰 MachiFeed - Intelligent RSS Aggregator

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-18%2B-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)

> **Note:** This project has been extracted from [machi00_shad](https://github.com/machichiotte/machi00_shad) and is now a standalone application with a full-stack architecture.

**MachiFeed** is a powerful RSS feed aggregator designed to fetch, process, and analyze financial and crypto news from multiple sources. It features a Node.js/Express backend with MongoDB storage and a modern Vue.js frontend for visualization.

---

## 🚀 Features

- **⚡ High-Performance Fetching**: Parallelized feed retrieval (batch processing) for maximum speed.
- **🔄 Asynchronous Processing**: "Fetch First, Analyze Later" strategy. Articles appear instantly in the UI while AI analysis runs in the background.
- **🧠 Smart AI Analysis**: Local sentiment analysis (Bullish/Bearish) using `transformers.js` (running as a background worker).
- **� Robust Logging**: Detailed persistent logging (`error.log`, `combined.log`) with automatic circular structure handling.
- **�🔍 Advanced Filtering**: Filter by Source, Category, and AI Sentiment.
- **Dashboard UI**: Modern Vue.js + TailwindCSS dashboard with real-time stats and instant Dark Mode.

## 🛠 Tech Stack

- **Frontend**: Vue.js 3, Vite, TailwindCSS (v4), Lucide Icons
- **Backend**: Node.js, Express, TypeScript
- **AI Engine**: `@xenova/transformers` (Running locally, no API key required!)
- **Database**: MongoDB Atlas
- **RSS Engine**: rss-parser (configured with custom User-Agents and Timeouts)
- **Logging**: Winston + Node.js `util.inspect`

## 📂 Structure

```bash
machi09_rss-feed/
├── backend/            # Express API & Background Jobs
│   ├── src/
│   │   ├── config/     # Sources and App config
│   │   ├── services/   # RSS & AI Logic
│   │   └── utils/      # Logger & Helpers
│   ├── package.json
│   └── .env
├── frontend/           # Vue.js 3 + TailwindCSS UI
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── notes/              # Persistent logs and project notes
    └── machi09_rss-feed/logs/
```

## 🏁 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/machichiotte/machi09_rss-feed.git
cd machi09_rss-feed
```

### 2. Setup Backend
```bash
cd backend
yarn install

# Configure environment variables
cp .env.example .env
# Edit .env and add your MONGODB_URI
```

**Start the Backend:**
```bash
yarn dev
# Server running on http://localhost:3000
```

### 3. Setup Frontend
Open a new terminal:
```bash
cd frontend
yarn install

# Start the Frontend
yarn dev
# Dashboard running on http://localhost:5173
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/health` | Check server status |
| **GET** | `/api/rss` | Get processed articles |
| **POST** | `/api/rss/process` | Trigger manual feed fetch (asynchronous) |
| **GET** | `/api/rss/search` | Search articles (`?link=...`) |

---

## ⚙️ Configuration

- **RSS Sources**: List of feeds is in `backend/src/config/sources.ts`.
- **System Config**: Delays and categories are in `backend/src/config/rssConfig.ts`.
- **Logs**: Logs are automatically saved in `notes/machi09_rss-feed/logs/`.
- **Cron Schedule**: Adjusted in your `.env` file via `RSS_CRON_SCHEDULE`.

---

## 👤 Author

**machichiotte** - [GitHub](https://github.com/machichiotte)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
