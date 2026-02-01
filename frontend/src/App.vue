<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import axios from 'axios';
import { RefreshCw } from 'lucide-vue-next';

// Layout Components
import AuroraBackground from './components/layout/AuroraBackground.vue';
import Navbar from './components/layout/Navbar.vue';
import Sidebar from './components/layout/Sidebar.vue';
import Footer from './components/layout/Footer.vue';
import SettingsModal from './components/settings/SettingsModal.vue';

// Feed Components
import ArticleFeed from './components/feed/ArticleFeed.vue';
import FeedSummary from './components/feed/FeedSummary.vue';

// i18n
import { useI18n } from './composables/useI18n';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Types
interface Article {
  _id: string;
  title: string;
  link: string;
  sourceFeed: string;
  feedName: string;
  category: string;
  language?: string;
  publicationDate: string;
  summary: string;
  fetchedAt: string;
  analysis?: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    sentimentScore: number;
    iaSummary?: string;
    isPromotional?: boolean;
  };
  translations?: Record<string, {
    title: string;
    summary: string;
    iaSummary?: string;
  }>;
}

// State
const articles = ref<Article[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const processing = ref(false);
const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);
const selectedSource = ref<string | null>(null);
const selectedSentiment = ref<'bullish' | 'bearish' | 'neutral' | null>(null);
const selectedLanguages = ref<string[]>([]);
const globalInsightMode = ref(localStorage.globalInsightMode === 'true');
const globalSummaryMode = ref(localStorage.globalSummaryMode === 'true');
const autoTranslate = ref(localStorage.autoTranslate !== 'false'); // Default true
const preferredLanguage = ref(localStorage.preferredLanguage || 'fr');
if (!localStorage.preferredLanguage) localStorage.preferredLanguage = 'fr';
const insightVisibility = ref<Record<string, boolean>>({}); // articleId -> visible
const translationToggles = ref<Record<string, boolean>>({}); // articleId -> isTranslated
const showLangDropdown = ref(false);
const viewMode = ref<'grid' | 'list' | 'compact'>((localStorage.viewMode as 'grid' | 'list' | 'compact') || 'grid');
const isDark = ref(false);
const showOnlyInsights = ref(false);
const dateRange = ref('all');
const isSettingsOpen = ref(false);
const error = ref<string | null>(null);

// i18n Setup
const { t } = useI18n(preferredLanguage);

// Pagination State
const currentPage = ref(1);
const limit = ref(24);
const totalArticles = ref(0);
const hasMore = ref(false);

// Metadata State
const allCategories = ref<string[]>([]);
const allSources = ref<string[]>([]);
const allLanguages = ref<string[]>([]);

// Feed Ref for infinite scroll
const feedRef = ref<{ loadMoreTrigger: HTMLElement | null } | null>(null);
let observer: IntersectionObserver | null = null;

// Methods
const feedSummaryCounts = computed(() => {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    today: articles.value.filter(a => new Date(a.publicationDate || a.fetchedAt) >= dayAgo).length,
    week: articles.value.filter(a => new Date(a.publicationDate || a.fetchedAt) >= weekAgo).length,
    unread: totalArticles.value,
    saved: 0
  };
});

const handleFilterChange = (filterId: string) => {
  if (filterId === '24h' || filterId === '7d') {
    dateRange.value = dateRange.value === filterId ? 'all' : filterId;
  } else if (filterId === 'unread') {
    dateRange.value = 'all';
    searchQuery.value = '';
    selectedCategory.value = null;
    selectedSentiment.value = null;
    showOnlyInsights.value = false;
  }
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  applyTheme();
};

const applyTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.setProperty('color-scheme', 'dark');
    localStorage.theme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.setProperty('color-scheme', 'light');
    localStorage.theme = 'light';
  }
};

