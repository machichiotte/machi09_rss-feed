<script setup lang="ts">
import { 
  Filter
} from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toRef } from 'vue';
import { useI18n } from '../../composables/useI18n';
import TagCloud from '../feed/TagCloud.vue';

/**
 * Sidebar component containing discovery pills, sentiment filters, and origin settings.
 */
const props = defineProps<{
  totalArticles: number;
  categories: string[];
  selectedCategory: string | null;
  selectedSentiment: string | null;
  showLangDropdown: boolean;
  preferredLanguage: string;
}>();

const { t } = useI18n(toRef(props, 'preferredLanguage'));

const emit = defineEmits<{
  (e: 'selectCategory', cat: string | null): void;
  (e: 'toggleSentiment', sent: string): void;
}>();

function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

</script>

<template>
  <aside class="w-full lg:w-72 flex-shrink-0 space-y-3 lg:fixed lg:top-20 lg:pt-8 h-[calc(100vh-5rem)] overflow-y-auto no-scrollbar pb-10 pr-2">
    <!-- 2. Tag Cloud / Discovery -->
    <div class="glass rounded-2xl py-5 px-6 border-brand/5 bg-bg-card/30">
      <h2 class="font-black text-text-muted mb-4 text-[10px] uppercase tracking-[0.25em] flex items-center gap-2">
        <Filter class="h-3 w-3" /> {{ t('sidebar.discovery') }}
      </h2>
      
      <TagCloud 
        :tags="categories" 
        :selected-tag="selectedCategory"
        :placeholder="t('sidebar.search_tags')"
        @select-tag="emit('selectCategory', $event)"
      />
    </div>

    <!-- 3. Market Sentiment -->
    <div class="glass rounded-2xl py-4 px-6 border-brand/5 bg-bg-card/30">
      <h2 class="font-black text-text-muted mb-5 text-[10px] uppercase tracking-[0.25em]">{{ t('sidebar.market_sentiment') }}</h2>
      
      <div class="space-y-1">
        <button 
          v-for="sent in ['bullish', 'bearish', 'neutral']"
          :key="sent"
          @click="emit('toggleSentiment', sent)"
          :class="cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border',
            selectedSentiment === sent
              ? sent === 'bullish' ? 'bg-success/20 text-success border-success/30' : sent === 'bearish' ? 'bg-danger/20 text-danger border-danger/30' : 'bg-text-secondary/10 text-text-primary border-text-secondary/20'
              : 'border-transparent text-text-muted hover:bg-text-secondary/5'
          )"
        >
          <span>{{ sent }}</span>
          <div :class="cn('w-2 h-2 rounded-full', sent === 'bullish' ? 'bg-success icon-glow-success' : sent === 'bearish' ? 'bg-danger' : 'bg-text-muted', selectedSentiment === sent ? 'opacity-100' : 'opacity-30')"></div>
        </button>
      </div>
    </div>
  </aside>
</template>
