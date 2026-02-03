<script setup lang="ts">
import { ref, computed } from 'vue';
import { Search, Hash, X, Plus } from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const props = defineProps<{
  tags: string[];
  selectedTag: string | null;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'select-tag', tag: string | null): void;
  (e: 'request-add-tag'): void;
}>();

const searchQuery = ref('');

function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

const filteredTags = computed(() => {
  if (!searchQuery.value) return props.tags;
  return props.tags.filter(tag => 
    tag.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// For a "Cloud" effect, we could vary font sizes, but for a clean dashboard, 
// we'll stick to a refined pill list with search.
</script>

<template>
  <div class="flex items-center gap-4 min-w-0">
    <!-- Tag Search -->
    <div class="relative group w-48 flex-shrink-0">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted group-focus-within:text-brand transition-colors" />
      <input 
        v-model="searchQuery"
        type="text" 
        :placeholder="placeholder || 'Filtrer les tags...'"
        class="w-full bg-brand/5 border border-brand/5 rounded-xl pl-9 pr-8 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-text-primary outline-none focus:border-brand/30 focus:bg-brand/10 transition-all placeholder:text-text-muted/40"
      />
      <button 
        v-if="searchQuery" 
        @click="searchQuery = ''"
        class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-brand transition-colors"
      >
        <X class="h-3 w-3" />
      </button>
    </div>

    <!-- Vertical Separator -->
    <div class="h-5 w-px bg-brand/10 flex-shrink-0"></div>

    <!-- Tags List (Horizontal Scrollable) -->
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar flex-grow pr-4">
      <button 
        @click="emit('select-tag', null)"
        :class="cn(
          'px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border whitespace-nowrap flex-shrink-0',
          selectedTag === null 
            ? 'bg-brand text-white border-brand shadow-lg icon-glow-brand' 
            : 'bg-white/5 text-text-muted border-white/5 hover:border-brand/20'
        )"
      >
        TOUS
      </button>

      <button 
        v-for="tag in filteredTags" 
        :key="tag"
        @click="emit('select-tag', tag)"
        :class="cn(
          'px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border whitespace-nowrap flex-shrink-0 flex items-center gap-1.5',
          selectedTag === tag
            ? 'bg-brand/20 text-brand border-brand/40 shadow-inner' 
            : 'bg-white/5 text-text-muted/70 border-white/5 hover:border-brand/20'
        )"
      >
        <Hash class="h-2.5 w-2.5 opacity-40" />
        {{ tag }}
      </button>

      <div v-if="filteredTags.length === 0" class="flex-shrink-0">
        <p class="text-[9px] font-bold uppercase tracking-widest text-text-muted/40 italic">Aucun résultat</p>
      </div>

      <!-- Add Tag Action -->
      <button 
        @click="emit('request-add-tag')"
        class="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-xl bg-brand/10 border border-brand/20 text-brand hover:bg-brand hover:text-white transition-all shadow-sm active:scale-90 ml-2"
        title="Ajouter un tag"
      >
        <Plus class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
</template>
