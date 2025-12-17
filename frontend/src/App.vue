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
  ChevronRight
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
  publicationDate: string;
  summary: string;
  fetchedAt: string;
}

// State
const articles = ref<Article[]>([]);
const loading = ref(true);
const processing = ref(false);
const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);

// Computed
const categories = computed(() => {
  const cats = new Set(articles.value.map(a => a.category).filter(Boolean));
  return Array.from(cats);
});

const filteredArticles = computed(() => {
  return articles.value.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          article.summary?.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory = selectedCategory.value ? article.category === selectedCategory.value : true;
    return matchesSearch && matchesCategory;
  });
});

// Methods
const fetchArticles = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/rss');
    // Trier par date la plus récente
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
    // Attendre un peu puis rafraîchir
    setTimeout(() => {
      fetchArticles();
      processing.value = false;
    }, 2000);
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

onMounted(() => {
  fetchArticles();
});

// Utility for merging classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-sans">
    <!-- Navbar -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-2">
            <div class="bg-indigo-600 p-2 rounded-lg">
              <Rss class="h-6 w-6 text-white" />
            </div>
            <h1 class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              MachiFeed
            </h1>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="relative hidden sm:block">
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
                'flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all',
                processing 
                  ? 'bg-indigo-100 text-indigo-700 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
              )"
            >
              <RefreshCw :class="cn('h-4 w-4', processing && 'animate-spin')" />
              {{ processing ? 'Updating...' : 'Refresh Feeds' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar Filters -->
        <aside class="w-full lg:w-64 flex-shrink-0">
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-24">
            <h2 class="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Filter class="h-4 w-4" /> Filters
            </h2>
            
            <div class="space-y-1">
              <button 
                @click="selectedCategory = null"
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
                @click="selectedCategory = category"
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

            <div class="mt-8">
              <h2 class="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <TrendingUp class="h-4 w-4" /> Stats
              </h2>
              <div class="bg-slate-50 rounded-lg p-3 text-sm">
                <div class="flex justify-between mb-2">
                  <span class="text-slate-500">Total Articles</span>
                  <span class="font-medium">{{ articles.length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Sources</span>
                  <span class="font-medium">{{ new Set(articles.map(a => a.feedName)).size }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="flex-1">
          <!-- Loading State -->
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="i in 6" :key="i" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-48 animate-pulse">
              <div class="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
              <div class="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div class="h-4 bg-slate-200 rounded w-full mb-2"></div>
              <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredArticles.length === 0" class="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
            <Newspaper class="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-slate-900">No articles found</h3>
            <p class="text-slate-500 mt-1">Try adjusting your search or refresh the feeds.</p>
            <button @click="selectedCategory = null; searchQuery = ''" class="mt-4 text-indigo-600 font-medium hover:underline">
              Clear filters
            </button>
          </div>

          <!-- Articles Grid -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article 
              v-for="article in filteredArticles" 
              :key="article._id"
              class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group flex flex-col h-full"
            >
              <div class="p-6 flex flex-col flex-1">
                <div class="flex justify-between items-start mb-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    {{ article.category }}
                  </span>
                  <span class="text-xs text-slate-500 flex items-center gap-1">
                    <Clock class="h-3 w-3" />
                    {{ formatDate(article.publicationDate || article.fetchedAt) }}
                  </span>
                </div>
                
                <h3 class="text-lg font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  <a :href="article.link" target="_blank" rel="noopener noreferrer">
                    {{ article.title }}
                  </a>
                </h3>
                
                <p class="text-slate-600 text-sm mb-4 line-clamp-3">
                  {{ article.summary?.replace(/<[^>]*>/g, '').slice(0, 150) }}...
                </p>
                
                <div class="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span class="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <!-- Favicon fallback would go here -->
                    {{ article.feedName }}
                  </span>
                  
                  <a 
                    :href="article.link" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                  >
                    Read
                    <ExternalLink class="h-3 w-3" />
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
