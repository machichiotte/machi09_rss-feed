---
title: Kognit Service
emoji: 🧠
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Kognit Service - Backend API

Intelligent RSS feed aggregator with automated fetching and sentiment analysis. Part of the **Kognit** ecosystem.

## Environment Variables Needed

- `MONGODB_URI`: Connection string for MongoDB Atlas
- `RSS_ENABLED`: Set to `true` to enable background fetching
- `RSS_CRON_SCHEDULE`: Optional (default: `*/30 * * * *`)
