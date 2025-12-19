<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { 
  Rss, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  Filter,
  Newspaper,
  TrendingUp,
  Clock,
  ChevronRight,
  Globe,
  Moon,
  Sun
} from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
    sentiment: 'bullish' | 'bearish';
    sentimentScore: number;
  };
}

// State
const articles = ref<Article[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const processing = ref(false);
const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);
const selectedSource = ref<string | null>(null);
const selectedSentiment = ref<'bullish' | 'bearish' | null>(null);
const selectedLanguage = ref<string | null>(null);
const isDark = ref(false);

// Pagination State
const currentPage = ref(1);
const limit = ref(24);
const totalArticles = ref(0);
const hasMore = ref(false);

// Metadata State
const allCategories = ref<string[]>([]);
const allSources = ref<string[]>([]);
const allLanguages = ref<string[]>([]);

// Observer for infinite scroll
const loadMoreTrigger = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

// Methods
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
  } catch (error) {
    console.error('Failed to fetch metadata:', error);
  }
};

async function loadArticles(reset = false) {
  if (reset) {
    currentPage.value = 1;
    articles.value = [];
    loading.value = true;
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
      language: selectedLanguage.value,
      search: searchQuery.value,
      source: selectedSource.value
    };

    const response = await axios.get(`${API_BASE_URL}/api/rss`, { params });
    const newArticles = response.data.articles || response.data.data || [];
    
    if (reset) {
      articles.value = newArticles;
    } else {
      articles.value = [...articles.value, ...newArticles];
    }

    totalArticles.value = response.data.total || 0;
    hasMore.value = articles.value.length < totalArticles.value;
    
    currentPage.value++;

    // Re-check after render
    nextTick(() => {
      checkAndLoadMore();
    });
  } catch (error) {
    console.error('Failed to load articles:', error);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function checkAndLoadMore() {
  if (!hasMore.value || loading.value || loadingMore.value || !loadMoreTrigger.value) return;
  
  const rect = loadMoreTrigger.value.getBoundingClientRect();
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
  } catch (error) {
    console.error('Failed to process feeds:', error);
    processing.value = false;
  }
};

const selectCategory = (category: string | null) => {
  selectedCategory.value = category;
  selectedSource.value = null;
};

const formatDate = (dateStr: string) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return 'Recently';
  }
};

const getSentimentColor = (sentiment: string) => {
  return sentiment === 'bullish' 
    ? 'bg-green-100 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/30' 
    : 'bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/30';
};

const getLangFlag = (lang?: string) => {
  if (!lang) return '🌍';
  const map: Record<string, string> = {
    'fr': '🇫🇷', 'en': '🇺🇸', 'es': '🇪🇸', 'de': '🇩🇪',
    'it': '🇮🇹', 'pt': '🇵🇹', 'nl': '🇳🇱', 'ru': '🇷🇺',
    'zh': '🇨🇳', 'ja': '🇯🇵', 'ar': '🇸🇦', 'cn': '🇨🇳'
  };
  return map[lang.toLowerCase()] || '🌍';
};

// Computed
const categories = computed(() => allCategories.value);
const sources = computed(() => allSources.value);
const languages = computed(() => allLanguages.value);
const filteredArticles = computed(() => articles.value); // Articles are already filtered on server

// Watchers
watch([selectedCategory, selectedSentiment, selectedLanguage, selectedSource], () => {
    loadArticles(true);
});

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadArticles(true);
    }, 500);
});

onMounted(() => {
  // Theme initialization
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

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }
});