const fetchMetadata = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/rss/metadata`);
    allCategories.value = response.data.categories || [];
    allSources.value = response.data.sources || [];
    allLanguages.value = response.data.languages || [];
  } catch {
    console.error('Failed to fetch metadata');
  }
};

/**
 * Fetches articles from the Nexus API with current filters and pagination.
 * @param reset If true, resets pagination and clears current articles.
 */
// eslint-disable-next-line complexity
async function loadArticles(reset = false) {
  if (reset) {
    currentPage.value = 1;
    articles.value = [];
    loading.value = true;
    error.value = null;
  } else {
    if (loadingMore.value || loading.value) return;
    loadingMore.value = true;
  }

  try {
    const params = {
      page: currentPage.value,
      limit: limit.value,
      category: selectedCategory.value,
      sentiment: selectedSentiment.value,
      language: selectedLanguages.value.length > 0 ? selectedLanguages.value.join(',') : null,
      search: searchQuery.value,
      source: selectedSource.value,
      onlyInsights: showOnlyInsights.value,
      dateRange: dateRange.value
    };
    
    const response = await axios.get(`${API_BASE_URL}/api/rss`, { params });
    const data = response.data;
    const newArticles = data.articles || data.data || [];
    
    articles.value = reset ? newArticles : [...articles.value, ...newArticles];
    totalArticles.value = data.total || 0;
    hasMore.value = articles.value.length < totalArticles.value;
    currentPage.value++;

    nextTick(() => checkAndLoadMore());
  } catch (err) {
    handleFetchError(err);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function handleFetchError(err: unknown) {
  let status: number | undefined;
  if (axios.isAxiosError(err)) {
    status = err.status || err.response?.status;
  }
  error.value = status === 504 
    ? t('common.error_busy')
    : t('common.error_failed');
}

function checkAndLoadMore() {
  if (!hasMore.value || loading.value || loadingMore.value || !feedRef.value?.loadMoreTrigger) return;
  
  const rect = feedRef.value.loadMoreTrigger.getBoundingClientRect();
  const isNearBottom = rect.top < window.innerHeight + 600;
  
  if (isNearBottom) {
    loadArticles();
  }
}

const triggerProcess = async () => {
  processing.value = true;
  try {
    await axios.post(`${API_BASE_URL}/api/rss/process`);
    setTimeout(() => {
      loadArticles(true);
      processing.value = false;
    }, 4000); 
  } catch {
    processing.value = false;
  }
};

const selectCategory = (category: string | null) => {
  selectedCategory.value = category;
  selectedSource.value = null;
};


const toggleSelectedLanguage = (lang: string) => {
  if (selectedLanguages.value.includes(lang)) {
    selectedLanguages.value = selectedLanguages.value.filter(l => l !== lang);
  } else {
    selectedLanguages.value.push(lang);
  }
};

const toggleSentiment = (sent: string) => {
  const s = sent as 'bullish' | 'bearish' | 'neutral';
  selectedSentiment.value = selectedSentiment.value === s ? null : s;
};

// Watchers
let filterTimeout: ReturnType<typeof setTimeout> | null = null;
watch([selectedCategory, selectedSentiment, selectedLanguages, selectedSource, preferredLanguage, showOnlyInsights, dateRange], (newValues) => {
    const newPreferredLanguage = newValues[4] as string;
    localStorage.preferredLanguage = newPreferredLanguage;
    
    if (filterTimeout) clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => loadArticles(true), 300);
}, { deep: true });

watch(globalInsightMode, (val) => {
  localStorage.globalInsightMode = val.toString();
  articles.value.forEach(article => {
    insightVisibility.value[article._id] = val;
    translationToggles.value[article._id] = val && autoTranslate.value;
  });
});

watch(globalSummaryMode, (val) => {
  localStorage.globalSummaryMode = val.toString();
});

watch(autoTranslate, (val) => {
  localStorage.autoTranslate = val.toString();
  if (globalInsightMode.value) {
    articles.value.forEach(article => {
      translationToggles.value[article._id] = val;
    });
  }
});

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadArticles(true), 500);
});

watch(viewMode, (val) => {
  localStorage.viewMode = val;
});

onMounted(() => {
  const savedTheme = localStorage.theme;
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  isDark.value = savedTheme === 'dark' || (!savedTheme && isSystemDark);
  applyTheme();

  fetchMetadata();
  loadArticles(true);

  observer = new IntersectionObserver((entries) => {
    const [entry] = entries;
    if (entry && entry.isIntersecting) {
      if (hasMore.value && !loading.value && !loadingMore.value) {
        loadArticles();
      }
    }
  }, { 
    threshold: 0,
    rootMargin: '600px'
  });

  watch(() => feedRef.value?.loadMoreTrigger, (newVal) => {
    if (newVal && observer) {
      observer.disconnect();
      observer.observe(newVal);
    }
  }, { immediate: true });
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans selection:bg-brand/30 text-text-secondary">
    <AuroraBackground />

    <Navbar 
      v-model:search-query="searchQuery"
      v-model:preferred-language="preferredLanguage"
      v-model:auto-translate="autoTranslate"
      v-model:global-insight-mode="globalInsightMode"
      v-model:global-summary-mode="globalSummaryMode"
      v-model:view-mode="viewMode"
      :languages="allLanguages"
      :is-dark="isDark"
      :processing="processing"
      @toggle-theme="toggleTheme"
      @trigger-process="triggerProcess"
      @open-settings="isSettingsOpen = true"
    />

    <SettingsModal 
      :is-open="isSettingsOpen"
      :is-dark="isDark"
      :global-insight-mode="globalInsightMode"
      :global-summary-mode="globalSummaryMode"
      :auto-translate="autoTranslate"
      :preferred-language="preferredLanguage"
      :view-mode="viewMode"
      :sources="allSources"
      @close="isSettingsOpen = false"
      @toggle-theme="toggleTheme"
      @update:global-insight-mode="globalInsightMode = $event"
      @update:global-summary-mode="globalSummaryMode = $event"
      @update:auto-translate="autoTranslate = $event"
      @update:view-mode="viewMode = $event"
    />

    <main class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-10 relative">
      <div class="flex flex-col lg:flex-row gap-0 pt-0">
        <Sidebar 
          :total-articles="totalArticles"
          :categories="allCategories"
          :selected-category="selectedCategory"
          :selected-sentiment="selectedSentiment"
          v-model:show-only-insights="showOnlyInsights"
          v-model:date-range="dateRange"
          :languages="allLanguages"
          :selected-languages="selectedLanguages"
          v-model:show-lang-dropdown="showLangDropdown"
          :preferred-language="preferredLanguage"
          @select-category="selectCategory"
          @toggle-sentiment="toggleSentiment"
          @toggle-selected-language="toggleSelectedLanguage"
        />

        <div class="flex-1 lg:ml-80 w-full min-h-[60vh]">
          <!-- Processing State Banner -->
          <div v-if="processing" class="glass rounded-3xl p-6 border-brand/20 flex items-center justify-between animate-pulse mb-8 mt-6">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 bg-brand/20 rounded-full flex items-center justify-center">
                <RefreshCw class="h-5 w-5 text-brand animate-spin" />
              </div>
              <div>
                <p class="font-bold text-text-primary">{{ t('feed.syncing_nexus') }}</p>
                <p class="text-xs text-text-muted">{{ t('feed.retrieving_intel') }}</p>
              </div>
            </div>
            <div class="hidden sm:flex gap-1.5">
              <div v-for="i in 3" :key="i" class="h-1.5 w-6 bg-brand rounded-full animate-bounce" :style="{ animationDelay: `${i*0.2}s` }"></div>
            </div>
          </div>

          <FeedSummary 
            :counts="feedSummaryCounts"
            :active-filter="dateRange"
            :preferred-language="preferredLanguage"
            @filter-change="handleFilterChange"
          />

          <ArticleFeed 
            ref="feedRef"
            :articles="articles"
            :loading="loading"
            :error="error"
            :has-more="hasMore"
            :global-insight-mode="globalInsightMode"
            :global-summary-mode="globalSummaryMode"
            :preferred-language="preferredLanguage"
            :translation-toggles="translationToggles"
            :view-mode="viewMode"
            @retry="loadArticles(true)"
          />
        </div>
      </div>
    </main>

    <Footer :preferred-language="preferredLanguage" />
  </div>
</template>
