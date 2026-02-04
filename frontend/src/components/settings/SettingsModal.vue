<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { 
  X, 
  Rss, 
  Brain, 
  Palette, 
  Filter
} from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import SettingsSourcesTab from './tabs/SettingsSourcesTab.vue';
import SettingsFiltersTab from './tabs/SettingsFiltersTab.vue';
import SettingsIntelligenceTab from './tabs/SettingsIntelligenceTab.vue';
import SettingsAppearanceTab from './tabs/SettingsAppearanceTab.vue';

// Define SourceObj mostly for prop typing if needed, 
// though the child components handle the specifics now.
interface SourceObj {
  name: string;
  language: string;
  enabled: boolean;
  maxArticles?: number;
}

const props = defineProps<{
  isOpen: boolean;
  isDark: boolean;
  globalInsightMode: boolean;
  globalSummaryMode: boolean;
  autoTranslate: boolean;
  preferredLanguage: string;
  viewMode: 'grid' | 'list' | 'compact';
  groupedSources: Record<string, (string | SourceObj)[]>;
  languages: string[];
  selectedSentiment: string | null;
  customTags: string[];
  activeTab: string;
}>();

const emit = defineEmits<{
  'close': [],
  'update:globalInsightMode': [val: boolean],
  'update:globalSummaryMode': [val: boolean],
  'update:autoTranslate': [val: boolean],
  'update:viewMode': [val: 'grid' | 'list' | 'compact'],
  'toggleTheme': [],
  'toggleSource': [category: string, name: string, enabled: boolean],
  'deleteSource': [category: string, name: string],
  'update:preferredLanguage': [val: string],
  'toggleSentiment': [sentiment: string],
  'addCustomTag': [tag: string],
  'removeCustomTag': [tag: string],
  'update:activeTab': [val: string],
  'updateSourceLimit': [category: string, name: string, limit: number],
  'addSource': [data: { name: string, url: string, category: string, language: string }]
}>();

const tabs = [
  { id: 'feeds', label: 'Sources', icon: Rss },
  { id: 'filters', label: 'Filtres', icon: Filter },
  { id: 'intelligence', label: 'Intelligence', icon: Brain },
  { id: 'appearance', label: 'Apparence', icon: Palette },
];

function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

// Close on Escape
const handleEsc = (e: { key: string }) => {
  if (e.key === 'Escape' && props.isOpen) emit('close');
};

