<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Globe, 
  ChevronDown, 
  Trash2, 
  Plus 
} from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SourceObj {
  name: string;
  language: string;
  enabled: boolean;
  maxArticles?: number;
}

const props = defineProps<{
  groupedSources: Record<string, (string | SourceObj)[]>;
  preferredLanguage: string;
}>();

const emit = defineEmits<{
  'toggleSource': [category: string, name: string, enabled: boolean],
  'deleteSource': [category: string, name: string],
  'updateSourceLimit': [category: string, name: string, limit: number],
  'addSource': [data: { name: string, url: string, category: string, language: string }]
}>();

const expandedCategories = ref<Record<string, boolean>>({});
const selectedCategoryLangs = ref<Record<string, string>>({});

// --- Helpers ---
function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

const getSourceName = (s: string | SourceObj) => typeof s === 'string' ? s : s.name;
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

// --- Logic ---

const toggleCategory = (cat: string) => {
  expandedCategories.value[cat] = !expandedCategories.value[cat];
};

const getActiveCategoryLang = (category: string, groups: { lang: string }[]) => {
  const selected = selectedCategoryLangs.value[category];
  if (selected && groups.some(g => g.lang === selected)) return selected;
  
  // Default to preferred language if available in groups
  if (groups.some(g => g.lang === props.preferredLanguage)) return props.preferredLanguage;
  
  // Fallback to first available
  return groups[0]?.lang || 'en';
};

const setActiveCategoryLang = (category: string, lang: string) => {
  selectedCategoryLangs.value[category] = lang;
};

const promptAddSource = (defaultCategory?: string) => {
  const name = window.prompt("Nom de la source (ex: TechCrunch) :");
  if (!name) return;
  const url = window.prompt("URL du flux RSS :");
  if (!url) return;
  const category = defaultCategory || window.prompt("Catégorie (ex: TECH, CRYPTO) :", "GÉNÉRAL") || "GÉNÉRAL";
  const language = window.prompt("Langue (fr, en, es...) :", "fr") || "fr";

  emit('addSource', { name, url, category, language });
};

const organizedSources = computed(() => {
  const result: Record<string, { lang: string; sources: SourceObj[] }[]> = {};

  for (const [category, sources] of Object.entries(props.groupedSources)) {
    // 1. Group by Lang
    const byLang: Record<string, SourceObj[]> = {};
    
    sources.forEach(s => {
       // Normalize string sources to objects
       const sourceObj = typeof s === 'string' 
        ? { name: s, language: 'en', enabled: true } 
        : s;

       const lang = sourceObj.language || 'en';
       if (!byLang[lang]) byLang[lang] = [];
       byLang[lang].push(sourceObj);
    });

    // 2. Sort Languages
    const sortedLangs = Object.keys(byLang).sort((a, b) => {
        // Priority 1: Preferred Language
        if (a === props.preferredLanguage) return -1;
        if (b === props.preferredLanguage) return 1;

        // Priority 2: English (if not preferred)
        if (a === 'en') return -1;
        if (b === 'en') return 1;

        // Priority 3: Spanish (if not preferred)
        if (a === 'es') return -1;
        if (b === 'es') return 1;

        // Default: Alphabetical
        return a.localeCompare(b);
    });

    // 3. Create sorted array of groups
    result[category] = sortedLangs.map(lang => ({
        lang,
        sources: (byLang[lang] || []).sort((a: SourceObj, b: SourceObj) => a.name.localeCompare(b.name))
    }));
  }
  return result;
});

const toggleSource = (category: string, source: string | SourceObj, forceState?: boolean) => {
  if (typeof source === 'object') {
    const newState = forceState !== undefined ? forceState : !source.enabled;
    if (source.enabled !== newState) {
        source.enabled = newState; // optimistic update local object ref if possible, but mainly emit
        emit('toggleSource', category, source.name, newState);
    }
  }
};

const toggleLanguageGroup = (category: string, sources: SourceObj[]) => {
    const allEnabled = sources.every(s => s.enabled);
    const targetState = !allEnabled;
    sources.forEach(s => toggleSource(category, s, targetState));
};

