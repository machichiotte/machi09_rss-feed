<script setup lang="ts">
import { 
  Sparkles, 
  FileText, 
  Languages 
} from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

defineProps<{
  globalInsightMode: boolean;
  globalSummaryMode: boolean;
  autoTranslate: boolean;
  preferredLanguage: string;
}>();

const emit = defineEmits<{
  'update:globalInsightMode': [val: boolean],
  'update:globalSummaryMode': [val: boolean],
  'update:autoTranslate': [val: boolean]
}>();

function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-6">
      <button 
        v-for="setting in [
          { id: 'globalInsightMode', icon: Sparkles, label: 'Montrer l\'analyse IA', desc: 'Génère automatiquement des résumés contextuels pour chaque article.', color: 'insight', state: globalInsightMode },
          { id: 'globalSummaryMode', icon: FileText, label: 'Afficher le résumé', desc: 'Affiche l\'aperçu original du flux RSS sous l\'analyse IA.', color: 'summary', state: globalSummaryMode },
          { id: 'autoTranslate', icon: Languages, label: 'Traduction Automatique', desc: `Traduit instantanément les synthèses dans votre langue préférée (${preferredLanguage.toUpperCase()}).`, color: 'translate', state: autoTranslate }
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
          <div v-if="setting.state" class="absolute h-8 w-8 rounded-full border border-current opacity-50 animate-ping" :class="`border-${setting.color}`"></div>
        </div>
      </button>
    </div>
  </div>
</template>
