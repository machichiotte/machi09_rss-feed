<script setup lang="ts">
import { X, Sparkles, TrendingUp, TrendingDown, Minus, ExternalLink, Calendar } from 'lucide-vue-next';

interface BriefingSection {
  title: string;
  content: string;
  articles: {
    title: string;
    link: string;
    source: string;
  }[];
}

interface Briefing {
  summary: string;
  sections: BriefingSection[];
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  topTrends: string[];
  date: string;
}

defineProps<{
  isOpen: boolean;
  briefing: Briefing | null;
  loading: boolean;
}>();

const emit = defineEmits(['close']);

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content briefing-container glass-card" :class="{ 'loading-state': loading }">
        <!-- Close Button -->
        <button class="close-btn" @click="emit('close')">
          <X :size="20" />
        </button>

        <!-- Loading View -->
        <div v-if="loading" class="loading-view">
          <div class="sparkle-loader">
            <Sparkles class="sparkle-icon" :size="48" />
          </div>
          <h2>Synthesizing your Intelligence...</h2>
          <p>Analyzing global feeds for the last 24 hours.</p>
        </div>

        <!-- Content View -->
        <div v-else-if="briefing" class="briefing-content">
          <header class="briefing-header">
            <div class="header-top">
              <span class="briefing-tag">Kognit Intelligence Brief</span>
              <span class="date-badge">
                <Calendar :size="14" />
                {{ formatDate(briefing.date) }}
              </span>
            </div>
            <h1>The Daily Synthesis</h1>
            <div class="market-overview">
              <span class="overview-label">Global Sentiment:</span>
              <div class="sentiment-indicator" :class="briefing.marketSentiment">
                <TrendingUp v-if="briefing.marketSentiment === 'bullish'" :size="16" />
                <TrendingDown v-else-if="briefing.marketSentiment === 'bearish'" :size="16" />
                <Minus v-else :size="16" />
                {{ briefing.marketSentiment.toUpperCase() }}
              </div>
            </div>
          </header>

          <div class="briefing-grid">
            <!-- Summary Column -->
            <section class="main-summary section-card">
              <h3>Executive Summary</h3>
              <p class="summary-text">{{ briefing.summary }}</p>
              
              <div class="trends-box">
                <h4>Top Trends Today</h4>
                <div class="trends-tags">
                  <span v-for="trend in briefing.topTrends" :key="trend" class="trend-tag">
                    #{{ trend }}
                  </span>
                </div>
              </div>
            </section>

            <!-- Categorized Sections -->
            <div class="detailed-sections">
              <section v-for="section in briefing.sections" :key="section.title" class="briefing-section">
                <h3 class="section-title">{{ section.title }}</h3>
                <p class="section-content">{{ section.content }}</p>
                
                <div class="section-sources">
                  <span class="sources-label">Primary Sources:</span>
                  <div class="source-chips">
                    <a
                      v-for="article in section.articles"
                      :key="article.link"
                      :href="article.link"
                      target="_blank"
                      class="source-chip"
                    >
                      <span class="source-name">{{ article.source }}</span>
                      <ExternalLink :size="12" />
                    </a>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.modal-content {
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  background: linear-gradient(145deg, #1a1b26, #13141c);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 3rem;
  color: #c0caf5;
}

.glass-card {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #787c99;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Loading State */
.loading-view {
  text-align: center;
  padding: 4rem 0;
}

.sparkle-loader {
  margin-bottom: 2rem;
  animation: pulse 2s infinite;
}

.sparkle-icon {
  color: #7aa2f7;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 1; filter: drop-shadow(0 0 10px #7aa2f7); }
  100% { transform: scale(1); opacity: 0.5; }
}

/* Header */
.briefing-header {
  margin-bottom: 3rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 2rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.briefing-tag {
  background: linear-gradient(90deg, #7aa2f7, #bb9af7);
  color: #1a1b26;
  font-weight: 800;
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.date-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: #787c99;
}

h1 {
  font-size: 3.5rem;
  font-weight: 900;
  margin-bottom: 1rem;
  color: #fff;
  letter-spacing: -2px;
}

.market-overview {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.overview-label {
  font-size: 0.9rem;
  color: #787c99;
}

.sentiment-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
}

.bullish { color: #9ece6a; background: rgba(158, 206, 106, 0.1); }
.bearish { color: #f7768e; background: rgba(247, 118, 142, 0.1); }
.neutral { color: #7aa2f7; background: rgba(122, 162, 247, 0.1); }

/* Grid Layout */
.briefing-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 3rem;
}

@media (max-width: 850px) {
  .briefing-grid { grid-template-columns: 1fr; }
}

.section-card h3 {
  font-size: 1.25rem;
  color: #7aa2f7;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.summary-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #cfc9c2;
  margin-bottom: 2rem;
}

.trends-box {
  background: rgba(0, 0, 0, 0.2);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.trends-box h4 {
  font-size: 0.85rem;
  color: #787c99;
  margin-bottom: 1rem;
}

.trends-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.trend-tag {
  font-size: 0.8rem;
  color: #bb9af7;
}

/* Detailed Sections */
.detailed-sections {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.briefing-section {
  border-left: 2px solid rgba(122, 162, 247, 0.3);
  padding-left: 1.5rem;
}

.section-title {
  font-size: 1.1rem;
  color: #fff;
  margin-bottom: 0.75rem;
  font-weight: 700;
}

.section-content {
  line-height: 1.6;
  color: #9aa5ce;
  margin-bottom: 1rem;
}

.section-sources {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sources-label {
  font-size: 0.75rem;
  color: #565f89;
  font-weight: 800;
}

.source-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.source-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(43, 44, 54, 0.5);
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #7aa2f7;
  text-decoration: none;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.source-chip:hover {
  background: rgba(43, 44, 54, 1);
  border-color: #7aa2f7;
}

/* Transitions */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content {
  animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-up {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
