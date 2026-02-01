<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
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
  Plus
} from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const props = defineProps<{
  isOpen: boolean;
  isDark: boolean;
  globalInsightMode: boolean;
  globalSummaryMode: boolean;
  autoTranslate: boolean;
  preferredLanguage: string;
  viewMode: 'grid' | 'list' | 'compact';
  groupedSources: Record<string, string[]>;
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

onMounted(() => window.addEventListener('keydown', handleEsc));
onUnmounted(() => window.removeEventListener('keydown', handleEsc));
</script>

<template>
  <div 
    v-if="isOpen" 
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
  >
    <!-- Overlay -->
    <div 
      class="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500"
      @click="emit('close')"
    ></div>

    <!-- Modal Content -->
    <div 
      class="relative w-full max-w-4xl h-[80vh] bg-bg-card/90 border border-brand/20 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col sm:flex-row animate-in fade-in zoom-in duration-300"
    >
      <!-- Sidebar -->
      <div class="w-full sm:w-64 bg-brand/5 border-r border-brand/10 p-8 flex flex-col gap-8">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2.5 rounded-2xl bg-brand/20 border border-brand/30">
            <Rss class="h-6 w-6 text-brand" />
          </div>
          <h2 class="text-xl font-black tracking-tight text-text-primary italic">Paramètres</h2>
        </div>

        <nav class="flex flex-col gap-2">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="cn(
              'flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-left',
              activeTab === tab.id 
                ? 'bg-brand text-white shadow-lg icon-glow-brand' 
                : 'text-text-muted hover:bg-brand/10 hover:text-brand'
            )"
          >
            <component :is="tab.icon" class="h-4 w-4" />
            {{ tab.label }}
          </button>
        </nav>

        <div class="mt-auto pt-8 border-t border-brand/10 text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">
          Kognit Nexus v2.2
        </div>
      </div>

      <!-- Main Panel -->
      <div class="flex-1 flex flex-col min-h-0">
        <!-- Header -->
        <div class="p-8 pb-4 flex justify-between items-center bg-bg-card/50 backdrop-blur-xl sticky top-0 z-10">
          <h3 class="text-lg font-black uppercase tracking-widest text-text-primary">
            {{ tabs.find(t => t.id === activeTab)?.label }}
          </h3>
          <button 
            @click="emit('close')"
            class="p-2.5 rounded-2xl bg-text-secondary/5 hover:bg-text-secondary/10 transition-colors"
          >
            <X class="h-5 w-5 text-text-muted" />
          </button>
        </div>

        <!-- Content Area -->
        <div class="flex-1 overflow-y-auto p-8 pt-4 no-scrollbar">
          <!-- Hub: Feeds -->
          <div v-if="activeTab === 'feeds'" class="space-y-8">
            <p class="text-xs text-text-secondary">Gérez vos sources d'information connectées au Nexus.</p>
            
            <div v-for="(sources, category) in groupedSources" :key="category" class="space-y-3">
              <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2 border-b border-brand/10 pb-1">{{ category }}</h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div 
                  v-for="source in sources" 
                  :key="source"
                  class="flex items-center justify-between p-3.5 rounded-2xl bg-bg-card shadow-sm border border-brand/5 group hover:border-brand/20 transition-all"
                >
                  <div class="flex items-center gap-3">
                    <div class="h-2 w-2 rounded-full bg-success/40"></div>
                    <span class="text-[11px] font-bold text-text-primary uppercase tracking-wider">{{ source }}</span>
                  </div>
                  <button class="p-1.5 rounded-xl text-danger/30 hover:bg-danger/10 hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <button class="w-full flex items-center justify-center gap-2 p-5 rounded-3xl border-2 border-dashed border-brand/20 text-brand hover:bg-brand/5 hover:border-brand/40 transition-all text-xs font-black uppercase tracking-widest mt-4">
              <Plus class="h-4 w-4" />
              Ajouter une source personnalisée
            </button>
          </div>

          <!-- Hub: Intelligence -->
          <div v-if="activeTab === 'intelligence'" class="space-y-6">
            <div class="grid gap-4">
              <button 
                @click="emit('update:globalInsightMode', !globalInsightMode)"
                :class="cn(
                  'flex items-center justify-between p-6 rounded-3xl border transition-all text-left shadow-sm',
                  globalInsightMode ? 'bg-insight/10 border-insight/30' : 'bg-bg-card border-brand/10'
                )"
              >
                <div class="flex items-center gap-4">
                  <div :class="cn('p-3 rounded-2xl', globalInsightMode ? 'bg-insight/20 text-insight' : 'bg-text-secondary/5 text-text-muted')">
                    <Sparkles class="h-6 w-6" />
                  </div>
                  <div>
                    <h4 class="font-black text-xs uppercase tracking-widest text-text-primary mb-1">Mode Analyse IA</h4>
                    <p class="text-[10px] text-text-muted leading-relaxed max-w-[280px]">Génère automatiquement des résumés contextuels pour chaque article.</p>
                  </div>
                </div>
                <div :class="cn('h-2 w-2 rounded-full', globalInsightMode ? 'bg-insight animate-pulse' : 'bg-text-muted/30')"></div>
              </button>

              <button 
                @click="emit('update:globalSummaryMode', !globalSummaryMode)"
                :class="cn(
                  'flex items-center justify-between p-6 rounded-3xl border transition-all text-left shadow-sm',
                  globalSummaryMode ? 'bg-summary/10 border-summary/30' : 'bg-bg-card border-brand/10'
                )"
              >
                <div class="flex items-center gap-4">
                  <div :class="cn('p-3 rounded-2xl', globalSummaryMode ? 'bg-summary/20 text-summary' : 'bg-text-secondary/5 text-text-muted')">
                    <FileText class="h-6 w-6" />
                  </div>
                  <div>
                    <h4 class="font-black text-xs uppercase tracking-widest text-text-primary mb-1">Affichage des Résumés</h4>
                    <p class="text-[10px] text-text-muted leading-relaxed max-w-[280px]">Affiche l'aperçu original du flux RSS sous l'analyse IA.</p>
                  </div>
                </div>
                <div :class="cn('h-2 w-2 rounded-full', globalSummaryMode ? 'bg-summary' : 'bg-text-muted/30')"></div>
              </button>

              <button 
                @click="emit('update:autoTranslate', !autoTranslate)"
                :class="cn(
                  'flex items-center justify-between p-6 rounded-3xl border transition-all text-left shadow-sm',
                  autoTranslate ? 'bg-translate/10 border-translate/30' : 'bg-bg-card border-brand/10'
                )"
              >
                <div class="flex items-center gap-4">
                  <div :class="cn('p-3 rounded-2xl', autoTranslate ? 'bg-translate/20 text-translate' : 'bg-text-secondary/5 text-text-muted')">
                    <Languages class="h-6 w-6" />
                  </div>
                  <div>
                    <h4 class="font-black text-xs uppercase tracking-widest text-text-primary mb-1">Traduction Auto</h4>
                    <p class="text-[10px] text-text-muted leading-relaxed max-w-[280px]">Traduit instantanément les synthèses dans votre langue préférée ({{ preferredLanguage.toUpperCase() }}).</p>
                  </div>
                </div>
                <div :class="cn('h-2 w-2 rounded-full', autoTranslate ? 'bg-translate' : 'bg-text-muted/30')"></div>
              </button>
            </div>
          </div>

          <!-- Hub: Appearance -->
          <div v-if="activeTab === 'appearance'" class="space-y-8">
            <section>
              <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-4 border-b border-brand/10 pb-2">Thème Visuel</h4>
              <div class="flex gap-4">
                <button 
                  @click="emit('toggleTheme')"
                  :class="cn(
                    'flex-1 flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all',
                    isDark ? 'bg-bg-card border-brand/10 text-text-muted' : 'bg-brand/10 border-brand/30 text-brand shadow-lg scale-[1.02]'
                  )"
                >
                  <Sun class="h-8 w-8" />
                  <span class="text-[10px] font-black uppercase tracking-widest">Clair</span>
                </button>
                <button 
                  @click="emit('toggleTheme')"
                  :class="cn(
                    'flex-1 flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all',
                    isDark ? 'bg-brand/10 border-brand/30 text-brand shadow-lg scale-[1.02]' : 'bg-bg-card border-brand/10 text-text-muted'
                  )"
                >
                  <Moon class="h-8 w-8" />
                  <span class="text-[10px] font-black uppercase tracking-widest">Sombre</span>
                </button>
              </div>
            </section>

            <section>
              <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-4 border-b border-brand/10 pb-2">Densité de la Grille</h4>
              <div class="flex gap-3">
                <button 
                  v-for="mode in ['list', 'grid', 'compact']" 
                  :key="mode"
                  @click="emit('update:viewMode', mode as any)"
                  :class="cn(
                    'flex-1 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border',
                    viewMode === mode ? 'bg-brand/20 border-brand/40 text-brand' : 'bg-bg-card/50 border-brand/5 text-text-secondary hover:bg-bg-card'
                  )"
                >
                  {{ mode }}
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
  box-shadow: 0 0 20px -5px rgba(var(--brand-rgb, 99, 102, 241), 0.5);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-in {
  animation: in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
