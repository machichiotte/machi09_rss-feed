# 🧠 Kognit - Intelligent RSS Aggregator

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-18%2B-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)

![Dockerify](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

> **Note:** This project has been extracted from [machi01_shad](https://github.com/machichiotte/machi01_shad) and is now a standalone application with a full-stack architecture.

**Kognit** is a powerful RSS feed aggregator designed to fetch, process, and analyze financial and crypto news from multiple sources. It features a Node.js/Express backend with MongoDB storage and a modern Vue.js frontend for visualization.

---

## 🚀 Features

- **⚡ High-Performance Fetching**: Parallelized feed retrieval (batch processing) for maximum speed.
- **🔄 Asynchronous Processing**: "Fetch First, Analyze Later" strategy.
- **🧠 Smart AI Analysis**: Local sentiment analysis (Bullish/Bearish) using `transformers.js`.
- **📜 Server-Side Pagination**: Efficiently handles 2000+ articles with MongoDB-powered pagination.
- **♾️ Infinite Scroll**: Seamless frontend experience that loads content as you scroll.
- **🔍 Advanced Filtering**: Server-side filtering by Source, Category, Language, and Sentiment.
- **🌓 Dynamic Design**: Modern dashboard with responsive layout and instant Dark Mode.
- **🐳 Docker Support**: Fully containerized with Docker and Docker Compose.

## 🛠 Tech Stack

- **Frontend**: Vue.js 3, Vite, TailwindCSS (v4), Lucide Icons
- **Backend**: Node.js, Express, TypeScript
- **AI Engine**: `@xenova/transformers` (Running locally, no API key required!)
- **Database**: MongoDB (Atlas or Local via Docker)
- **Infrastructure**: Docker, Nginx (for serving the frontend)
- **RSS Engine**: rss-parser (configured with custom User-Agents and Timeouts)
- **Logging**: Winston + Node.js `util.inspect`
- **Quality**: Husky + Lint-Staged (Pre-commit hooks for linting & complexity)

## 📂 Structure

```bash
machi09_rss-feed/
├── backend/            # Express API & Background Jobs
│   ├── src/
│   │   ├── config/     # Sources and App config
│   │   ├── services/   # RSS & AI Logic
│   │   └── scripts/    # Pre-download models & utilities
│   ├── Dockerfile
│   └── package.json
├── frontend/           # Vue.js 3 + TailwindCSS UI
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf      # Production server config
├── docker-compose.yml  # Orchestrates MongoDB, API, and Frontend
└── README.md
```

## 🏁 Quick Start

### 🐳 The Easy Way (Docker)

The fastest way to get started is using Docker Compose. This starts MongoDB, the Backend, and the Frontend simultaneously.

1. **Clone the repository**
```bash
git clone https://github.com/machichiotte/machi09_rss-feed.git
cd machi09_rss-feed
```

2. **Configure Environment**
```bash
cp backend/.env.example backend/.env
# If using Docker, the default MONGODB_URI/DB_HOST in .env should point to 'mongodb'
```

3. **Run with Docker**
```bash
docker compose up --build
```
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api

---

### 🛠 Manual Setup (Development)

#### 1. Setup Backend
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

#### 2. Setup Frontend
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
| **GET** | `/api/rss` | Get paginated articles (`?page=1&limit=24&category=...`) |
| **GET** | `/api/rss/metadata` | Get available filter options (categories, sources, lang) |
| **POST** | `/api/rss/process` | Trigger manual feed fetch (asynchronous) |
| **GET** | `/api/rss/search` | Search articles (`?link=...`) |

---

## ⚙️ Configuration

- **RSS Sources**: List of feeds is in `backend/src/config/sources.ts`.
- **System Config**: Delays and categories are in `backend/src/config/rssConfig.ts`.
- **Cron Schedule**: Adjusted in your `.env` file via `RSS_CRON_SCHEDULE`.
- **AI Optimization**: AI models are pre-downloaded during Docker build to `models_cache` for instant startup.

---

## 👤 Author

**machichiotte** - [GitHub](https://github.com/machichiotte)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
