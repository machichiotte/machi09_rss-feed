<script setup lang="ts">
/* global performance */
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
  Sparkles, 
  Languages,
  ArrowRight,
  Minus,
  ChevronDown
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
const globalMagicMode = ref(localStorage.globalMagicMode === 'true');
const preferredLanguage = ref(localStorage.preferredLanguage || 'fr');
if (!localStorage.preferredLanguage) localStorage.preferredLanguage = 'fr';
const insightVisibility = ref<Record<string, boolean>>({}); // articleId -> visible
const translationToggles = ref<Record<string, boolean>>({}); // articleId -> isTranslated
const showLangDropdown = ref(false);
const isDark = ref(false);
const error = ref<string | null>(null);

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
  const startTime = performance.now();
  console.log('🔍 [Frontend] Fetching metadata...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/rss/metadata`);
    const duration = Math.round(performance.now() - startTime);
    
    allCategories.value = response.data.categories || [];
    allSources.value = response.data.sources || [];
    allLanguages.value = response.data.languages || [];
    
    console.log(`✅ [Frontend] Metadata received in ${duration}ms:`, {
      categories: allCategories.value.length,
      sources: allSources.value.length,
      languages: allLanguages.value.length
    });
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    console.error(`❌ [Frontend] Failed to fetch metadata after ${duration}ms:`, error);
  }
};

