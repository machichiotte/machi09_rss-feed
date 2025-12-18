<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
  Globe
} from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Types
interface Article {
  _id: string;
  title: string;
  link: string;
  sourceFeed: string;
  feedName: string;
  category: string;
  language?: string; // e.g. 'fr', 'en'
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
const processing = ref(false);
const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);
const selectedSource = ref<string | null>(null);
const selectedSentiment = ref<'bullish' | 'bearish' | null>(null);
const selectedLanguage = ref<string | null>(null);

// Computed
const categories = computed(() => {
  const cats = new Set(articles.value.map(a => a.category).filter(Boolean));
  return Array.from(cats).sort();
});

const sources = computed(() => {
  // Get sources available for the selected category + language
  let relevant = articles.value;

  if (selectedCategory.value) {
    relevant = relevant.filter(a => a.category === selectedCategory.value);
  }
  
  if (selectedLanguage.value) {
    relevant = relevant.filter(a => a.language === selectedLanguage.value);
  }
    
  const srcs = new Set(relevant.map(a => a.feedName).filter(Boolean));
  return Array.from(srcs).sort();
});

const languages = computed(() => {
  const langs = new Set(articles.value.map(a => a.language).filter(Boolean));
  return Array.from(langs).sort();
});

const filteredArticles = computed(() => {
  return articles.value.filter(article => {
    // 1. Text Search
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          article.summary?.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    // 2. Category Filter
    const matchesCategory = selectedCategory.value ? article.category === selectedCategory.value : true;
    
    // 3. Source Filter
    const matchesSource = selectedSource.value ? article.feedName === selectedSource.value : true;

    // 4. Sentiment Filter
    const matchesSentiment = selectedSentiment.value 
      ? article.analysis?.sentiment === selectedSentiment.value 
      : true;

    // 5. Language Filter
    const matchesLanguage = selectedLanguage.value ? article.language === selectedLanguage.value : true;

    return matchesSearch && matchesCategory && matchesSource && matchesSentiment && matchesLanguage;
  });
});

// Methods
const selectCategory = (category: string | null) => {
  selectedCategory.value = category;
  selectedSource.value = null; // Reset source when category changes
};

const fetchArticles = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/rss');
    // Sort by most recent date
    articles.value = response.data.data.sort((a: Article, b: Article) => 
      new Date(b.publicationDate || b.fetchedAt).getTime() - new Date(a.publicationDate || a.fetchedAt).getTime()
    );
  } catch (error) {
    console.error('Failed to fetch articles:', error);
  } finally {
    loading.value = false;
  }
};

const triggerProcess = async () => {
  processing.value = true;
  try {
    await axios.post('/api/rss/process');
    // Wait a bit to let the backend process and update DB, then refresh
    setTimeout(() => {
      fetchArticles();
      processing.value = false;
    }, 4000); 
  } catch (error) {
    console.error('Failed to process feeds:', error);
    processing.value = false;
  }
};

const formatDate = (dateStr: string) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch (e) {
    return 'Recently';
  }
};

