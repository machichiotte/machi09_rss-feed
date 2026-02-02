<script setup lang="ts">
import { ref, computed, toRef } from 'vue';
import { useI18n } from '../../composables/useI18n';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import TagCloud from './TagCloud.vue';
import { Sun, Calendar, Database, Star, Sparkles, Languages, Hash, ChevronDown, Check } from 'lucide-vue-next';

const props = defineProps<{
  counts: {
    today: number;
    week: number;
    total: number;
    saved: number;
    enriched: number;
  };
  activeFilter: string;
  preferredLanguage: string;
  allLanguages: string[];
  selectedLanguages: string[];
  globalInsightMode: boolean;
  categories: string[];
  selectedCategory: string | null;
}>();

const emit = defineEmits<{
  (e: 'filter-change', filter: string): void;
  (e: 'toggle-language', lang: string): void;
  (e: 'select-tag', tag: string | null): void;
}>();

const isLangOpen = ref(false);

const { t } = useI18n(toRef(props, 'preferredLanguage'));

function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

const filters = computed(() => {
  const baseFilters = [
    { 
      id: '24h', 
      label: 'summary.today', 
      icon: Sun, 
      color: 'text-brand', 
      bg: 'bg-brand/10', 
      activeBg: 'bg-brand/25',
      lineBg: 'bg-brand',
      border: 'border-brand/20' 
    },
    { 
      id: '7d', 
      label: 'summary.this_week', 
      icon: Calendar, 
      color: 'text-insight', 
      bg: 'bg-insight/10', 
      activeBg: 'bg-insight/25',
      lineBg: 'bg-insight',
      border: 'border-insight/20' 
    },
    { 
      id: 'all', 
      label: 'summary.total', 
      icon: Database, 
      color: 'text-summary', 
      bg: 'bg-summary/10', 
      activeBg: 'bg-summary/25',
      lineBg: 'bg-summary',
      border: 'border-summary/20' 
    },
    { 
      id: 'saved', 
      label: 'summary.saved', 
      icon: Star, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10', 
      activeBg: 'bg-amber-500/25',
      lineBg: 'bg-amber-500',
      border: 'border-amber-500/20' 
    }
  ];

  if (props.globalInsightMode) {
    baseFilters.push({ 
      id: 'enriched', 
      label: 'summary.enriched', 
      icon: Sparkles, 
      color: 'text-brand', 
      bg: 'bg-brand/10', 
      activeBg: 'bg-brand/25',
      lineBg: 'bg-brand',
      border: 'border-brand/20' 
    });
  }

  return baseFilters;
});

const getCount = (id: string) => {
  if (id === '24h') return props.counts.today;
  if (id === '7d') return props.counts.week;
  if (id === 'all') return props.counts.total;
  if (id === 'saved') return props.counts.saved;
  if (id === 'enriched') return props.counts.enriched;
  return 0;
};

const getLangFlag = (lang: string) => {
  const flags: Record<string, string> = {
    fr: '🇫🇷',
    en: '🇺🇸',
    es: '🇪🇸',
    de: '🇩🇪',
    it: '🇮🇹',
    pt: '🇵🇹',
    ru: '🇷🇺',
    zh: '🇨🇳',
    ja: '🇯🇵',
    ar: '🇸🇦'
  };
  return flags[lang.toLowerCase()] || '🌐';
};
</script>

