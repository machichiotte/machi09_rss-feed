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
  (e: 'close'): void;
  (e: 'update:isDark', val: boolean): void;
  (e: 'update:globalInsightMode', val: boolean): void;
  (e: 'update:globalSummaryMode', val: boolean): void;
  (e: 'update:autoTranslate', val: boolean): void;
  (e: 'update:viewMode', val: 'grid' | 'list' | 'compact'): void;
  (e: 'toggleTheme'): void;
}>();

const activeTab = ref('feeds');
const expandedCategories = ref<Record<string, boolean>>({});

const toggleCategory = (cat: string) => {
  expandedCategories.value[cat] = !expandedCategories.value[cat];
};

const getSourceName = (s: string | SourceObj) => {
  if (!s) return 'Unknown';
  return typeof s === 'string' ? s : s.name;
};

const getSourceLang = (s: string | SourceObj) => {
  if (!s) return 'en';
  if (typeof s === 'string') return 'en';
  return (s.language || 'en').toLowerCase();
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

const tabs = [
  { id: 'feeds', label: 'Sources', icon: Rss },
  { id: 'intelligence', label: 'Intelligence', icon: Brain },
  { id: 'appearance', label: 'Apparence', icon: Palette },
];

function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

const sortedGroupedSources = computed(() => {
  const sorted: Record<string, (string | SourceObj)[]> = {};
  for (const [category, sources] of Object.entries(props.groupedSources)) {
    sorted[category] = [...sources].sort((a, b) => {
      const nameA = getSourceName(a);
      const nameB = getSourceName(b);
      return nameA.localeCompare(nameB);
    });
  }
  return sorted;
});

// Close on Escape
const handleEsc = (e: { key: string }) => {
  if (e.key === 'Escape' && props.isOpen) emit('close');
};

onMounted(() => {
  console.log('Grouped Sources:', props.groupedSources);
  window.addEventListener('keydown', handleEsc);
  // Expand first category by default if needed
  setTimeout(() => {
    const keys = Object.keys(props.groupedSources);
    if (keys.length > 0 && Object.keys(expandedCategories.value).length === 0) {
      expandedCategories.value[keys[0]] = true;
    }
  }, 200);
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
            <h2 class="text-xl font-black tracking-tighter text-text-primary italic uppercase">Nexus</h2>
            <span class="text-[9px] uppercase tracking-widest text-brand font-black">Control Station</span>
          </div>
        </div>

        <nav class="flex flex-col gap-3">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="cn(
              'flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-left group',
              activeTab === tab.id 
                ? 'bg-brand text-white shadow-xl icon-glow-brand scale-[1.02]' 
                : 'text-text-muted hover:bg-brand/10 hover:text-brand'
            )"
          >
            <component :is="tab.icon" :class="cn('h-5 w-5', activeTab === tab.id ? 'text-white' : 'text-text-muted group-hover:text-brand')" />
            {{ tab.label }}
          </button>
        </nav>

        <div class="mt-auto pt-8 border-t border-brand/10 flex flex-col gap-3">
          <div class="flex items-center gap-2 px-2">
            <div class="h-2 w-2 rounded-full bg-success animate-pulse"></div>
            <span class="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Core Sync Online</span>
          </div>
          <div class="text-[9px] font-black text-text-muted/30 uppercase tracking-[0.2em] px-2 leading-tight">
            Kognit Nexus Premium<br />Modular v2.2.0
          </div>
        </div>
      </div>

      <!-- Main Panel -->
      <div class="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-transparent via-transparent to-brand/5">
        <!-- Header -->
        <div class="p-8 pb-4 flex justify-between items-center bg-bg-card/40 backdrop-blur-2xl sticky top-0 z-20 border-b border-brand/5">
          <div class="flex flex-col gap-1.5">
            <h3 class="text-xs font-black uppercase tracking-[0.4em] text-text-primary">
              {{ tabs.find(t => t.id === activeTab)?.label }}
            </h3>
            <div class="h-1.5 w-16 bg-brand rounded-full shadow-sm shadow-brand/20"></div>
          </div>
          <button 
            @click="emit('close')"
            class="p-3.5 rounded-2xl bg-text-secondary/5 hover:bg-danger/10 hover:text-danger group transition-all"
          >
            <X class="h-5 w-5 text-text-muted group-hover:text-danger" />
          </button>
        </div>

        <!-- Content Area -->
        <div class="flex-1 overflow-y-auto p-8 pt-8 no-scrollbar">
          <!-- Hub: Feeds -->
          <div v-if="activeTab === 'feeds'" class="space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 group bg-brand/5 p-6 rounded-[2.5rem] border border-brand/10">
              <div class="flex items-center gap-5">
                <div class="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
                  <Rss class="h-6 w-6 text-brand" />
                </div>
                <div class="flex flex-col">
                  <p class="text-sm text-text-primary font-black uppercase tracking-wider">Gestion des Flux</p>
                  <p class="text-[11px] text-text-muted font-medium italic">Personnalisez vos sources d'intelligence</p>
                </div>
              </div>
              <div class="px-6 py-3 rounded-2xl bg-brand/20 border-2 border-brand/30 text-brand text-[10px] font-black uppercase tracking-widest shadow-lg">
                {{ Object.values(groupedSources).flat().length }} Sources Connectées
              </div>
            </div>
            
            <div v-for="(sources, category) in sortedGroupedSources" :key="category" class="space-y-3">
              <button 
                @click="toggleCategory(category)"
                class="w-full flex items-center justify-between p-6 rounded-[2.5rem] bg-bg-card border-2 border-brand/5 hover:border-brand/40 hover:bg-brand/5 transition-all group shadow-sm active:scale-[0.995]"
              >
                <div class="flex items-center gap-5">
                  <div class="p-2.5 rounded-2xl bg-brand/10 text-brand shadow-inner group-hover:rotate-12 transition-transform">
                    <Globe class="h-5 w-5" />
                  </div>
                  <div class="flex flex-col items-start gap-1">
                    <h4 class="text-[13px] font-black uppercase tracking-[0.2em] text-text-primary group-hover:text-brand transition-colors">{{ category }}</h4>
                    <span class="text-[10px] font-bold text-text-muted/60 uppercase tracking-widest">{{ sources.length }} Flux disponibles</span>
                  </div>
                </div>
                <div class="flex items-center gap-5">
                  <div class="h-8 w-8 rounded-full bg-brand/5 flex items-center justify-center group-hover:bg-brand/20 transition-colors">
                    <ChevronDown 
                      :class="cn('h-5 w-5 text-text-muted transition-all duration-500', expandedCategories[category] && 'rotate-180 text-brand')"
                    />
                  </div>
                </div>
              </button>
              
              <div 
                v-show="expandedCategories[category]"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-3 animate-in slide-in-from-top-6 duration-500"
              >
                <div 
                  v-for="source in sources" 
                  :key="getSourceName(source)"
                  class="flex items-center justify-between p-5 rounded-[2rem] bg-bg-card/40 backdrop-blur-md shadow-sm border border-brand/10 group hover:border-brand/40 hover:bg-bg-card hover:shadow-xl transition-all relative overflow-hidden active:scale-95"
                >
                  <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-brand/10 group-hover:bg-brand transition-colors"></div>
                  
                  <div class="flex items-center gap-4 flex-1 min-w-0">
                    <div class="flex flex-col items-center justify-center gap-1 min-w-[38px] h-[48px] bg-brand/5 border border-brand/10 rounded-xl shrink-0 shadow-inner">
                      <span class="text-xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">{{ getLangFlag(getSourceLang(source)) }}</span>
                      <span class="text-[8px] font-black text-brand/60 uppercase tracking-tighter">{{ getSourceLang(source) }}</span>
                    </div>
                    <div class="block text-[10px] font-black text-text-primary uppercase tracking-tight group-hover:translate-x-1 transition-transform line-clamp-2 leading-[1.1] flex-1">
                      {{ getSourceName(source) }}
                    </div>
                  </div>
                  
                  <button class="p-3 rounded-2xl text-danger/20 hover:bg-danger/10 hover:text-danger opacity-0 group-hover:opacity-100 transition-all transform hover:rotate-12 shrink-0">
                    <Trash2 class="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>

            <button class="w-full flex items-center justify-center gap-4 p-8 rounded-[3rem] border-2 border-dashed border-brand/20 text-brand bg-brand/5 hover:bg-brand/10 hover:border-brand/40 transition-all text-sm font-black uppercase tracking-[0.3em] mt-12 shadow-sm active:scale-[0.98] group">
              <Plus class="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
              Ajouter une source
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
                  'flex items-center justify-between p-8 rounded-[3rem] border-2 transition-all text-left shadow-md group active:scale-[0.98]',
                  setting.state ? `bg-${setting.color}/10 border-${setting.color}/40` : 'bg-bg-card border-brand/10 hover:border-brand/30'
                )"
              >
                <div class="flex items-center gap-8">
                  <div :class="cn('p-5 rounded-[2rem] transition-all group-hover:scale-110 group-hover:rotate-6 shadow-inner', setting.state ? `bg-${setting.color}/20 text-${setting.color}` : 'bg-text-secondary/5 text-text-muted')">
                    <component :is="setting.icon" class="h-8 w-8" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <h4 class="font-black text-[13px] uppercase tracking-widest text-text-primary italic">{{ setting.label }}</h4>
                    <p class="text-[12px] text-text-muted leading-relaxed max-w-[340px] font-medium">{{ setting.desc }}</p>
                  </div>
                </div>
                <div class="relative flex items-center justify-center min-w-[60px]">
                  <div :class="cn('h-5 w-5 rounded-full transition-all duration-500 shadow-lg', setting.state ? `bg-${setting.color} shadow-${setting.color}/50 scale-125` : 'bg-text-muted/20 scale-100')"></div>
                  <div v-if="setting.state && setting.id === 'globalInsightMode'" class="absolute h-10 w-10 rounded-full border border-insight/40 animate-ping"></div>
                </div>
              </button>
            </div>
          </div>

          <!-- Hub: Appearance -->
          <div v-if="activeTab === 'appearance'" class="space-y-10">
            <section class="p-10 rounded-[3rem] bg-bg-card border border-brand/10 shadow-lg">
              <h4 class="text-[11px] font-black uppercase tracking-[0.4em] text-brand mb-10 border-b border-brand/10 pb-5">Environnement Visuel</h4>
              <div class="flex gap-8">
                <button 
                  v-for="theme in [{ id: 'light', icon: Sun, label: 'Crystal Clear' }, { id: 'dark', icon: Moon, label: 'Deep Space' }]"
                  :key="theme.id"
                  @click="(theme.id === 'dark' && !isDark) || (theme.id === 'light' && isDark) ? emit('toggleTheme') : null"
                  :class="cn(
                    'flex-1 flex flex-col items-center gap-6 p-12 rounded-[2.5rem] border-2 transition-all group relative overflow-hidden active:scale-95',
                    (theme.id === 'dark' && isDark) || (theme.id === 'light' && !isDark)
                      ? 'bg-brand/10 border-brand/50 text-brand shadow-2xl' 
                      : 'bg-bg-card/50 border-brand/10 text-text-muted hover:bg-brand/5 hover:border-brand/30'
                  )"
                >
                  <component :is="theme.icon" :class="cn('h-12 w-12 transition-all duration-700', ((theme.id === 'dark' && isDark) || (theme.id === 'light' && !isDark)) && 'scale-125 rotate-12 text-brand drop-shadow-glow')" />
                  <span class="text-[12px] font-black uppercase tracking-[0.3em] italic">{{ theme.label }}</span>
                  <div v-if="(theme.id === 'dark' && isDark) || (theme.id === 'light' && !isDark)" class="absolute bottom-0 left-0 right-0 h-2 bg-brand shadow-[0_-5px_20px_rgba(var(--brand-rgb),0.5)]"></div>
                </button>
              </div>
            </section>

            <section class="p-10 rounded-[3rem] bg-bg-card border border-brand/10 shadow-lg">
              <h4 class="text-[11px] font-black uppercase tracking-[0.4em] text-brand mb-10 border-b border-brand/10 pb-5">Configuration de Grille</h4>
              <div class="flex gap-6">
                <button 
                  v-for="mode in ['list', 'grid', 'compact']" 
                  :key="mode"
                  @click="emit('update:viewMode', mode as any)"
                  :class="cn(
                    'flex-1 px-8 py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] transition-all border-2 relative overflow-hidden shadow-sm active:scale-95',
                    viewMode === mode 
                      ? 'bg-brand/20 border-brand/60 text-brand shadow-xl' 
                      : 'bg-bg-card/50 border-brand/10 text-text-secondary hover:bg-bg-card hover:border-brand/30'
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
  box-shadow: 0 15px 40px -12px rgba(99, 102, 241, 0.5);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes in {
  from { opacity: 0; transform: scale(0.97) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.animate-in {
  animation: in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.drop-shadow-glow {
  filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.8));
}
</style>
