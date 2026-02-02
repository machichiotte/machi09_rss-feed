<script setup lang="ts">
import { 
  Rss, 
  Search, 
  RefreshCw, 
  Languages, 
  Sparkles, 
  FileText, 
  Sun, 
  Moon,
  Settings,
  BarChart3
} from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toRef } from 'vue';
import { RouterLink } from 'vue-router';
import { useI18n } from '../../composables/useI18n';
import LayoutToggle from './LayoutToggle.vue';

/**
 * Navigation bar component containing search, language selection, and global mode toggles.
 */
const props = defineProps<{
  searchQuery: string;
  preferredLanguage: string;
  autoTranslate: boolean;
  globalInsightMode: boolean;
  globalSummaryMode: boolean;
  isDark: boolean;
  processing: boolean;
  viewMode: 'grid' | 'list' | 'compact';
}>();

const { t } = useI18n(toRef(props, 'preferredLanguage'));

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void;
  (e: 'update:preferredLanguage', val: string): void;
  (e: 'update:autoTranslate', val: boolean): void;
  (e: 'update:globalInsightMode', val: boolean): void;
  (e: 'update:globalSummaryMode', val: boolean): void;
  (e: 'toggleTheme'): void;
  (e: 'triggerProcess'): void;
  (e: 'update:viewMode', val: 'grid' | 'list' | 'compact'): void;
  (e: 'openSettings'): void;
}>();

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}
</script>

<template>
  <header class="sticky top-0 z-30 glass border-b-brand/10 h-20 overflow-hidden">
    <div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10">
      <div class="flex justify-between h-20 items-center">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-4 group cursor-pointer" @click="emit('update:searchQuery', '')">
          <div class="bg-brand/15 p-2.5 rounded-2xl shadow-xl shadow-brand/10 group-hover:scale-110 transition-transform duration-500 border border-brand/20 icon-glow-brand">
            <Rss class="h-6 w-6 text-brand" />
          </div>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-text-primary via-brand to-brand/80 bg-clip-text text-transparent italic text-text-primary">
              Kognit
            </h1>
            <div class="flex items-center gap-2">
              <span class="flex h-1.5 w-1.5 rounded-full bg-success animate-pulse"></span>
              <p class="text-[10px] uppercase tracking-[0.2em] font-black text-text-muted">Intelligent Feed</p>
            </div>
          </div>
        </router-link>
        
        <div class="flex items-center gap-3 md:gap-6">
          <!-- Desktop Search -->
          <div class="relative hidden md:block">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input 
              :value="searchQuery"
              @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
              type="text" 
              :placeholder="t('common.search_placeholder')" 
              class="pl-12 pr-6 py-2.5 rounded-2xl border border-brand/20 bg-bg-card/70 backdrop-blur-xl focus:bg-bg-card focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none w-72 text-sm transition-all text-text-primary"
            />
          </div>

          <!-- Controls -->
          <div class="hidden md:flex items-center gap-3">
             <router-link 
              to="/analytics" 
              class="flex items-center gap-2 px-3 py-2 rounded-xl border border-brand/20 bg-bg-card/70 text-text-muted hover:bg-brand/10 hover:text-brand transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
              active-class="bg-brand/10 text-brand border-brand/40 shadow-inner"
            >
              <BarChart3 class="h-4 w-4" />
              <span class="hidden lg:inline">Analyze</span>
            </router-link>

            <!-- Global Translate Toggle -->
            <button 
              @click="emit('update:autoTranslate', !autoTranslate)"
              :title="t('nav.translate')"
              :class="cn(
                'flex items-center justify-center p-2.5 rounded-xl border transition-all shadow-sm',
                autoTranslate 
                  ? 'bg-translate/15 border-translate/30 text-translate shadow-inner' 
                  : 'bg-bg-card/70 border-brand/20 text-text-muted hover:bg-bg-card'
              )"
            >
              <Languages class="h-4 w-4" />
            </button>

            <!-- Insight Mode Toggle -->
            <button 
              @click="emit('update:globalInsightMode', !globalInsightMode)"
              :title="t('nav.insights')"
              :class="cn(
                'flex items-center justify-center p-2.5 rounded-xl border transition-all shadow-sm',
                globalInsightMode 
                  ? 'bg-insight/15 border-insight/30 text-insight shadow-inner' 
                  : 'bg-bg-card/70 border-brand/20 text-text-muted hover:bg-bg-card'
              )"
            >
              <Sparkles class="h-4 w-4" />
            </button>

            <!-- Summary Mode Toggle -->
            <button 
              @click="emit('update:globalSummaryMode', !globalSummaryMode)"
              :title="t('nav.summary')"
              :class="cn(
                'flex items-center justify-center p-2.5 rounded-xl border transition-all shadow-sm',
                globalSummaryMode 
                  ? 'bg-summary/15 border-summary/30 text-summary shadow-inner' 
                  : 'bg-bg-card/70 border-brand/20 text-text-muted hover:bg-bg-card'
              )"
            >
              <FileText class="h-4 w-4" />
            </button>
          </div>

          <!-- Utility Control Group -->
          <div class="flex items-center gap-3">
            <LayoutToggle 
              :model-value="viewMode" 
              @update:model-value="emit('update:viewMode', $event)" 
              class="hidden xl:flex"
            />

            <div class="flex items-center p-1.5 bg-bg-card/50 backdrop-blur-md rounded-2xl border border-brand/20">
              <button 
                @click="emit('toggleTheme')"
                class="p-2 rounded-xl text-text-muted hover:bg-bg-card transition-all duration-300"
              >
                <Sun v-if="isDark" class="h-4 w-4" />
                <Moon v-else class="h-4 w-4" />
              </button>

              <div class="w-px h-4 bg-text-secondary/20 mx-1"></div>
            
              <button 
                @click="emit('triggerProcess')" 
                :disabled="processing"
                class="p-2 rounded-xl text-text-muted hover:bg-bg-card transition-all duration-300 group"
              >
                <RefreshCw :class="cn('h-4 w-4 group-hover:rotate-180 transition-transform duration-700', processing && 'animate-spin')" />
              </button>
            </div>

            <button 
              @click="emit('openSettings')"
              class="p-3 rounded-2xl bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-all shadow-lg icon-glow-brand"
            >
              <Settings class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