const getSentimentColor = (sentiment: string) => {
  return sentiment === 'bullish' 
    ? 'bg-green-100 text-green-700 ring-green-600/20' 
    : 'bg-red-100 text-red-700 ring-red-600/20';
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

onMounted(() => {
  fetchArticles();
});

// Utility for merging classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Navbar -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm backdrop-blur-xl bg-white/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-3">
            <div class="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Rss class="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                MachiFeed
              </h1>
              <p class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">AI News Aggregator</p>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="relative hidden md:block">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search articles..." 
                class="pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all w-64 text-sm"
              />
            </div>
            
            <button 
              @click="triggerProcess" 
              :disabled="processing"
              :class="cn(
                'flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all shadow-sm',
                processing 
                  ? 'bg-indigo-50 text-indigo-400 cursor-not-allowed border border-indigo-100' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300'
              )"
            >
              <RefreshCw :class="cn('h-4 w-4', processing && 'animate-spin')" />
              {{ processing ? 'Analyzing...' : 'Refresh' }}
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
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h2 class="font-semibold text-slate-900 flex items-center gap-2 mb-4 text-xs uppercase tracking-wide">
              <Filter class="h-4 w-4" /> Categories
            </h2>
            
            <div class="space-y-1">
              <button 
                @click="selectCategory(null)"
                :class="cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedCategory === null 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50'
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
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50'
                )"
              >
                {{ category }}
                <ChevronRight v-if="selectedCategory === category" class="h-3 w-3" />
              </button>
            </div>
          </div>

          <!-- Language Filter -->
          <div v-if="languages.length > 0" class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h2 class="font-semibold text-slate-900 flex items-center gap-2 mb-3 text-xs uppercase tracking-wide">
                <Globe class="h-4 w-4" /> Language
            </h2>
            <div class="flex flex-wrap gap-2">
                 <button 
                    @click="selectedLanguage = null"
                    :class="cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                        selectedLanguage === null
                            ? 'bg-slate-100 text-slate-800 border-slate-200'
                            : 'bg-white text-slate-500 border-dashed border-slate-200 hover:border-slate-300'
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
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/20'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'
                    )"
                >
                    {{ getLangFlag(lang) }} <span class="uppercase">{{ lang }}</span>
                </button>
            </div>
          </div>

          <!-- Sources & Sentiment -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-6">
            
            <!-- Source Filter -->
            <div>
              <h2 class="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wide">
                Sources
              </h2>
              <select 
                v-model="selectedSource"
                class="w-full rounded-lg border-slate-200 text-sm p-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option :value="null">All Sources</option>
                <option v-for="source in sources" :key="source" :value="source">
                  {{ source }}
                </option>
              </select>
            </div>

            <!-- Sentiment Filter -->
            <div>
              <h2 class="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wide">
                AI Sentiment
              </h2>
              <div class="flex gap-2">
                <button 
                  @click="selectedSentiment = selectedSentiment === 'bullish' ? null : 'bullish'"
                  :class="cn(
                    'flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all border',
                    selectedSentiment === 'bullish'
                      ? 'bg-green-100 text-green-700 border-green-200 ring-2 ring-green-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-green-300 hover:text-green-600'
                  )"
                >
                  🚀 Bullish
                </button>
                <button 
                  @click="selectedSentiment = selectedSentiment === 'bearish' ? null : 'bearish'"
                  :class="cn(
                    'flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all border',
                    selectedSentiment === 'bearish'
                      ? 'bg-red-100 text-red-700 border-red-200 ring-2 ring-red-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-600'
                  )"
                >
                  🐻 Bearish
                </button>
              </div>
            </div>

          </div>

          <!-- Stats -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h2 class="font-semibold text-slate-900 flex items-center gap-2 mb-4 text-xs uppercase tracking-wide">
                <TrendingUp class="h-4 w-4" /> Stats
              </h2>
              <div class="bg-slate-50 rounded-lg p-3 text-sm border border-slate-100">
                <div class="flex justify-between mb-2">
                  <span class="text-slate-500">Articles</span>
                  <span class="font-bold text-slate-900">{{ articles.length }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-500">Sources</span>
                  <span class="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-xs font-medium">{{ new Set(articles.map(a => a.feedName)).size }}</span>
                </div>
              </div>
            </div>
        </aside>

        <!-- Main Content -->
        <div class="flex-1">
          <!-- Loading State -->
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="i in 6" :key="i" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-56 animate-pulse">
              <div class="flex gap-2 mb-4">
                 <div class="h-5 bg-slate-200 rounded-full w-20"></div>
                 <div class="h-5 bg-slate-200 rounded-full w-16"></div>
              </div>
              <div class="h-6 bg-slate-200 rounded w-full mb-2"></div>
              <div class="h-6 bg-slate-200 rounded w-2/3 mb-4"></div>
              <div class="h-4 bg-slate-200 rounded w-full mb-2"></div>
              <div class="h-4 bg-slate-200 rounded w-full mb-2"></div>
              <div class="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredArticles.length === 0" class="text-center py-24 bg-white rounded-xl border border-slate-200 border-dashed">
            <div class="bg-slate-50 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Newspaper class="h-8 w-8 text-slate-400" />
            </div>
            <h3 class="text-lg font-medium text-slate-900">No articles found</h3>
            <p class="text-slate-500 mt-1 max-w-sm mx-auto">Try adjusting your search or click refresh to fetch the latest news.</p>
            <button @click="selectedCategory = null; searchQuery = ''" class="mt-4 text-indigo-600 font-medium hover:underline">
              Clear filters
            </button>
          </div>

          <!-- Articles Grid -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article 
              v-for="article in filteredArticles" 
              :key="article._id"
              class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
            >
              <div class="p-6 flex flex-col flex-1 relative">
                <!-- Header -->
                <div class="flex justify-between items-start mb-3">
                  <div class="flex gap-2 flex-wrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      {{ article.category }}
                    </span>

                    <!-- Lang Badge (if multiple languages exist) -->
                    <span v-if="languages.length > 1 && article.language" title="Language" class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-slate-50 text-slate-500 border border-slate-100 cursor-help">
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
                  <span class="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap ml-2">
                    <Clock class="h-3 w-3" />
                    {{ formatDate(article.publicationDate || article.fetchedAt) }}
                  </span>
                </div>
                
                <!-- Title -->
                <h3 class="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                  <a :href="article.link" target="_blank" rel="noopener noreferrer">
                    {{ article.title }}
                  </a>
                </h3>
                
                <!-- Summary -->
                <p class="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {{ article.summary?.replace(/<[^>]*>/g, '').slice(0, 160) }}...
                </p>
                
                <!-- Footer -->
                <div class="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span class="text-xs font-semibold text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                    {{ article.feedName }}
                  </span>
                  
                  <a 
                    :href="article.link" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1 group/link"
                  >
                    Read
                    <ExternalLink class="h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