<template>
  <div class="space-y-4 mb-10">
    <div class="flex flex-col lg:flex-row gap-4 items-stretch">
      <!-- Main Filters Grid -->
      <div 
        :class="cn(
          'grid gap-3 flex-grow',
          props.globalInsightMode ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'
        )"
      >
        <button
          v-for="filter in filters"
          :key="filter.id"
          @click="emit('filter-change', filter.id)"
          :class="cn(
            'group relative overflow-hidden glass rounded-2xl px-4 py-3.5 transition-all duration-300 text-left border flex flex-col justify-between h-[90px]',
            props.activeFilter === filter.id 
              ? twMerge(filter.activeBg, filter.border, 'shadow-lg ring-2 ring-brand/50 scale-[1.02]') 
              : 'bg-bg-card/40 border-brand/5 hover:border-brand/20 hover:scale-[1.01]'
          )"
        >
          <div class="flex items-center justify-between relative z-10">
            <div class="flex items-center gap-3 min-w-0">
              <div
                :class="cn(
                  'p-2 rounded-xl shadow-sm shrink-0 transition-all',
                  props.activeFilter === filter.id 
                    ? twMerge(filter.bg.replace('/10', '/20'), 'border-2', filter.border.replace('/20', '/40'), filter.color)
                    : 'bg-white/5 border border-white/10', filter.color
                )"
              >
                <component :is="filter.icon" class="h-4 w-4" />
              </div>
              <p
                :class="cn(
                  'text-[9px] font-black uppercase tracking-[0.1em] transition-colors truncate',
                  props.activeFilter === filter.id ? filter.color : 'text-text-muted group-hover:text-text-primary'
                )"
              >
                {{ t(filter.label) }}
              </p>
            </div>
            <span :class="cn('text-2xl font-black tracking-tighter tabular-nums', props.activeFilter === filter.id ? filter.color : 'text-text-primary')">
              {{ getCount(filter.id) }}
            </span>
          </div>

          <div class="relative z-10">
            <div :class="cn('h-1 w-full rounded-full bg-text-secondary/5 overflow-hidden')">
              <div 
                :class="cn('h-full transition-all duration-1000', props.activeFilter === filter.id ? filter.lineBg : 'bg-brand/20')"
                :style="{ width: props.activeFilter === filter.id ? '100%' : '30%' }"
              ></div>
            </div>
          </div>
        </button>
      </div>

      <!-- Language Selector (Right of Filters) -->
      <div class="relative">
        <button
          @click="isLangOpen = !isLangOpen"
          :class="cn(
            'flex flex-col justify-between h-[90px] w-full lg:w-48 glass rounded-2xl border p-4 transition-all duration-300 text-left group',
            isLangOpen || selectedLanguages.length > 0
              ? 'border-brand/30 bg-brand/5 shadow-lg' 
              : 'border-brand/5 bg-bg-card/20 hover:border-brand/20'
          )"
        >
          <div class="flex items-center justify-between w-full">
            <div class="p-2 rounded-xl bg-white/5 border border-white/10 text-brand">
              <Languages class="h-4 w-4" />
            </div>
            <ChevronDown :class="cn('h-4 w-4 text-text-muted transition-transform duration-300', isLangOpen && 'rotate-180')" />
          </div>
          
          <div>
            <p class="text-[9px] font-black uppercase tracking-widest text-text-muted mb-0.5">Langues</p>
            <p class="text-[11px] font-bold text-text-primary truncate">
              {{ selectedLanguages.length === 0 ? t('sidebar.all_languages') : t('sidebar.selected_languages', { count: selectedLanguages.length }) }}
            </p>
          </div>
        </button>

        <!-- Dropdown Menu -->
        <div 
          v-if="isLangOpen" 
          class="absolute top-full right-0 mt-2 w-64 glass rounded-2xl border border-brand/20 shadow-2xl z-[100] p-2 animate-in fade-in zoom-in-95 duration-200"
        >
          <div class="max-h-64 overflow-y-auto no-scrollbar space-y-1">
            <button
              v-for="lang in allLanguages"
              :key="lang"
              @click="emit('toggle-language', lang)"
              :class="cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-bold border',
                selectedLanguages.includes(lang)
                  ? 'bg-brand/10 border-brand/20 text-brand'
                  : 'border-transparent text-text-muted hover:bg-white/5 hover:text-text-primary'
              )"
            >
              <div class="flex items-center gap-3">
                <span class="text-base">{{ getLangFlag(lang) }}</span>
                <span class="uppercase tracking-wider">{{ lang }}</span>
              </div>
              <Check v-if="selectedLanguages.includes(lang)" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tag Cloud (Relocated from Sidebar) -->
    <div v-if="categories && categories.length > 0" class="glass rounded-3xl p-6 border-brand/5 bg-bg-card/20">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-black text-text-muted text-[10px] uppercase tracking-[0.25em] flex items-center gap-2 px-1">
          <Hash class="h-3 w-3 text-brand" /> {{ t('sidebar.discovery') }}
        </h2>
        <div class="h-px flex-grow bg-brand/10 mx-4"></div>
      </div>
      
      <TagCloud 
        :tags="categories" 
        :selected-tag="selectedCategory"
        :placeholder="t('sidebar.search_tags')"
        @select-tag="emit('select-tag', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.glass {
  backdrop-filter: blur(20px);
}
</style>
