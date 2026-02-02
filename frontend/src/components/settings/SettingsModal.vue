<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { 
  X, 
  Rss, 
  Brain, 
  Palette, 
  Moon, 
  Sun, 
  Languages, 
  Sparkles, 
  FileText,
  Trash2,
  Plus,
  ChevronDown,
  Globe
} from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SourceObj {
  name: string;
  language: string;
  enabled: boolean;
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
}>();

const emit = defineEmits<{
  'close': [],
  'update:globalInsightMode': [val: boolean],
  'update:globalSummaryMode': [val: boolean],
  'update:autoTranslate': [val: boolean],
  'update:viewMode': [val: 'grid' | 'list' | 'compact'],
  'toggleTheme': [],
  'toggleSource': [category: string, name: string, enabled: boolean],
  'deleteSource': [category: string, name: string]
}>();

const activeTab = ref('feeds');
const expandedCategories = ref<Record<string, boolean>>({});

const toggleCategory = (cat: string) => {
  expandedCategories.value[cat] = !expandedCategories.value[cat];
};

const sortedGroupedSources = computed(() => {
  const sorted: Record<string, (string | SourceObj)[]> = {};
  for (const [category, sources] of Object.entries(props.groupedSources)) {
    sorted[category] = [...sources].sort((a, b) => {
      const nameA = typeof a === 'string' ? a : a.name;
      const nameB = typeof b === 'string' ? b : b.name;
      return nameA.localeCompare(nameB);
    });
  }
  return sorted;
});

const toggleSource = (category: string, source: string | SourceObj) => {
  if (typeof source === 'object') {
    source.enabled = !source.enabled;
    emit('toggleSource', category, source.name, source.enabled);
  }
};

const getSourceName = (s: string | SourceObj) => typeof s === 'string' ? s : s.name;
const getSourceLang = (s: string | SourceObj) => typeof s === 'string' ? 'en' : s.language;
const isSourceEnabled = (s: string | SourceObj) => typeof s === 'string' ? true : s.enabled !== false;

const getLangFlag = (lang?: string) => {
  if (!lang) return '🌍';
  const map: Record<string, string> = {
    'fr': '🇫🇷', 'en': '🇺🇸', 'es': '🇪🇸', 'de': '🇩🇪',
    'it': '🇮🇹', 'pt': '🇵🇹', 'nl': '🇳🇱', 'ru': '🇷🇺',
    'zh': '🇨🇳', 'ja': '🇯🇵', 'ar': '🇸🇦', 'cn': '🇨🇳'
  };
  return map[lang.toLowerCase()] || '🌍';
};

