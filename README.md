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

- **Automated Fetching**: Cron-based scheduler to fetch feeds every 30 minutes.
- **Smart Processing**: Extracts entities, sentiment (planned), and categorizes content.
- **REST API**: Clean API to manage and query articles.
- **Modern UI**: Vue.js + TailwindCSS dashboard to view and filter news.
- **MongoDB Storage**: Persists articles with flexible schema.

## 🏗 Project Structure

```bash
machi09_rss-feed/
├── backend/            # Express API & Cron Jobs
│   ├── src/
│   ├── package.json
│   └── .env
├── frontend/           # Vue.js 3 + TailwindCSS UI
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── README.md
└── LICENSE
```

## 🛠 Prerequisites

- **Node.js**: v18+
- **Yarn** or **NPM**
- **MongoDB Atlas** Account

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
npm install

# Start the Frontend
npm run dev
# Dashboard running on http://localhost:5173
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/health` | Check server status |
| **GET** | `/api/rss` | Get processed articles |
| **POST** | `/api/rss/process` | Trigger manual feed fetch |
| **GET** | `/api/rss/search` | Search articles (`?link=...`) |

## 📊 Usage

1. **Dashboard**: Go to `http://localhost:5173` to browse news.
2. **Refresh**: Click "Refresh Feeds" in the UI to trigger a new fetch.
3. **Filters**: Use the sidebar to filter by category (Crypto, Tech, Finance).

---

## ⚙️ Configuration

**RSS Feeds** are configured in `backend/src/config/rssConfig.ts`.
You can add/remove feeds or change categories there.

**Cron Schedule** is in `.env`:
```env
RSS_CRON_SCHEDULE="*/30 * * * *" # Every 30 minutes
```

---

## 👤 Author

**machichiotte**

- GitHub: [@machichiotte](https://github.com/machichiotte)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