// eslint-disable-next-line complexity
async function loadArticles(reset = false) {
  const startTime = performance.now();
  const requestType = reset ? 'INITIAL/RESET' : 'PAGINATION';
  
  if (reset) {
    currentPage.value = 1;
    articles.value = [];
    loading.value = true;
    error.value = null;
    console.log(`📡 [Frontend] Loading articles (${requestType})...`);
  } else {
    if (loadingMore.value || loading.value) return;
    loadingMore.value = true;
    console.log(`📡 [Frontend] Loading more articles (page ${currentPage.value})...`);
  }

  try {
    const params = getFetchParams();
    console.log('   📋 Request params:', params);
    
    const response = await axios.get(`${API_BASE_URL}/api/rss`, { params });
    const networkTime = Math.round(performance.now() - startTime);
    
    const data = response.data;
    const newArticles = data.articles || data.data || [];
    
    articles.value = reset ? newArticles : [...articles.value, ...newArticles];
    totalArticles.value = data.total || 0;
    hasMore.value = articles.value.length < totalArticles.value;
    currentPage.value++;

    const totalTime = Math.round(performance.now() - startTime);
    console.log(`✅ [Frontend] Articles loaded in ${totalTime}ms (network: ${networkTime}ms):`, {
      received: newArticles.length,
      total: totalArticles.value,
      currentlyDisplayed: articles.value.length,
      hasMore: hasMore.value
    });

    nextTick(() => checkAndLoadMore());
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    console.error(`❌ [Frontend] Failed to load articles after ${duration}ms:`, err);
    handleFetchError(err);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function getFetchParams() {
  return {
    page: currentPage.value,
    limit: limit.value,
    category: selectedCategory.value,
    sentiment: selectedSentiment.value,
    language: selectedLanguages.value.length > 0 ? selectedLanguages.value.join(',') : null,
    search: searchQuery.value,
    source: selectedSource.value
  };
}

function handleFetchError(err: unknown) {
  console.error('Failed to load articles:', err);
  let status: number | undefined;
  if (axios.isAxiosError(err)) {
    status = err.status || err.response?.status;
  }
  error.value = status === 504 
    ? "Nexus is currently busy processing AI insights. Please wait a moment." 
    : "Failed to synchronize with Nexus. Check your connection.";
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
  const startTime = performance.now();
  console.log('🔄 [Frontend] Triggering RSS feed processing...');
  
  processing.value = true;
  try {
    await axios.post(`${API_BASE_URL}/api/rss/process`);
    const duration = Math.round(performance.now() - startTime);
    console.log(`✅ [Frontend] Process triggered in ${duration}ms, waiting 4s before reload...`);
    
    setTimeout(() => {
      console.log('🔄 [Frontend] Reloading articles after processing...');
      loadArticles(true);
      processing.value = false;
    }, 4000); 
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    console.error(`❌ [Frontend] Failed to trigger process after ${duration}ms:`, error);
    processing.value = false;
  }
};

const selectCategory = (category: string | null) => {
  selectedCategory.value = category;
  selectedSource.value = null;
};

const setPreferredLanguage = (lang: string) => {
  preferredLanguage.value = lang;
  localStorage.preferredLanguage = lang;
};

const setGlobalMagic = (val: boolean) => {
  globalMagicMode.value = val;
  localStorage.globalMagicMode = val.toString();
};

const getArticleTitle = (article: Article) => {
  return article.title;
};

const getArticleInsightTitle = (article: Article) => {
  const translations = article.translations;
  const isTranslated = translationToggles.value[article._id];
  const translation = translations?.[preferredLanguage.value];
  
  if (isTranslated && translation) {
    return translation.title;
  }
  return '';
};

const getArticleInsight = (article: Article) => {
  const translations = article.translations;
  const translation = translations ? translations[preferredLanguage.value] : undefined;
  const isTranslated = translationToggles.value[article._id];
  
  if (isTranslated && translation) {
    return translation.iaSummary || translation.summary;
  }
  return article.analysis?.iaSummary || article.summary || 'No AI Insight available';
};

const hasTranslation = (article: Article) => {
  return !!(article.translations && article.translations[preferredLanguage.value]);
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

const toggleSelectedLanguage = (lang: string) => {
  if (selectedLanguages.value.includes(lang)) {
    selectedLanguages.value = selectedLanguages.value.filter(l => l !== lang);
  } else {
    selectedLanguages.value.push(lang);
  }
};

// Computed
const categories = computed(() => allCategories.value);
const languages = computed(() => allLanguages.value);
const filteredArticles = computed(() => articles.value); // Articles are already filtered on server

// Watchers
let filterTimeout: ReturnType<typeof setTimeout> | null = null;
watch([selectedCategory, selectedSentiment, selectedLanguages, selectedSource, preferredLanguage], (newValues) => {
    console.log('🎯 [Frontend] Filter changed:', {
      category: newValues[0],
      sentiment: newValues[1],
      languages: newValues[2],
      source: newValues[3],
      preferredLanguage: newValues[4]
    });
    
    if (filterTimeout) clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        console.log('🔄 [Frontend] Applying filters (300ms debounce)...');
        loadArticles(true);
    }, 300);
}, { deep: true });

watch(globalMagicMode, (val) => {
  articles.value.forEach(article => {
    insightVisibility.value[article._id] = val;
    translationToggles.value[article._id] = val;
  });
});

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, (newVal, oldVal) => {
    if (newVal !== oldVal) {
      console.log(`🔍 [Frontend] Search query changed: "${newVal}"`);
    }
    
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        if (newVal) {
          console.log(`🔄 [Frontend] Executing search for: "${newVal}" (500ms debounce)...`);
        }
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

            <div class="hidden md:block relative group mr-2">
              <select 
                v-model="preferredLanguage"
                @change="setPreferredLanguage(preferredLanguage)"
                class="appearance-none bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-800 rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer uppercase min-w-[100px] text-slate-600 dark:text-slate-300 transition-all hover:bg-white dark:hover:bg-slate-800"
              >
                <option v-for="lang in languages" :key="lang" :value="lang">
                  {{ getLangFlag(lang) }} {{ lang.toUpperCase() }}
                </option>
              </select>
              <ChevronDown class="h-3 w-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
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
        <aside class="w-full lg:w-72 flex-shrink-0 space-y-8 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
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
          <div class="glass rounded-3xl p-6 space-y-8 relative z-20">
            <!-- Translation State -->
            <div class="flex items-center justify-between p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <div>
                <h2 class="font-black text-amber-600 text-[10px] uppercase tracking-widest">Intelligence Hub</h2>
                <p class="text-[9px] text-amber-600/60 uppercase font-bold">Auto-Insights</p>
              </div>
              <button 
                @click="setGlobalMagic(!globalMagicMode)"
                :class="cn(
                  'w-10 h-6 rounded-full transition-all relative',
                  globalMagicMode ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                )"
              >
                <div 
                  :class="cn(
                    'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm',
                    globalMagicMode ? 'translate-x-4' : 'translate-x-0'
                  )"
                ></div>
              </button>
            </div>

            <!-- Sentiment Hub -->
            <div>
              <h2 class="font-black text-slate-400 mb-4 text-[10px] uppercase tracking-[0.25em]">Intelligence</h2>
              <div class="grid grid-cols-1 gap-2">
                <div class="grid grid-cols-2 gap-2">
                  <button 
                    @click="selectedSentiment = selectedSentiment === 'bullish' ? null : 'bullish'"
                    :class="cn(
                      'group relative py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 overflow-hidden',
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
                      'group relative py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 overflow-hidden',
                      selectedSentiment === 'bearish'
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                        : 'bg-rose-500/5 text-rose-600 dark:text-rose-400 border border-rose-500/10 hover:bg-rose-500/10'
                    )"
                  >
                    Bearish
                    <TrendingUp class="absolute -right-2 -bottom-2 h-8 w-8 opacity-10 rotate-180 group-hover:scale-125 transition-transform" />
                  </button>
                </div>
                <button 
                  @click="selectedSentiment = selectedSentiment === 'neutral' ? null : 'neutral'"
                  :class="cn(
                    'group relative py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 overflow-hidden',
                    selectedSentiment === 'neutral'
                      ? 'bg-slate-500 text-white shadow-lg shadow-slate-500/20'
                      : 'bg-slate-500/5 text-slate-600 dark:text-slate-400 border border-slate-500/10 hover:bg-slate-500/10'
                  )"
                >
                  Neutral / Stable
                </button>
              </div>
            </div>

            <!-- Language Hub (Filtering) -->
            <div class="relative">
              <h2 class="font-black text-slate-400 mb-2 text-[10px] uppercase tracking-[0.25em]">Network Filter</h2>
              <div class="relative">
                <button 
                  @click="showLangDropdown = !showLangDropdown"
                  class="w-full bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-left flex items-center justify-between relative z-10"
                >
                  <span v-if="selectedLanguages.length === 0">All Languages</span>
                  <span v-else class="truncate">{{ selectedLanguages.join(', ').toUpperCase() }}</span>
                  <ChevronDown class="h-3 w-3 text-slate-400" />
                </button>
                
                <div v-if="showLangDropdown" class="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-900 border border-white/20 dark:border-slate-800 rounded-2xl shadow-2xl p-2 max-h-60 overflow-y-auto">
                  <button 
                    v-for="lang in languages" 
                    :key="lang"
                    @click="toggleSelectedLanguage(lang)"
                    :class="cn(
                      'w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors',
                      selectedLanguages.includes(lang) ? 'bg-indigo-500/10 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    )"
                  >
                    <div class="flex items-center gap-2">
                      <span>{{ getLangFlag(lang) }}</span>
                      <span class="uppercase">{{ lang }}</span>
                    </div>
                    <div v-if="selectedLanguages.includes(lang)" class="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="glass rounded-3xl p-6 bg-indigo-600/5 border-indigo-500/10 dark:bg-indigo-400/5 relative z-10">
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

          <!-- Error State -->
          <div v-if="error" class="glass rounded-[2.5rem] p-12 text-center border-rose-500/20">
            <div class="h-16 w-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw class="h-8 w-8 text-rose-500" />
            </div>
            <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2">Nexus Sync Interrupted</h3>
            <p class="text-slate-500 text-sm font-medium mb-8 max-w-xs mx-auto text-balance">{{ error }}</p>
            <button @click="loadArticles(true)" class="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
              Retry Synchronization
            </button>
          </div>

          <!-- Loading Skeleton Grid -->
          <div v-else-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  <span class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-white/5 text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    {{ article.category }}
                    <template v-if="translationToggles[article._id] && article.translations?.[preferredLanguage]">
                      <span class="mx-1 opacity-50">•</span>
                      {{ getLangFlag(article.language || 'en') }}
                      <ArrowRight class="h-2.5 w-2.5 text-slate-400 mx-0.5" />
                      {{ getLangFlag(preferredLanguage) }}
                    </template>
                    <template v-else>
                      <span class="mx-1 opacity-50">•</span>
                      {{ getLangFlag(article.language || 'en') }}
                    </template>
                  </span>

                  <span v-if="article.analysis?.isPromotional" class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse">
                    Promotional
                  </span>
                  
                  <!-- AI Sentiment Hub -->
                  <div 
                    v-if="article.analysis" 
                    :class="cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border',
                      article.analysis?.sentiment === 'bullish' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                        : article.analysis?.sentiment === 'bearish'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                    )"
                  >
                    <TrendingUp v-if="article.analysis?.sentiment !== 'neutral'" :class="cn('h-3 w-3', article.analysis?.sentiment === 'bearish' && 'rotate-180')" />
                    <Minus v-else class="h-3 w-3" />
                    {{ Math.round((article.analysis?.sentimentScore || 0) * 100) }}%
                  </div>
                </div>
                
                <span class="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Clock class="h-3 w-3" />
                  {{ formatDate(article.publicationDate || article.fetchedAt) }}
                </span>
              </div>
              
              <!-- Title & Body -->
              <div class="flex-1 mb-8">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-xl font-extrabold text-slate-900 dark:text-white leading-[1.3] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer flex-1 mr-4">
                    <a :href="article.link" target="_blank" rel="noopener noreferrer">
                      {{ getArticleTitle(article) }}
                    </a>
                  </h3>

                  <!-- Action Buttons -->
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <!-- Insight Toggle Button (Magic) -->
                    <button 
                      @click="insightVisibility[article._id] = !insightVisibility[article._id]"
                      :class="cn(
                        'p-2 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest min-w-[40px] justify-center',
                        insightVisibility[article._id]
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-white/5 text-slate-500 dark:text-slate-400'
                      )"
                      title="Toggle AI Insight"
                    >
                      <Sparkles class="h-3.5 w-3.5" />
                    </button>

                    <!-- Translation Toggle Button -->
                    <button 
                      v-if="hasTranslation(article) && insightVisibility[article._id]"
                      @click="translationToggles[article._id] = !translationToggles[article._id]"
                      :class="cn(
                        'p-2 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest min-w-[40px] justify-center',
                        translationToggles[article._id]
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-white/5 text-slate-500 dark:text-slate-400'
                      )"
                      title="Translate Insight"
                    >
                      <Languages class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                
                <!-- AI Summary (If available) -->
                <div v-if="insightVisibility[article._id] && (article.analysis?.iaSummary || hasTranslation(article))" class="mb-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 dark:bg-indigo-400/5 relative overflow-hidden group/ia transition-all duration-300">
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                  
                  <div class="flex justify-between items-center mb-2">
                    <p class="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1">
                      <Sparkles class="h-3 w-3" /> 
                      AI Insight
                      <span v-if="translationToggles[article._id]" class="ml-2 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[8px] flex items-center gap-1">
                        {{ getLangFlag(article.language || 'en') }} 
                        <ArrowRight class="h-2 w-2" /> 
                        {{ getLangFlag(preferredLanguage) }}
                      </span>
                    </p>
                  </div>

                  <h4 v-if="translationToggles[article._id] && getArticleInsightTitle(article)" class="text-xs font-bold text-slate-800 dark:text-indigo-100 mb-2 leading-tight">
                    {{ getArticleInsightTitle(article) }}
                  </h4>

                  <p class="text-slate-600 dark:text-indigo-200 text-xs font-semibold leading-relaxed italic">
                    "{{ getArticleInsight(article) }}"
                  </p>
                </div>

                <p v-if="!insightVisibility[article._id]" class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
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