// Expand first category by default on mount logic can be optional here or handled by parent. 
// Let's keep it simple: initial state is closed, user opens.
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-8 group">
      <div class="flex items-center gap-4">
        <div class="h-12 w-1.5 bg-brand rounded-full group-hover:h-8 transition-all duration-500"></div>
        <p class="text-sm text-text-secondary font-medium italic">Optimisez votre flux d'information global.</p>
      </div>
      <div class="px-4 py-2 rounded-xl bg-brand/10 border border-brand/20 text-brand text-[10px] font-black uppercase tracking-widest">
        {{ Object.values(groupedSources).flat().length }} Sources actives
      </div>
    </div>

    <div v-for="(langGroups, category) in organizedSources" :key="category" class="space-y-3">
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
            <span class="text-[10px] font-bold text-text-muted/60">{{ langGroups.reduce((acc, g) => acc + g.sources.length, 0) }} flux</span>
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
        class="mt-4 space-y-6"
      >
        <!-- Language Tabs -->
        <div class="flex flex-wrap items-center gap-2 pb-2" v-if="langGroups.length > 1">
          <button
            v-for="group in langGroups"
            :key="group.lang"
            @click="setActiveCategoryLang(category as string, group.lang)"
            :class="cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap',
              getActiveCategoryLang(category as string, langGroups) === group.lang
                ? 'bg-brand/10 border-brand/40 text-brand shadow-sm'
                : 'bg-bg-card border-brand/5 text-text-muted hover:bg-brand/5 hover:text-text-secondary'
            )"
          >
            <span>{{ getLangFlag(group.lang) }}</span>
            <span>{{ group.lang }}</span>
            <span class="ml-1 opacity-50 text-[9px]">({{ group.sources.length }})</span>
          </button>
        </div>

        <div v-for="group in langGroups" :key="group.lang" v-show="getActiveCategoryLang(category as string, langGroups) === group.lang" class="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <!-- Language Header Actions -->
          <div class="flex justify-end px-2">
            <button 
              @click.stop="toggleLanguageGroup(category as string, group.sources)"
              class="text-[9px] font-bold text-text-muted hover:text-brand uppercase tracking-wider transition-colors"
            >
              {{ group.sources.every(s => s.enabled) ? 'Tout désélectionner' : 'Tout sélectionner' }}
            </button>
          </div>

          <!-- Grid of Sources -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="source in group.sources"
              :key="getSourceName(source)"
              @click="toggleSource(category as string, source)"
              :class="cn(
                'flex items-center justify-between px-4 py-2.5 rounded-2xl backdrop-blur-sm shadow-sm border transition-all duration-300 relative overflow-hidden cursor-pointer group',
                isSourceEnabled(source) 
                  ? 'bg-brand/10 border-brand shadow-brand/10 opacity-100 z-10 scale-[1.01]' 
                  : 'bg-bg-card/20 border-transparent opacity-50 grayscale hover:grayscale-0 hover:opacity-100 hover:bg-bg-card/50'
              )"
            >
              <div :class="cn('absolute left-0 top-0 bottom-0 transition-all duration-300', isSourceEnabled(source) ? 'w-1.5 bg-brand' : 'w-0 ')"></div>

              <div class="flex items-center gap-3 flex-1 min-w-0">
                <span class="text-[11px] font-black text-text-primary uppercase tracking-tight group-hover:translate-x-1 transition-transform truncate">
                  {{ getSourceName(source) }}
                </span>
              </div>
              
              <div class="flex items-center gap-2 pl-2">
                <button 
                  @click.stop="emit('deleteSource', category as string, getSourceName(source))"
                  class="p-1.5 rounded-lg text-danger/20 hover:bg-danger/10 hover:text-danger opacity-0 group-hover:opacity-100 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Source for this category -->
        <button 
          @click="promptAddSource(category as string)"
          class="flex items-center justify-center gap-3 p-4 rounded-3xl border-2 border-dashed border-brand/10 text-brand/60 hover:text-brand hover:bg-brand/5 hover:border-brand/30 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm group/add mt-4"
        >
          <Plus class="h-4 w-4 group-hover/add:rotate-90 transition-transform" />
          Ajouter à {{ category }}
        </button>
      </div>
    </div>

    <button 
      @click="promptAddSource()"
      class="w-full flex items-center justify-center gap-3 p-6 rounded-[2rem] border-2 border-dashed border-brand/20 text-brand bg-brand/5 hover:bg-brand/10 hover:border-brand/40 transition-all text-xs font-black uppercase tracking-widest mt-10 shadow-sm active:scale-[0.98]"
    >
      <Plus class="h-5 w-5" />
      Ajouter une source personnalisée
    </button>
  </div>
</template>
