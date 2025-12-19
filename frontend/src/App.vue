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
  TrendingUp,
  Clock,
  ChevronRight,
  Moon,
  Sun,
  Sparkles
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
    iaSummary?: string;
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
  <div class="min-h-screen text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30 dark:selection:bg-indigo-500/30">
    <!-- Aurora Background -->
    <div class="aurora-bg">
      <div class="aurora-blob blob-1"></div>
      <div class="aurora-blob blob-2"></div>
      <div class="aurora-blob blob-3"></div>
    </div>

    <!-- Navbar -->
    <header class="sticky top-0 z-30 glass border-b-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-20 items-center">
          <div class="flex items-center gap-4 group cursor-pointer">
            <div class="bg-indigo-600 p-2.5 rounded-2xl shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
              <Rss class="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 class="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-600 dark:from-white dark:via-indigo-200 dark:to-indigo-400 bg-clip-text text-transparent italic">
                Kognit
              </h1>
              <div class="flex items-center gap-2">
                <span class="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p class="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-black">Intelligent Feed</p>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-3 md:gap-6">
            <div class="relative hidden md:block">
              <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search the nexus..." 
                class="pl-12 pr-6 py-2.5 rounded-2xl border border-white/20 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none w-72 text-sm transition-all dark:text-slate-200"
              />
            </div>

            <div class="flex items-center p-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800">
              <!-- Theme Toggle -->
              <button 
                @click="toggleTheme"
                class="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-all duration-300"
                title="Toggle theme"
              >
                <Sun v-if="isDark" class="h-4 w-4" />
                <Moon v-else class="h-4 w-4" />
              </button>

              <div class="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
              
              <button 
                @click="triggerProcess" 
                :disabled="processing"
                class="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 group"
                title="Refresh nexus"
              >
                <RefreshCw :class="cn('h-4 w-4 group-hover:rotate-180 transition-transform duration-700', processing && 'animate-spin')" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      <div class="flex flex-col lg:flex-row gap-10">
        <!-- Sidebar Filters -->
        <aside class="w-full lg:w-72 flex-shrink-0 space-y-8">
          <!-- Main Categories -->
          <div class="glass rounded-3xl p-6">
            <h2 class="font-black text-slate-400 mb-6 text-[10px] uppercase tracking-[0.25em] flex items-center gap-2">
              <Filter class="h-3.5 w-3.5" /> Discovery
            </h2>
            
            <nav class="space-y-1.5">
              <button 
                @click="selectCategory(null)"
                :class="cn(
                  'w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center justify-between group',
                  selectedCategory === null 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:translate-x-1'
                )"
              >
                All Feeds
                <ChevronRight class="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <button 
                v-for="category in categories" 
                :key="category"
                @click="selectCategory(category)"
                :class="cn(
                  'w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center justify-between group',
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:translate-x-1'
                )"
              >
                {{ category }}
                <ChevronRight v-if="selectedCategory === category" class="h-4 w-4" />
                <ChevronRight v-else class="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </nav>
          </div>

          <!-- Language & Sentiment Hub -->
          <div class="glass rounded-3xl p-6 space-y-8">
            <!-- Sentiment Hub -->
            <div>
              <h2 class="font-black text-slate-400 mb-4 text-[10px] uppercase tracking-[0.25em]">Intelligence</h2>
              <div class="grid grid-cols-2 gap-3">
                <button 
                  @click="selectedSentiment = selectedSentiment === 'bullish' ? null : 'bullish'"
                  :class="cn(
                    'group relative py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 overflow-hidden',
                    selectedSentiment === 'bullish'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/10'
                  )"
                >
                  Bullish
                  <TrendingUp class="absolute -right-2 -bottom-2 h-8 w-8 opacity-10 group-hover:scale-125 transition-transform" />
                </button>
                <button 
                  @click="selectedSentiment = selectedSentiment === 'bearish' ? null : 'bearish'"
                  :class="cn(
                    'group relative py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 overflow-hidden',
                    selectedSentiment === 'bearish'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'bg-rose-500/5 text-rose-600 dark:text-rose-400 border border-rose-500/10 hover:bg-rose-500/10'
                  )"
                >
                  Bearish
                  <TrendingUp class="absolute -right-2 -bottom-2 h-8 w-8 opacity-10 rotate-180 group-hover:scale-125 transition-transform" />
                </button>
              </div>
            </div>

            <!-- Language Hub -->
            <div>
              <h2 class="font-black text-slate-400 mb-4 text-[10px] uppercase tracking-[0.25em]">Network</h2>
              <div class="flex flex-wrap gap-2">
                <button 
                  v-for="lang in languages" 
                  :key="lang"
                  @click="selectedLanguage = selectedLanguage === lang ? null : lang"
                  :class="cn(
                    'px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2',
                    selectedLanguage === lang
                      ? 'bg-indigo-600 text-white border-transparent shadow-md'
                      : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-white/20 dark:border-slate-800 hover:scale-105'
                  )"
                >
                  {{ getLangFlag(lang) }} <span class="uppercase tracking-tighter">{{ lang }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="glass rounded-3xl p-6 bg-indigo-600/5 border-indigo-500/10 dark:bg-indigo-400/5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[9px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Total Insights</p>
                <p class="text-3xl font-black text-slate-900 dark:text-white">{{ totalArticles.toLocaleString() }}</p>
              </div>
              <TrendingUp class="h-10 w-10 text-indigo-500/20" />
            </div>
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="flex-1 space-y-8">
          <!-- Processing State Banner -->
          <div v-if="processing" class="glass rounded-3xl p-6 border-indigo-500/20 flex items-center justify-between animate-pulse">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center">
                <RefreshCw class="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
              </div>
              <div>
                <p class="font-bold text-slate-900 dark:text-white">Synchronizing Nexus</p>
                <p class="text-xs text-slate-500">Retrieving intelligence from all sectors...</p>
              </div>
            </div>
            <div class="hidden sm:flex gap-1.5">
              <div v-for="i in 3" :key="i" class="h-1.5 w-6 bg-indigo-500 rounded-full animate-bounce" :style="{ animationDelay: `${i*0.2}s` }"></div>
            </div>
          </div>

          <!-- Loading Skeleton Grid -->
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div v-for="i in 6" :key="i" class="glass-card rounded-[2.5rem] p-8 h-80 animate-pulse">
              <div class="flex justify-between mb-8">
                <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-24"></div>
                <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-12"></div>
              </div>
              <div class="space-y-4">
                <div class="h-8 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
                <div class="h-8 bg-slate-200 dark:bg-slate-800 rounded-2xl w-3/4"></div>
                <div class="pt-4 space-y-2">
                  <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-full"></div>
                  <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-full"></div>
                  <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-2/3"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Articles Discovery Grid -->
          <div v-else-if="filteredArticles.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <article 
              v-for="article in filteredArticles" 
              :key="article._id"
              class="group glass-card rounded-[2.5rem] p-8 flex flex-col h-full hover:scale-[1.02] hover:shadow-2xl dark:hover:shadow-indigo-500/10"
            >
              <!-- Card Header -->
              <div class="flex justify-between items-start mb-6">
                <div class="flex gap-2 flex-wrap">
                  <span class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-white/5 text-slate-500 dark:text-slate-400">
                    {{ article.category }}
                  </span>
                  
                  <!-- AI Sentiment Hub -->
                  <div 
                    v-if="article.analysis" 
                    :class="cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border',
                      article.analysis.sentiment === 'bullish' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    )"
                  >
                    <TrendingUp :class="cn('h-3 w-3', article.analysis.sentiment === 'bearish' && 'rotate-180')" />
                    {{ Math.round(article.analysis.sentimentScore * 100) }}%
                  </div>
                </div>
                
                <span class="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Clock class="h-3 w-3" />
                  {{ formatDate(article.publicationDate || article.fetchedAt) }}
                </span>
              </div>
              
              <!-- Title & Body -->
              <div class="flex-1 mb-8">
                <h3 class="text-xl font-extrabold text-slate-900 dark:text-white mb-4 leading-[1.3] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer">
                  <a :href="article.link" target="_blank" rel="noopener noreferrer">
                    {{ article.title }}
                  </a>
                </h3>
                
                <!-- AI Summary (If available) -->
                <div v-if="article.analysis?.iaSummary" class="mb-4 p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 dark:bg-indigo-400/5 relative overflow-hidden group/ia">
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1 flex items-center gap-1">
                    <Sparkles class="h-3 w-3" /> AI Insight
                  </p>
                  <p class="text-slate-600 dark:text-indigo-200 text-xs font-semibold leading-relaxed italic">
                    "{{ article.analysis.iaSummary }}"
                  </p>
                </div>

                <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
                  {{ article.summary?.replace(/<[^>]*>/g, '').slice(0, 160) }}...
                </p>
              </div>
              
              <!-- Card Footer -->
              <div class="pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="h-6 w-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                    {{ article.feedName.charAt(0) }}
                  </div>
                  <span class="text-xs font-black text-slate-400 uppercase tracking-tighter">{{ article.feedName }}</span>
                </div>
                
                <a 
                  :href="article.link" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="group/btn flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
                >
                  Insights
                  <ExternalLink class="h-3 w-3 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </a>
              </div>
            </article>
          </div>

          <!-- Empty Nexus State -->
          <div v-else class="glass rounded-[3rem] py-24 px-6 text-center">
            <div class="h-20 w-20 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-indigo-200 dark:border-indigo-800">
              <Search class="h-10 w-10 text-indigo-500" />
            </div>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white">Coordinate Mismatch</h3>
            <p class="text-slate-500 max-w-sm mx-auto mt-4 text-sm font-medium">No signals detected in this sector. Try recalibrating your search parameters or synchronize with the network.</p>
            <button @click="selectedCategory = null; searchQuery = ''" class="mt-10 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 hover:-translate-y-1 transition-all active:scale-95">
              Reset Nexus
            </button>
          </div>

          <!-- Loading More Scroll Sentinel -->
          <div v-if="hasMore && !loading" ref="loadMoreTrigger" class="h-40 flex items-center justify-center">
            <div class="flex flex-col items-center gap-4">
              <RefreshCw class="h-8 w-8 text-indigo-500 animate-spin" />
              <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Syncing...</span>
            </div>
          </div>
          
          <div v-if="!hasMore && articles.length > 0" class="py-20 text-center">
            <div class="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-10 w-full"></div>
            <p class="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center justify-center gap-4">
              <span class="h-px w-8 bg-slate-300 dark:bg-slate-700"></span>
              Pulse of the Nexus Completed
              <span class="h-px w-8 bg-slate-300 dark:bg-slate-700"></span>
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer Nexus -->
    <footer class="mt-20 py-10 glass border-t-white/10 text-center">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
        &copy; 2025 Kognit Intelligent Nexus &bull; Powered by Deep Intelligence
      </p>
    </footer>
  </div>
</template>
