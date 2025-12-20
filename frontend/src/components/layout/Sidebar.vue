<script setup lang="ts">
import { 
  Filter, 
  Sparkles, 
  ChevronDown 
} from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Sidebar component containing discovery pills, sentiment filters, and origin settings.
 */
defineProps<{
  totalArticles: number;
  categories: string[];
  selectedCategory: string | null;
  selectedSentiment: string | null;
  showOnlyInsights: boolean;
  dateRange: string;
  languages: string[];
  selectedLanguages: string[];
  showLangDropdown: boolean;
}>();

const emit = defineEmits<{
  (e: 'selectCategory', cat: string | null): void;
  (e: 'toggleSentiment', sent: string): void;
  (e: 'update:showOnlyInsights', val: boolean): void;
  (e: 'update:dateRange', val: string): void;
  (e: 'toggleSelectedLanguage', lang: string): void;
  (e: 'update:showLangDropdown', val: boolean): void;
}>();

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const getLangFlag = (lang?: string) => {
  if (!lang) return '🌍';
  const map: Record<string, string> = {
    'fr': '🇫🇷', 'en': '🇺🇸', 'es': '🇪🇸', 'de': '🇩🇪',
    'it': '🇮🇹', 'pt': '🇵🇹', 'nl': '🇳🇱', 'ru': '🇷🇺',
    'zh': '🇨🇳', 'ja': '🇯🇵', 'ar': '🇸🇦', 'cn': '🇨🇳'
  };
  return map[lang.toLowerCase()] || '🌍';
};
</script>

<template>
  <aside class="w-full lg:w-72 flex-shrink-0 space-y-3 lg:fixed lg:top-20 h-[calc(100vh-5rem)] overflow-y-auto no-scrollbar pb-10 pr-2">
    <!-- 1. Quick Stats -->
    <div class="glass rounded-3xl p-5 bg-brand/10 border-brand/20 relative overflow-hidden group shadow-lg">
      <div class="absolute -right-4 -top-4 bg-brand/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-brand/20 transition-all"></div>
      <div class="relative z-10">
        <p class="text-[9px] font-black uppercase tracking-widest text-brand mb-1">Total Insights</p>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-black tracking-tight text-text-primary">{{ totalArticles.toLocaleString() }}</span>
          <span class="text-[10px] font-bold text-text-muted">articles</span>
        </div>
      </div>
    </div>

    <!-- 2. Discovery -->
    <div class="glass rounded-3xl p-6 shadow-lg">
      <h2 class="font-black text-text-muted mb-4 text-[10px] uppercase tracking-[0.25em] flex items-center gap-2">
        <Filter class="h-3 w-3" /> Discovery
      </h2>
      <div class="flex flex-wrap gap-2">
        <button 
          @click="emit('selectCategory', null)"
          :class="cn(
            'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border',
            selectedCategory === null 
              ? 'bg-text-primary text-bg-card border-text-primary shadow-lg' 
              : 'bg-bg-card/70 text-text-secondary border-brand/10 hover:border-brand/50 shadow-sm'
          )"
        >
          All
        </button>
        <button 
          v-for="category in categories" 
          :key="category"
          @click="emit('selectCategory', category)"
          :class="cn(
            'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border shadow-sm',
            selectedCategory === category
              ? 'bg-brand text-white border-brand shadow-md icon-glow-brand' 
              : 'bg-bg-card/80 text-text-secondary border-brand/10 hover:border-brand/50'
          )"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <!-- 3. Market Sentiment -->
    <div class="glass rounded-3xl p-6 shadow-lg">
      <h2 class="font-black text-text-muted mb-5 text-[10px] uppercase tracking-[0.25em]">Market Sentiment</h2>
      
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

    <!-- 4. Content Origin -->
    <div class="glass rounded-3xl p-6 space-y-5 shadow-lg">
      <h2 class="font-black text-text-muted text-[10px] uppercase tracking-[0.25em]">Content Origin</h2>
      
      <!-- Only AI Insights Toggle -->
      <button 
        @click="emit('update:showOnlyInsights', !showOnlyInsights)"
        :class="cn(
          'w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest',
          showOnlyInsights 
            ? 'bg-insight/10 border-insight/20 text-insight' 
            : 'bg-bg-card/50 border-brand/10 text-text-muted'
        )"
      >
        <span>Only AI Insights</span>
        <Sparkles :class="cn('h-3 w-3', showOnlyInsights ? 'text-insight' : 'text-text-muted')" />
      </button>

      <!-- Date Range Selector -->
      <div class="relative group">
        <select 
          :value="dateRange"
          @change="emit('update:dateRange', ($event.target as HTMLSelectElement).value)"
          class="w-full appearance-none bg-bg-card/50 border border-brand/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-text-secondary transition-all hover:bg-bg-card"
        >
          <option value="all">Anytime</option>
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
        <ChevronDown class="h-3 w-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" />
      </div>

      <!-- Language Dropdown -->
      <div>
        <button 
          @click="emit('update:showLangDropdown', !showLangDropdown)"
          class="w-full flex items-center justify-between bg-bg-card/50 border border-brand/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:bg-bg-card transition-all"
        >
          <span v-if="selectedLanguages.length === 0">All Languages</span>
          <span v-else>{{ selectedLanguages.length }} Selected</span>
          <ChevronDown :class="cn('h-3 w-3 text-text-muted transition-transform', showLangDropdown && 'rotate-180')" />
        </button>

        <div v-if="showLangDropdown" class="mt-2 space-y-1 max-h-48 overflow-y-auto no-scrollbar">
          <button 
            v-for="lang in languages" 
            :key="lang"
            @click="emit('toggleSelectedLanguage', lang)"
            :class="cn(
              'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              selectedLanguages.includes(lang) ? 'bg-brand/10 text-brand' : 'text-text-secondary hover:bg-bg-card'
            )"
          >
            <div class="flex items-center gap-2">
              <span>{{ getLangFlag(lang) }}</span>
              <span class="uppercase">{{ lang }}</span>
            </div>
            <div v-if="selectedLanguages.includes(lang)" class="w-1.5 h-1.5 bg-brand rounded-full"></div>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