// Re-observe if elements change (e.g. after loading state)
watch(loadMoreTrigger, (newVal) => {
  if (newVal && observer) {
    observer.disconnect();
    observer.observe(newVal);
  }
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100">
    <!-- Navbar -->
    <header class="sticky top-0 z-20 border-b shadow-sm backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-3">
            <div class="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
              <Rss class="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                MachiFeed
              </h1>
              <p class="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">AI News Aggregator</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2 md:gap-4">
            <div class="relative hidden md:block">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search articles..." 
                class="pl-10 pr-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-64 text-sm dark:text-slate-200"
              />
            </div>

            <!-- Theme Toggle -->
            <button 
              @click="toggleTheme"
              class="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              title="Toggle theme"
            >
              <Sun v-if="isDark" class="h-4 w-4" />
              <Moon v-else class="h-4 w-4" />
            </button>
            
            <button 
              @click="triggerProcess" 
              :disabled="processing"
              :class="cn(
                'flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all shadow-sm',
                processing 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400 cursor-not-allowed border border-indigo-100 dark:border-indigo-900/30' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300'
              )"
            >
              <RefreshCw :class="cn('h-4 w-4', processing && 'animate-spin')" />
              <span class="hidden sm:inline">{{ processing ? 'Analyzing...' : 'Refresh' }}</span>
              <span class="sm:hidden" v-if="!processing">Scan</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar Filters -->
        <aside class="w-full lg:w-64 flex-shrink-0 space-y-6">
          <!-- Categories -->
          <div class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4 text-xs uppercase tracking-wide">
              <Filter class="h-4 w-4" /> Categories
            </h2>
            
            <div class="space-y-1">
              <button 
                @click="selectCategory(null)"
                :class="cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedCategory === null 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                )"
              >
                All Categories
              </button>
              
              <button 
                v-for="category in categories" 
                :key="category"
                @click="selectCategory(category)"
                :class="cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center',
                  selectedCategory === category
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                )"
              >
                {{ category }}
                <ChevronRight v-if="selectedCategory === category" class="h-3 w-3" />
              </button>
            </div>
          </div>

          <!-- Language Filter -->
          <div v-if="languages.length > 0" class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3 text-xs uppercase tracking-wide">
              <Globe class="h-4 w-4" /> Language
            </h2>
            <div class="flex flex-wrap gap-2">
              <button 
                @click="selectedLanguage = null"
                :class="cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                  selectedLanguage === null
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )"
              >
                All
              </button>
              <button 
                v-for="lang in languages" 
                :key="lang"
                @click="selectedLanguage = selectedLanguage === lang ? null : lang"
                :class="cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border flex items-center gap-1',
                  selectedLanguage === lang
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800'
                )"
              >
                {{ getLangFlag(lang) }} <span class="uppercase">{{ lang }}</span>
              </button>
            </div>
          </div>

          <!-- Sources & Sentiment -->
          <div class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-6">
            <!-- Source Filter -->
            <div>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-xs uppercase tracking-wide">
                Sources
              </h2>
              <select 
                @change="(e) => selectedSource = (e.target as HTMLSelectElement).value || null"
                :value="selectedSource || ''"
                class="w-full rounded-lg border border-slate-200 dark:border-slate-700 text-sm p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option :value="null">All Sources</option>
                <option v-for="source in sources" :key="source" :value="source">
                  {{ source }}
                </option>
              </select>
            </div>

            <!-- Sentiment Filter -->
            <div>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-xs uppercase tracking-wide">
                AI Sentiment
              </h2>
              <div class="flex gap-2">
                <button 
                  @click="selectedSentiment = selectedSentiment === 'bullish' ? null : 'bullish'"
                  :class="cn(
                    'flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all border',
                    selectedSentiment === 'bullish'
                      ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 ring-2 ring-green-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-800 hover:text-green-600 dark:hover:text-green-400'
                  )"
                >
                  🚀 Bullish
                </button>
                <button 
                  @click="selectedSentiment = selectedSentiment === 'bearish' ? null : 'bearish'"
                  :class="cn(
                    'flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all border',
                    selectedSentiment === 'bearish'
                      ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 ring-2 ring-red-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400'
                  )"
                >
                  🐻 Bearish
                </button>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4 text-xs uppercase tracking-wide">
              <TrendingUp class="h-4 w-4" /> Stats
            </h2>
            <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm border border-slate-100 dark:border-slate-700">
              <div class="flex justify-between mb-2">
                <span class="text-slate-500 dark:text-slate-400">Articles</span>
                <span class="font-bold text-slate-900 dark:text-slate-100">{{ totalArticles }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-500 dark:text-slate-400">Sources</span>
                <span class="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-xs font-medium">{{ allSources?.length || 0 }}</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="flex-1">
          <!-- Loading State -->
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="i in 6" :key="i" class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 h-56 animate-pulse">
              <div class="flex gap-2 mb-4">
                <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20"></div>
                <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-16"></div>
              </div>
              <div class="h-6 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2"></div>
              <div class="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-4"></div>
              <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2"></div>
              <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2"></div>
              <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredArticles.length === 0" class="text-center py-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
            <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Newspaper class="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100">No articles found</h3>
            <p class="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">Try adjusting your search or click refresh to fetch the latest news.</p>
            <button @click="selectedCategory = null; searchQuery = ''" class="mt-4 text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Clear filters
            </button>
          </div>

          <!-- Articles Grid -->
          <div v-else class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <article 
                v-for="article in filteredArticles" 
                :key="article._id"
                class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg dark:hover:shadow-indigo-900/10 hover:-translate-y-1 transition-[transform,box-shadow] duration-300 group flex flex-col h-full"
              >
                <div class="p-6 flex flex-col flex-1 relative">
                  <!-- Header -->
                  <div class="flex justify-between items-start mb-3">
                    <div class="flex gap-2 flex-wrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {{ article.category }}
                      </span>

                      <!-- Lang Badge -->
                      <span v-if="languages.length > 1 && article.language" title="Language" class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 cursor-help">
                        {{ getLangFlag(article.language) }}
                      </span>
                      
                      <!-- AI Badge -->
                      <span 
                        v-if="article.analysis" 
                        :class="cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ring-1 ring-inset', getSentimentColor(article.analysis.sentiment))"
                      >
                        <TrendingUp v-if="article.analysis.sentiment === 'bullish'" class="h-3 w-3" />
                        <TrendingUp v-else class="h-3 w-3 rotate-180" />
                        {{ article.analysis.sentiment }} {{ Math.round(article.analysis.sentimentScore * 100) }}%
                      </span>
                    </div>
                    <span class="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 whitespace-nowrap ml-2">
                      <Clock class="h-3 w-3" />
                      {{ formatDate(article.publicationDate || article.fetchedAt) }}
                    </span>
                  </div>
                  
                  <!-- Title -->
                  <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <a :href="article.link" target="_blank" rel="noopener noreferrer">
                      {{ article.title }}
                    </a>
                  </h3>
                  
                  <!-- Summary -->
                  <p class="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {{ article.summary?.replace(/<[^>]*>/g, '').slice(0, 160) }}...
                  </p>
                  
                  <!-- Footer -->
                  <div class="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                    <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                      {{ article.feedName }}
                    </span>
                    
                    <a 
                      :href="article.link" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-bold flex items-center gap-1 group/link"
                    >
                      Read
                      <ExternalLink class="h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </a>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <!-- Infinite Scroll Sentinel & End Message (Always in DOM structure for observer) -->
          <div v-if="!loading" class="mt-8">
            <!-- Load More Trigger -->
            <div 
              id="load-more-sentinel"
              ref="loadMoreTrigger" 
              class="h-32 flex items-center justify-center transition-all duration-300"
              :class="hasMore ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden'"
            >
              <div v-if="loadingMore" class="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-medium">
                <RefreshCw class="h-6 w-6 animate-spin" />
                <span class="animate-pulse">Fetching more news...</span>
              </div>
            </div>

            <!-- End of list message -->
            <div v-if="!hasMore && articles.length > 0" class="text-center py-12 border-t border-slate-100 dark:border-slate-800">
              <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-sm italic shadow-inner">
                <span>✨ You've reached the end of the feed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
