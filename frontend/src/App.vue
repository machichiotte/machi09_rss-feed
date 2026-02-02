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
  imageUrl?: string;
  sourceColor?: string;
  isBookmarked?: boolean;
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
const showOnlyBookmarks = ref(false);
const dateRange = ref('all');
const isSettingsOpen = ref(false);
const error = ref<string | null>(null);
const serverStats = ref({ today: 0, week: 0, saved: 0 });

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
const groupedSources = ref<Record<string, { name: string; language: string; enabled: boolean }[]>>({});
const allLanguages = ref<string[]>([]);

// Feed Ref for infinite scroll
const feedRef = ref<{ loadMoreTrigger: HTMLElement | null } | null>(null);
let observer: IntersectionObserver | null = null;

// Methods
const feedSummaryCounts = computed(() => {
  return {
    today: serverStats.value.today,
    week: serverStats.value.week,
    unread: totalArticles.value,
    saved: serverStats.value.saved
  };
});

const handleFilterChange = (filterId: string) => {
  if (filterId === '24h' || filterId === '7d') {
    dateRange.value = dateRange.value === filterId ? 'all' : filterId;
  } else if (filterId === 'saved') {
    showOnlyBookmarks.value = !showOnlyBookmarks.value;
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
    groupedSources.value = response.data.groupedSources || {};
    allLanguages.value = response.data.languages || [];
  } catch {
    console.error('Failed to fetch metadata');
  }
};

const handleToggleBookmark = async (id: string) => {
  const article = articles.value.find(a => a._id === id);
  if (!article) return;

  // Optimistic UI
  article.isBookmarked = !article.isBookmarked;

  try {
    const response = await axios.patch(`${API_BASE_URL}/api/rss/articles/${id}/bookmark`);
    // Sync with actual result from server just in case
    article.isBookmarked = response.data.isBookmarked;
    console.log(`Article ${id} bookmark status: ${article.isBookmarked}`);
    
    // If we are in "Bookmarks only" view and unbookmarked, remove from list
    if (showOnlyBookmarks.value && !article.isBookmarked) {
      setTimeout(() => {
        articles.value = articles.value.filter(a => a._id !== id);
      }, 300);
    }
    
    // Refresh stats to update the saved counter
    const statsResponse = await axios.get(`${API_BASE_URL}/api/rss?limit=1`);
    if (statsResponse.data.stats) {
      serverStats.value = statsResponse.data.stats;
    }
  } catch (err) {
    console.error(`Failed to toggle bookmark for ${id}:`, err);
    // Rollback on error
    article.isBookmarked = !article.isBookmarked;
  }
};

const handleToggleSource = async (_category: string, name: string, enabled: boolean) => {
  try {
    // Optimistic UI update already happened in the modal via proxy, 
    // but ensured here if needed.
    await axios.patch(`${API_BASE_URL}/api/rss/sources/${encodeURIComponent(name)}/toggle`, { enabled });
    console.log(`Source ${name} status updated to ${enabled}`);
  } catch (err) {
    console.error(`Failed to toggle source ${name}:`, err);
    // Rollback if needed (though metadata refetch is safer)
    fetchMetadata();
  }
};

const handleDeleteSource = (category: string, name: string) => {
  if (groupedSources.value[category]) {
    groupedSources.value[category] = groupedSources.value[category].filter(s => s.name !== name);
    // Remove category if empty
    if (groupedSources.value[category].length === 0) {
      delete groupedSources.value[category];
      allCategories.value = allCategories.value.filter(c => c !== category);
    }
    allSources.value = allSources.value.filter(s => s !== name);
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
      isBookmarked: showOnlyBookmarks.value,
      dateRange: dateRange.value
    };
    
    const response = await axios.get(`${API_BASE_URL}/api/rss`, { params });
    const data = response.data;
    const newArticles = data.articles || data.data || [];
    
    // Update stats from server
    if (data.stats) {
      serverStats.value = data.stats;
    }
    
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
watch([selectedCategory, selectedSentiment, selectedLanguages, selectedSource, preferredLanguage, showOnlyInsights, showOnlyBookmarks, dateRange], (newValues) => {
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
      :grouped-sources="groupedSources"
      @close="isSettingsOpen = false"
      @toggle-theme="toggleTheme"
      @update:global-insight-mode="globalInsightMode = $event"
      @update:global-summary-mode="globalSummaryMode = $event"
      @update:auto-translate="autoTranslate = $event"
      @update:view-mode="viewMode = $event"
      @delete-source="handleDeleteSource"
      @toggle-source="handleToggleSource"
    />

    <main class="w-full max-w-[1910px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-10 relative">
      <div class="flex flex-col lg:flex-row gap-8 items-start">
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
          v-model:show-only-bookmarks="showOnlyBookmarks"
          :preferred-language="preferredLanguage"
          @select-category="selectCategory"
          @toggle-sentiment="toggleSentiment"
          @toggle-selected-language="toggleSelectedLanguage"
        />

        <div class="flex-1 lg:ml-80 w-full min-h-[60vh]">
          <!-- Processing State Banner -->
          <div v-if="processing" class="glass-card rounded-3xl p-6 border-brand/20 flex items-center justify-between animate-pulse mb-8">
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
            @toggle-bookmark="handleToggleBookmark"
            @retry="loadArticles(true)"
          />
        </div>
      </div>
    </main>

    <Footer :preferred-language="preferredLanguage" />
  </div>
</template>
