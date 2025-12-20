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
  ChevronDown 
} from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Navigation bar component containing search, language selection, and global mode toggles.
 */
defineProps<{
  searchQuery: string;
  preferredLanguage: string;
  languages: string[];
  autoTranslate: boolean;
  globalInsightMode: boolean;
  globalSummaryMode: boolean;
  isDark: boolean;
  processing: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void;
  (e: 'update:preferredLanguage', val: string): void;
  (e: 'update:autoTranslate', val: boolean): void;
  (e: 'update:globalInsightMode', val: boolean): void;
  (e: 'update:globalSummaryMode', val: boolean): void;
  (e: 'toggleTheme'): void;
  (e: 'triggerProcess'): void;
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
  <header class="sticky top-0 z-30 glass border-b-brand/10 h-20 overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-20 items-center">
        <!-- Logo -->
        <div class="flex items-center gap-4 group cursor-pointer" @click="emit('update:searchQuery', '')">
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
        </div>
        
        <div class="flex items-center gap-3 md:gap-6">
          <!-- Desktop Search -->
          <div class="relative hidden md:block">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input 
              :value="searchQuery"
              @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
              type="text" 
              placeholder="Search the nexus..." 
              class="pl-12 pr-6 py-2.5 rounded-2xl border border-brand/20 bg-bg-card/70 backdrop-blur-xl focus:bg-bg-card focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none w-72 text-sm transition-all text-text-primary"
            />
          </div>

          <!-- Controls -->
          <div class="hidden md:flex items-center gap-3">
            <div class="relative group">
              <select 
                :value="preferredLanguage"
                @change="emit('update:preferredLanguage', ($event.target as HTMLSelectElement).value)"
                class="appearance-none bg-bg-card/70 border border-brand/20 rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold focus:ring-2 focus:ring-brand/20 outline-none cursor-pointer uppercase min-w-[100px] text-text-secondary transition-all hover:bg-bg-card shadow-sm"
              >
                <option v-for="lang in languages" :key="lang" :value="lang">
                  {{ getLangFlag(lang) }} {{ lang.toUpperCase() }}
                </option>
              </select>
              <ChevronDown class="h-3 w-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" />
            </div>

            <!-- Global Translate Toggle -->
            <button 
              @click="emit('update:autoTranslate', !autoTranslate)"
              :class="cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all shadow-sm',
                autoTranslate 
                  ? 'bg-translate/15 border-translate/30 text-translate shadow-inner' 
                  : 'bg-bg-card/70 border-brand/20 text-text-muted'
              )"
              title="Auto-translate insights"
            >
              <Languages class="h-4 w-4" />
              <span class="text-[10px] font-black uppercase tracking-wider hidden lg:block">Translate</span>
            </button>

            <div class="hidden lg:block w-px h-6 bg-text-secondary/10 mx-1"></div>

            <!-- Insight Mode Toggle -->
            <button 
              @click="emit('update:globalInsightMode', !globalInsightMode)"
              :class="cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all shadow-sm',
                globalInsightMode 
                  ? 'bg-insight/15 border-insight/30 text-insight shadow-inner' 
                  : 'bg-bg-card/70 border-brand/20 text-text-muted'
              )"
              title="Toggle AI Insight Mode"
            >
              <Sparkles class="h-4 w-4" />
              <span class="text-[10px] font-black uppercase tracking-wider hidden lg:block">AI Insights</span>
            </button>

            <div class="hidden lg:block w-px h-6 bg-text-secondary/10 mx-1"></div>

            <!-- Summary Mode Toggle -->
            <button 
              @click="emit('update:globalSummaryMode', !globalSummaryMode)"
              :class="cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all shadow-sm',
                globalSummaryMode 
                  ? 'bg-summary/15 border-summary/30 text-summary shadow-inner' 
                  : 'bg-bg-card/70 border-brand/20 text-text-muted'
              )"
              title="Toggle Source Summary Mode"
            >
              <FileText class="h-4 w-4" />
              <span class="text-[10px] font-black uppercase tracking-wider hidden lg:block">Summary</span>
            </button>
          </div>

          <!-- Utility Control Group -->
          <div class="flex items-center p-1.5 bg-bg-card/50 backdrop-blur-md rounded-2xl border border-brand/20">
            <button 
              @click="emit('toggleTheme')"
              class="p-2 rounded-xl text-text-muted hover:bg-bg-card transition-all duration-300"
              title="Toggle theme"
            >
              <Sun v-if="isDark" class="h-4 w-4" />
              <Moon v-else class="h-4 w-4" />
            </button>

            <div class="w-px h-4 bg-text-secondary/20 mx-1"></div>
            
            <button 
              @click="emit('triggerProcess')" 
              :disabled="processing"
              class="p-2 rounded-xl text-text-muted hover:bg-bg-card transition-all duration-300 group"
              title="Refresh nexus"
            >
              <RefreshCw :class="cn('h-4 w-4 group-hover:rotate-180 transition-transform duration-700', processing && 'animate-spin')" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
