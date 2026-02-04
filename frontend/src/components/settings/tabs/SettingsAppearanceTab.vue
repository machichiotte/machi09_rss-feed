<script setup lang="ts">
import { 
  Sun, 
  Moon 
} from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

defineProps<{
  isDark: boolean;
  preferredLanguage: string;
  viewMode: 'grid' | 'list' | 'compact';
  languages: string[];
}>();

const emit = defineEmits<{
  'toggleTheme': [],
  'update:preferredLanguage': [val: string],
  'update:viewMode': [val: 'grid' | 'list' | 'compact']
}>();

function cn(...inputs: unknown[]) {
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
  <div class="space-y-10">
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
      <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-8 border-b border-brand/10 pb-4">Langue de l'interface</h4>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <button 
          v-for="lang in languages" 
          :key="lang"
          @click="emit('update:preferredLanguage', lang)"
          :class="cn(
            'flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all relative overflow-hidden',
            preferredLanguage === lang
              ? 'bg-brand/10 border-brand/40 text-brand shadow-md' 
              : 'bg-bg-card/50 border-brand/5 text-text-secondary hover:bg-bg-card hover:border-brand/20'
          )"
        >
          <span class="text-xl">{{ getLangFlag(lang) }}</span>
          <span class="text-[10px] font-black uppercase tracking-widest">{{ lang }}</span>
          <div v-if="preferredLanguage === lang" class="absolute bottom-0 left-0 right-0 h-1 bg-brand"></div>
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
</template>