const tabs = [
  { id: 'feeds', label: 'Sources', icon: Rss },
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
  // Expand first category by default
  setTimeout(() => {
    const keys = Object.keys(props.groupedSources);
    const firstKey = keys[0];
    if (firstKey && Object.keys(expandedCategories.value).length === 0) {
      expandedCategories.value[firstKey] = true;
    }
  }, 100);
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
            @click="activeTab = tab.id"
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
          <div v-if="activeTab === 'feeds'" class="space-y-6">
            <div class="flex items-center justify-between mb-8 group">
              <div class="flex items-center gap-4">
                <div class="h-12 w-1.5 bg-brand rounded-full group-hover:h-8 transition-all duration-500"></div>
                <p class="text-sm text-text-secondary font-medium italic">Optimisez votre flux d'information global.</p>
              </div>
              <div class="px-4 py-2 rounded-xl bg-brand/10 border border-brand/20 text-brand text-[10px] font-black uppercase tracking-widest">
                {{ Object.values(groupedSources).flat().length }} Sources actives
              </div>
            </div>

            <div v-for="(sources, category) in sortedGroupedSources" :key="category" class="space-y-3">
              <button
                @click="toggleCategory(category as string)"
                class="w-full flex items-center justify-between p-5 rounded-3xl bg-bg-card border border-brand/10 hover:border-brand/40 hover:bg-brand/5 transition-all group shadow-sm"
              >
                <div class="flex items-center gap-4">
                  <div class="p-2 rounded-xl bg-brand/10 text-brand shadow-inner group-hover:scale-110 transition-transform">
                    <Globe class="h-4 w-4" />
                  </div>
                  <div class="flex flex-col items-start gap-0.5">
                    <h4 class="text-xs font-black uppercase tracking-[0.15em] text-text-primary group-hover:text-brand transition-colors">{{ category }}</h4>
                    <span class="text-[10px] font-bold text-text-muted/60">{{ sources.length }} flux configurés</span>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <ChevronDown
                    :class="cn('h-5 w-5 text-text-muted transition-all duration-500', expandedCategories[category as string] && 'rotate-180 text-brand')"
                  />
                </div>
              </button>

              <div
                v-show="expandedCategories[category as string]"
                class="grid grid-cols-1 lg:grid-cols-2 gap-4 p-2 animate-in slide-in-from-top-4 duration-500"
              >
                <div
                  v-for="source in (sources as SourceObj[])"
                  :key="getSourceName(source)"
                  @click="toggleSource(category as string, source)"
                  :class="cn(
                    'flex items-center justify-between p-4 rounded-3xl bg-bg-card/50 backdrop-blur-sm shadow-sm border group hover:border-brand/30 hover:bg-bg-card hover:shadow-md transition-all relative overflow-hidden cursor-pointer',
                    isSourceEnabled(source) ? 'border-brand/20' : 'border-text-muted/10 opacity-70'
                  )"
                >
                  <div :class="cn('absolute left-0 top-0 bottom-0 w-1 transition-colors', isSourceEnabled(source) ? 'bg-brand/20 group-hover:bg-brand' : 'bg-text-muted/10')"></div>

                  <div class="flex items-center gap-4">
                    <div class="flex flex-col items-center gap-1 min-w-[32px]">
                      <span class="text-lg drop-shadow-sm group-hover:scale-125 transition-transform duration-300">{{ getLangFlag(getSourceLang(source)) }}</span>
                      <span class="text-[8px] font-black text-brand/50 uppercase tracking-tighter">{{ getSourceLang(source) }}</span>
                    </div>
                    <span class="text-[13px] font-black text-text-primary uppercase tracking-tight group-hover:translate-x-1 transition-transform truncate max-w-[120px]">
                      {{ getSourceName(source) }}
                    </span>
                  </div>
                  
                  <button class="p-2.5 rounded-2xl text-danger/20 hover:bg-danger/10 hover:text-danger opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-105 active:scale-95">
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <button class="w-full flex items-center justify-center gap-3 p-6 rounded-[2rem] border-2 border-dashed border-brand/20 text-brand bg-brand/5 hover:bg-brand/10 hover:border-brand/40 transition-all text-xs font-black uppercase tracking-widest mt-10 shadow-sm active:scale-[0.98]">
              <Plus class="h-5 w-5" />
              Ajouter une source personnalisée
            </button>
          </div>

          <!-- Hub: Intelligence -->
          <div v-if="activeTab === 'intelligence'" class="space-y-6">
            <div class="grid gap-6">
              <button 
                v-for="setting in [
                  { id: 'globalInsightMode', icon: Sparkles, label: 'Mode Analyse IA', desc: 'Génère automatiquement des résumés contextuels pour chaque article.', color: 'insight', state: globalInsightMode },
                  { id: 'globalSummaryMode', icon: FileText, label: 'Affichage des Résumés', desc: 'Affiche l\'aperçu original du flux RSS sous l\'analyse IA.', color: 'summary', state: globalSummaryMode },
                  { id: 'autoTranslate', icon: Languages, label: 'Traduction Auto', desc: `Traduit instantanément les synthèses dans votre langue préférée (${preferredLanguage.toUpperCase()}).`, color: 'translate', state: autoTranslate }
                ]"
                :key="setting.id"
                @click="emit(`update:${setting.id}` as any, !setting.state)"
                :class="cn(
                  'flex items-center justify-between p-8 rounded-[2.5rem] border transition-all text-left shadow-md group active:scale-[0.98]',
                  setting.state ? `bg-${setting.color}/10 border-${setting.color}/30` : 'bg-bg-card border-brand/10 hover:border-brand/30'
                )"
              >
                <div class="flex items-center gap-6">
                  <div :class="cn('p-4 rounded-3xl transition-transform group-hover:scale-110 shadow-inner', setting.state ? `bg-${setting.color}/20 text-${setting.color}` : 'bg-text-secondary/5 text-text-muted')">
                    <component :is="setting.icon" class="h-7 w-7" />
                  </div>
                  <div>
                    <h4 class="font-black text-xs uppercase tracking-widest text-text-primary mb-2 italic">{{ setting.label }}</h4>
                    <p class="text-xs text-text-muted leading-relaxed max-w-[320px] font-medium">{{ setting.desc }}</p>
                  </div>
                </div>
                <div class="relative flex items-center justify-center">
                  <div :class="cn('h-4 w-4 rounded-full transition-all duration-500 shadow-lg', setting.state ? `bg-${setting.color} shadow-${setting.color}/50 scale-125` : 'bg-text-muted/20 scale-100')"></div>
                  <div v-if="setting.state && setting.id === 'globalInsightMode'" class="absolute h-8 w-8 rounded-full border border-insight/50 animate-ping"></div>
                </div>
              </button>
            </div>
          </div>

          <!-- Hub: Appearance -->
          <div v-if="activeTab === 'appearance'" class="space-y-10">
            <section class="p-8 rounded-[2.5rem] bg-bg-card border border-brand/10 shadow-md">
              <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-8 border-b border-brand/10 pb-4">Thème Visuel</h4>
              <div class="flex gap-6">
                <button 
                  v-for="theme in [{ id: 'light', icon: Sun, label: 'Clair' }, { id: 'dark', icon: Moon, label: 'Sombre' }]"
                  :key="theme.id"
                  @click="(theme.id === 'dark' && !isDark) || (theme.id === 'light' && isDark) ? emit('toggleTheme') : null"
                  :class="cn(
                    'flex-1 flex flex-col items-center gap-4 p-10 rounded-[2rem] border transition-all group relative overflow-hidden',
                    (theme.id === 'dark' && isDark) || (theme.id === 'light' && !isDark)
                      ? 'bg-brand/10 border-brand/40 text-brand shadow-xl' 
                      : 'bg-bg-card/50 border-brand/10 text-text-muted hover:bg-brand/5 hover:border-brand/20'
                  )"
                >
                  <component :is="theme.icon" :class="cn('h-10 w-10 transition-transform duration-500', ((theme.id === 'dark' && isDark) || (theme.id === 'light' && !isDark)) && 'scale-125 rotate-12')" />
                  <span class="text-[11px] font-black uppercase tracking-[0.2em]">{{ theme.label }}</span>
                  <div v-if="(theme.id === 'dark' && isDark) || (theme.id === 'light' && !isDark)" class="absolute bottom-0 left-0 right-0 h-1.5 bg-brand"></div>
                </button>
              </div>
            </section>

            <section class="p-8 rounded-[2.5rem] bg-bg-card border border-brand/10 shadow-md">
              <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-8 border-b border-brand/10 pb-4">Densité de la Grille</h4>
              <div class="flex gap-4">
                <button 
                  v-for="mode in ['list', 'grid', 'compact']" 
                  :key="mode"
                  @click="emit('update:viewMode', mode as any)"
                  :class="cn(
                    'flex-1 px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border relative overflow-hidden shadow-sm',
                    viewMode === mode 
                      ? 'bg-brand/20 border-brand/50 text-brand shadow-lg' 
                      : 'bg-bg-card/50 border-brand/10 text-text-secondary hover:bg-bg-card'
                  )"
                >
                  {{ mode }}
                  <div v-if="viewMode === mode" class="absolute inset-0 bg-brand/5 animate-pulse"></div>
                </button>
              </div>
            </section>
          </div>
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