onMounted(() => {
  window.addEventListener('keydown', handleEsc);
});
onUnmounted(() => window.removeEventListener('keydown', handleEsc));
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
  >
    <!-- Overlay -->
    <div
      class="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-500"
      @click="emit('close')"
    ></div>

    <!-- Modal Content -->
    <div
      class="relative w-full max-w-5xl h-[85vh] bg-bg-card/95 border border-brand/20 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col sm:flex-row animate-in fade-in zoom-in duration-300"
    >
      <!-- Sidebar -->
      <div class="w-full sm:w-72 bg-brand/5 border-r border-brand/10 p-8 flex flex-col gap-10">
        <div class="flex items-center gap-4 mb-2">
          <div class="p-3 rounded-2xl bg-brand/20 border border-brand/30 shadow-inner">
            <Rss class="h-6 w-6 text-brand" />
          </div>
          <div class="flex flex-col">
            <h2 class="text-xl font-black tracking-tighter text-text-primary italic">Nexus</h2>
            <span class="text-[10px] uppercase tracking-widest text-brand font-bold">Control Panel</span>
          </div>
        </div>

        <nav class="flex flex-col gap-3">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="emit('update:activeTab', tab.id)"
            :class="cn(
              'flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-left group',
              activeTab === tab.id
                ? 'bg-brand text-white shadow-xl icon-glow-brand scale-[1.02]'
                : 'text-text-muted hover:bg-brand/10 hover:text-brand'
            )"
          >
            <component :is="tab.icon" :class="cn('h-5 w-5', activeTab === tab.id ? 'text-white' : 'text-text-muted group-hover:text-brand')" />
            {{ tab.label }}
          </button>
        </nav>

        <div class="mt-auto pt-8 border-t border-brand/10 flex flex-col gap-2">
          <div class="flex items-center gap-2 px-2">
            <div class="h-2 w-2 rounded-full bg-success animate-pulse"></div>
            <span class="text-[10px] font-bold text-text-muted uppercase tracking-widest">System Online</span>
          </div>
          <div class="text-[9px] font-bold text-text-muted/40 uppercase tracking-[0.2em] px-2">
            Kognit Premium v2.2.0
          </div>
        </div>
      </div>

      <!-- Main Panel -->
      <div class="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-transparent to-brand/5">
        <!-- Header -->
        <div class="p-8 pb-4 flex justify-between items-center bg-bg-card/50 backdrop-blur-2xl sticky top-0 z-10 border-b border-brand/5">
          <div class="flex flex-col gap-1">
            <h3 class="text-sm font-black uppercase tracking-[0.3em] text-text-primary">
              {{ tabs.find(t => t.id === activeTab)?.label }}
            </h3>
            <div class="h-1 w-12 bg-brand rounded-full"></div>
          </div>
          <button
            @click="emit('close')"
            class="p-3 rounded-2xl bg-text-secondary/5 hover:bg-danger/10 hover:text-danger group transition-all"
          >
            <X class="h-5 w-5 text-text-muted group-hover:text-danger" />
          </button>
        </div>

        <!-- Content Area -->
        <div class="flex-1 overflow-y-auto p-8 pt-6 no-scrollbar">
          <!-- Hub: Feeds -->
          <SettingsSourcesTab
            v-if="activeTab === 'feeds'"
            :grouped-sources="groupedSources"
            :preferred-language="preferredLanguage"
            @toggle-source="(c, n, e) => emit('toggleSource', c, n, e)"
            @delete-source="(c, n) => emit('deleteSource', c, n)"
            @update-source-limit="(c, n, l) => emit('updateSourceLimit', c, n, l)"
            @add-source="(d) => emit('addSource', d)"
          />

          <!-- Hub: Filters -->
          <SettingsFiltersTab
            v-if="activeTab === 'filters'"
            :custom-tags="customTags"
            :selected-sentiment="selectedSentiment"
            @add-custom-tag="(t) => emit('addCustomTag', t)"
            @remove-custom-tag="(t) => emit('removeCustomTag', t)"
            @toggle-sentiment="(s) => emit('toggleSentiment', s)"
          />

          <!-- Hub: Intelligence -->
          <SettingsIntelligenceTab
            v-if="activeTab === 'intelligence'"
            :global-insight-mode="globalInsightMode"
            :global-summary-mode="globalSummaryMode"
            :auto-translate="autoTranslate"
            :preferred-language="preferredLanguage"
            @update:global-insight-mode="(v) => emit('update:globalInsightMode', v)"
            @update:global-summary-mode="(v) => emit('update:globalSummaryMode', v)"
            @update:auto-translate="(v) => emit('update:autoTranslate', v)"
          />

          <!-- Hub: Appearance -->
          <SettingsAppearanceTab
            v-if="activeTab === 'appearance'"
            :is-dark="isDark"
            :preferred-language="preferredLanguage"
            :view-mode="viewMode"
            :languages="languages"
            @toggle-theme="emit('toggleTheme')"
            @update:preferred-language="(v) => emit('update:preferredLanguage', v)"
            @update:view-mode="(v) => emit('update:viewMode', v)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-glow-brand {
  box-shadow: 0 10px 30px -10px rgba(var(--brand-rgb, 99, 102, 241), 0.5);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes in {
  from { opacity: 0; transform: scale(0.98) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.animate-in {
  animation: in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Custom scrollbar for content if needed (optional) */
.flex-1::-webkit-scrollbar {
  width: 4px;
}
.flex-1::-webkit-scrollbar-track {
  background: transparent;
}
.flex-1::-webkit-scrollbar-thumb {
  background: rgba(var(--brand-rgb, 99, 102, 241), 0.1);
  border-radius: 10px;
}
</style>
