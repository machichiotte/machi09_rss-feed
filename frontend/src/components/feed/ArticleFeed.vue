<script setup lang="ts">
import { ref } from 'vue';
import { RefreshCw, Search } from 'lucide-vue-next';
import ArticleCard from './ArticleCard.vue';
import { toRef } from 'vue';
import { useI18n } from '../../composables/useI18n';

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

const props = defineProps<{
  articles: Article[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  globalInsightMode: boolean;
  globalSummaryMode: boolean;
  preferredLanguage: string;
  translationToggles: Record<string, boolean>;
  viewMode: 'grid' | 'list' | 'compact';
}>();

const { t } = useI18n(toRef(props, 'preferredLanguage'));

const emit = defineEmits<{
  (e: 'retry'): void;
  (e: 'toggleBookmark', id: string): void;
}>();

const loadMoreTrigger = ref<HTMLElement | null>(null);
defineExpose({ loadMoreTrigger });
</script>

<template>
  <div class="w-full space-y-8 pt-6">
    <!-- Error State -->
    <div v-if="error" class="glass rounded-[2.5rem] p-12 text-center border-danger/20">
      <div class="h-16 w-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <RefreshCw class="h-8 w-8 text-danger" />
      </div>
      <h3 class="text-xl font-black text-text-primary mb-2">{{ t('common.error') }}</h3>
      <p class="text-text-muted text-sm font-medium mb-8 max-w-xs mx-auto text-balance">{{ error }}</p>
      <button @click="emit('retry')" class="px-8 py-3 bg-text-primary text-bg-card rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
        {{ t('common.retry') }}
      </button>
    </div>

    <!-- Loading Skeleton Grid -->
    <div 
      v-else-if="loading && articles.length === 0" 
      :class="[
        'grid gap-8',
        viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 
        viewMode === 'compact' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 
        'grid-cols-1 gap-6'
      ]"
    >
      <div v-for="i in 6" :key="i" class="glass-card rounded-[2.5rem] p-8 h-80 animate-pulse">
        <div class="flex justify-between mb-8">
          <div class="h-4 bg-text-secondary/10 rounded-full w-24"></div>
          <div class="h-4 bg-text-secondary/10 rounded-full w-12"></div>
        </div>
        <div class="space-y-4">
          <div class="h-8 bg-text-secondary/10 rounded-2xl w-full"></div>
          <div class="h-8 bg-text-secondary/10 rounded-2xl w-3/4"></div>
          <div class="pt-4 space-y-2">
            <div class="h-3 bg-text-secondary/10 rounded-full w-full"></div>
            <div class="h-3 bg-text-secondary/10 rounded-full w-full"></div>
            <div class="h-3 bg-text-secondary/10 rounded-full w-2/3"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Articles Discovery Grid -->
    <div 
      v-else-if="articles.length > 0" 
      :class="[
        'grid gap-8',
        viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 
        viewMode === 'compact' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 
        'grid-cols-1 gap-6'
      ]"
    >
      <ArticleCard 
        v-for="article in articles" 
        :key="article._id"
        :article="article"
        :global-insight-mode="globalInsightMode"
        :global-summary-mode="globalSummaryMode"
        :preferred-language="preferredLanguage"
        :translation-toggles="translationToggles"
        :view-mode="viewMode"
        @toggle-bookmark="emit('toggleBookmark', $event)"
      />
    </div>

    <!-- Empty Nexus State -->
    <div v-else-if="!loading" class="glass rounded-[3rem] py-24 px-6 text-center">
      <div class="h-20 w-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-brand/20">
        <Search class="h-10 w-10 text-brand" />
      </div>
      <h3 class="text-2xl font-black text-text-primary">{{ t('feed.coordinate_mismatch') }}</h3>
      <p class="text-text-secondary max-w-sm mx-auto mt-4 text-sm font-medium">{{ t('feed.no_signals') }}</p>
    </div>

    <!-- Loading More Scroll Sentinel -->
    <div v-if="hasMore && !loading" ref="loadMoreTrigger" class="h-40 flex items-center justify-center">
      <div class="flex flex-col items-center gap-4">
        <RefreshCw class="h-8 w-8 text-brand animate-spin" />
        <span class="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted animate-pulse">{{ t('common.syncing') }}</span>
      </div>
    </div>
    
    <div v-if="!hasMore && articles.length > 0" class="py-20 text-center">
      <div class="h-px bg-gradient-to-r from-transparent via-text-secondary/20 to-transparent mb-10 w-full"></div>
      <p class="text-[11px] font-black uppercase tracking-[0.4em] text-text-muted flex items-center justify-center gap-4">
        <span class="h-px w-8 bg-text-secondary/20"></span>
        {{ t('feed.pulse_completed') }}
        <span class="h-px w-8 bg-text-secondary/20"></span>
      </p>
    </div>
  </div>
</template>
