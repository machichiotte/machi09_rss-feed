<script setup lang="ts">
import { ref } from 'vue';
import { 
  Plus, 
  X, 
  Hash, 
  Activity 
} from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

defineProps<{
  customTags: string[];
  selectedSentiment: string | null;
}>();

const emit = defineEmits<{
  'toggleSentiment': [sentiment: string],
  'addCustomTag': [tag: string],
  'removeCustomTag': [tag: string]
}>();

const newTag = ref('');

function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

const handleAddTag = () => {
  if (newTag.value.trim()) {
    emit('addCustomTag', newTag.value.trim());
    newTag.value = '';
  }
};
</script>

<template>
  <div class="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
    <!-- Custom Tags -->
    <section class="p-8 rounded-[2.5rem] bg-bg-card border border-brand/10 shadow-md">
      <div class="flex items-center justify-between mb-8 border-b border-brand/10 pb-4">
        <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Tags Personnalisés</h4>
        <span class="text-[9px] font-bold text-text-muted/50 uppercase tracking-widest">{{ customTags.length }} Tags actifs</span>
      </div>
      
      <div class="flex flex-col gap-6">
        <div class="flex gap-2">
          <input 
            v-model="newTag"
            type="text" 
            placeholder="Ajouter un tag de veille (ex: Bitcoin, IA, Tech...)"
            class="flex-1 bg-brand/5 border border-brand/10 rounded-2xl px-5 py-4 text-xs font-bold text-text-primary outline-none focus:border-brand/40 focus:bg-brand/10 transition-all"
            @keyup.enter="handleAddTag"
          />
          <button 
            @click="handleAddTag"
            class="p-4 rounded-2xl bg-brand text-white shadow-lg icon-glow-brand hover:scale-105 active:scale-95 transition-all"
          >
            <Plus class="h-5 w-5" />
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          <div 
            v-for="tag in customTags" 
            :key="tag"
            class="group flex items-center gap-2 px-4 py-2 rounded-xl bg-brand/10 border border-brand/20 text-brand text-[10px] font-black uppercase tracking-widest transition-all hover:border-brand/40"
          >
            <Hash class="h-3 w-3 opacity-50" />
            {{ tag }}
            <button @click="emit('removeCustomTag', tag)" class="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-danger">
              <X class="h-3 w-3" />
            </button>
          </div>
          <div v-if="customTags.length === 0" class="w-full py-8 text-center border-2 border-dashed border-brand/5 rounded-3xl">
            <p class="text-[10px] font-bold text-text-muted italic uppercase tracking-widest">Aucun tag personnalisé défini</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Market Sentiment -->
    <section class="p-8 rounded-[2.5rem] bg-bg-card border border-brand/10 shadow-md">
      <div class="flex items-center justify-between mb-8 border-b border-brand/10 pb-4">
        <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Sentiment du Marché</h4>
        <Activity class="h-4 w-4 text-brand opacity-50" />
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          v-for="sent in ['bullish', 'bearish', 'neutral']"
          :key="sent"
          @click="emit('toggleSentiment', sent)"
          :class="cn(
            'flex items-center justify-between px-6 py-5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest group',
            selectedSentiment === sent
              ? sent === 'bullish' ? 'bg-success/10 border-success/30 text-success shadow-lg' : sent === 'bearish' ? 'bg-danger/10 border-danger/30 text-danger shadow-lg' : 'bg-text-secondary/10 border-text-secondary/20 text-text-primary shadow-lg'
              : 'bg-bg-card/50 border-brand/5 text-text-muted hover:bg-bg-card hover:border-brand/20'
          )"
        >
          <span class="italic">{{ sent }}</span>
          <div
            :class="cn(
              'h-2 w-2 rounded-full transition-all duration-500', 
              sent === 'bullish' ? 'bg-success shadow-success/50' : sent === 'bearish' ? 'bg-danger shadow-danger/50' : 'bg-text-muted shadow-text-muted/50',
              selectedSentiment === sent ? 'scale-150 opacity-100 shadow-md' : 'opacity-20 scale-100'
            )"
          ></div>
        </button>
      </div>
      <p class="mt-6 text-[10px] text-text-muted italic font-medium leading-relaxed">
        Note: Ces filtres sont basés sur l'analyse sémantique du contenu par l'IA de Nexus.
      </p>
    </section>
  </div>
</template>

<style scoped>
.icon-glow-brand {
  box-shadow: 0 10px 30px -10px rgba(var(--brand-rgb, 99, 102, 241), 0.5);
}
</style>
