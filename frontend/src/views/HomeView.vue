<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import axios from 'axios';
import { RefreshCw } from 'lucide-vue-next';
import { useI18n } from '../composables/useI18n';
import type { Article, GlobalBriefing } from '../types';

import ArticleFeed from '../components/feed/ArticleFeed.vue';
import FeedSummary from '../components/feed/FeedSummary.vue';
import BriefingModal from '../components/feed/BriefingModal.vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const props = defineProps<{
  searchQuery: string;
  preferredLanguage: string;
  autoTranslate: boolean;
  globalInsightMode: boolean;
  globalSummaryMode: boolean;
  viewMode: 'grid' | 'list' | 'compact';
  isDark: boolean;
  processing: boolean;
  userId: string;
  bookmarkedIds: string[];
  customTags: string[];
  groupedSources: Record<string, { name: string; maxArticles?: number }[]>;
  allLanguages: string[];
  allCategories: string[];
}>();

const emit = defineEmits<{
  'update:bookmarkedIds': [ids: string[]];
  'update:customTags': [tags: string[]];
  'open-settings': [tab: string];
  'trigger-process': [];
}>();

// Local State
const articles = ref<Article[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const isFiltering = ref(false);
const error = ref<string | null>(null);

// Filters State
const selectedCategory = ref<string | null>(null);
const selectedSource = ref<string | null>(null);
const selectedSentiment = ref<'bullish' | 'bearish' | 'neutral' | null>(null);
const selectedLanguages = ref<string[]>([]);
const showOnlyInsights = ref(false);
const showOnlyBookmarks = ref(false);
const dateRange = ref('all');

const serverStats = ref({ today: 0, week: 0, saved: 0, enriched: 0, total: 0 });

// Briefing State
const isBriefingOpen = ref(false);
const currentBriefing = ref<GlobalBriefing | null>(null);
const loadingBriefing = ref(false);

// Refs
const feedRef = ref<{ loadMoreTrigger: HTMLElement | null } | null>(null);
let observer: IntersectionObserver | null = null;
let filterTimeout: ReturnType<typeof setTimeout> | null = null;

// Pagination
const currentPage = ref(1);
const limit = ref(24);
const totalArticles = ref(0);
const hasMore = ref(false);

// Computed
const translationToggles = ref<Record<string, boolean>>({});

const feedSummaryCounts = computed(() => ({
  today: serverStats.value.today,
  week: serverStats.value.week,
  total: serverStats.value.total,
  saved: props.bookmarkedIds.length,
  enriched: serverStats.value.enriched
}));

const allCategoriesComposed = computed(() => {
  const fromRss = props.allCategories || [];
  return [...new Set([...fromRss, ...props.customTags])].sort((a, b) => a.localeCompare(b));
});

const { t } = useI18n(ref(props.preferredLanguage));

// Methods
async function loadArticles(reset = false) {
  if (reset) {
    currentPage.value = 1;
    if (articles.value.length === 0) {
      loading.value = true;
    } else {
      isFiltering.value = true;
    }
    error.value = null;
  } else {
    if (loadingMore.value || loading.value || isFiltering.value) return;
    loadingMore.value = true;
  }

  try {
    const params = buildSearchParams();
    const data = await fetchArticlesFromApi(params);
    processFetchedArticles(data, reset);
  } catch (err) {
    handleFetchError(err);
  } finally {
    loading.value = false;
    loadingMore.value = false;
    isFiltering.value = false;
  }
}

function buildSearchParams(): Record<string, unknown> {
    const params: Record<string, unknown> = {
      page: currentPage.value,
      limit: limit.value,
      category: selectedCategory.value,
      sentiment: selectedSentiment.value,
      language: selectedLanguages.value.length > 0 ? selectedLanguages.value.join(',') : null,
      search: props.searchQuery,
      source: selectedSource.value,
      onlyInsights: showOnlyInsights.value,
      dateRange: dateRange.value
    };

    if (showOnlyBookmarks.value) {
      params.isBookmarked = true;
      params.bookmarkIds = props.bookmarkedIds.join(',');
    }
    return params;
}

async function fetchArticlesFromApi(params: Record<string, unknown>) {
    const response = await axios.get(`${API_BASE_URL}/api/rss`, { params });
    return response.data;
}

interface FetchResponse {
    articles?: Article[];
    data?: Article[];
    stats?: { today: number; week: number; saved: number; enriched: number; total: number };
    total?: number;
}

function processFetchedArticles(data: FetchResponse, reset: boolean) {
    const newArticles = (data.articles || data.data || []).map((a: Article) => ({
      ...a,
      isBookmarked: props.bookmarkedIds.includes(a._id)
    }));
    
    if (data.stats) serverStats.value = data.stats;
    
    articles.value = reset ? newArticles : [...articles.value, ...newArticles];
    totalArticles.value = data.total || 0;
    hasMore.value = articles.value.length < totalArticles.value;
    currentPage.value++;

    newArticles.forEach((a: Article) => {
        translationToggles.value[a._id] = props.globalInsightMode && props.autoTranslate;
    });

    nextTick(() => checkAndLoadMore());
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
  if (rect.top < window.innerHeight + 600) {
    loadArticles();
  }
}

const handleFilterChange = (filterId: string) => {
  if (filterId === 'saved') {
    showOnlyBookmarks.value = true;
    showOnlyInsights.value = false;
    dateRange.value = 'all'; 
  } else if (filterId === 'enriched') {
    showOnlyBookmarks.value = false;
    showOnlyInsights.value = true;
    dateRange.value = 'all';
  } else {
    showOnlyBookmarks.value = false;
    showOnlyInsights.value = false;
    dateRange.value = filterId;
  }
};

const handleToggleBookmark = async (id: string) => {
  const isNowBookmarked = !props.bookmarkedIds.includes(id);
  const newIds = isNowBookmarked 
    ? [...props.bookmarkedIds, id]
    : props.bookmarkedIds.filter(bid => bid !== id);
  
  emit('update:bookmarkedIds', newIds);

  const article = articles.value.find(a => a._id === id);
  if (article) article.isBookmarked = isNowBookmarked;

  if (showOnlyBookmarks.value && !isNowBookmarked) {
    setTimeout(() => {
      articles.value = articles.value.filter(a => a._id !== id);
    }, 300);
  }
  
  try {
     await axios.patch(`${API_BASE_URL}/api/rss/articles/${id}/bookmark`);
  } catch (e) {
      console.error('Bookmark toggle failed', e);
  }
};

const handleRequestBriefing = async () => {
  isBriefingOpen.value = true;
  loadingBriefing.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/api/user/${props.userId}/briefing`);
    currentBriefing.value = response.data;
  } catch (err) {
    console.error('Failed to generate briefing:', err);
  } finally {
    loadingBriefing.value = false;
  }
};

const selectCategory = (category: string | null) => {
  selectedCategory.value = category;
  selectedSource.value = null;
};

const toggleSelectedLanguage = (lang: string) => {
  if (lang === 'all') {
    selectedLanguages.value = [];
    return;
  }
  if (selectedLanguages.value.includes(lang)) {
    selectedLanguages.value = selectedLanguages.value.filter(l => l !== lang);
  } else {
    selectedLanguages.value.push(lang);
  }
};

// Watchers
watch([
  () => props.searchQuery,
  selectedCategory, 
  selectedSentiment, 
  selectedLanguages, 
  selectedSource, 
  () => props.preferredLanguage, 
  showOnlyInsights, 
  showOnlyBookmarks, 
  dateRange
], () => {
    if (articles.value.length > 0) isFiltering.value = true;
    if (filterTimeout) clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => loadArticles(true), 300);
}, { deep: true });

// Watching global props to update local articles state
watch(() => props.globalInsightMode, (val) => {
    // Update logic if strictly needed, but Feed component handles visual toggle often
    // Here we can update translation toggles
    articles.value.forEach(article => {
        translationToggles.value[article._id] = val && props.autoTranslate;
    });
});
watch(() => props.autoTranslate, (val) => {
    if (props.globalInsightMode) {
        articles.value.forEach(article => {
            translationToggles.value[article._id] = val;
        });
    }
});

onMounted(() => {
  loadArticles(true);

  observer = new IntersectionObserver((entries) => {
    const [entry] = entries;
    if (entry && entry.isIntersecting) {
      if (hasMore.value && !loading.value && !loadingMore.value) {
        loadArticles();
      }
    }
  }, { threshold: 0, rootMargin: '600px' });

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
  <div class="w-full min-h-[60vh]">
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
      :active-filter="showOnlyBookmarks ? 'saved' : (showOnlyInsights ? 'enriched' : dateRange)"
      :preferred-language="preferredLanguage"
      :all-languages="allLanguages"
      :selected-languages="selectedLanguages"
      :global-insight-mode="globalInsightMode"
      :categories="allCategoriesComposed"
      :selected-category="selectedCategory"
      @filter-change="handleFilterChange"
      @toggle-language="toggleSelectedLanguage"
      @select-tag="selectCategory"
      @request-add-tag="emit('open-settings', 'filters')"
      @request-briefing="handleRequestBriefing"
    />

    <BriefingModal 
      :is-open="isBriefingOpen"
      :briefing="currentBriefing"
      :loading="loadingBriefing"
      @close="isBriefingOpen = false"
    />

    <!-- Seamless Filter Indicator -->
    <div 
      v-if="isFiltering" 
      class="flex items-center justify-center gap-3 py-4 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <RefreshCw class="h-4 w-4 text-brand animate-spin" />
      <span class="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Mise à jour du flux...</span>
    </div>

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
    />
  </div>
</template>
