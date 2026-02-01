<script setup lang="ts">
import { ref, computed } from 'vue';
import { Search, Hash, X } from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const props = defineProps<{
  tags: string[];
  selectedTag: string | null;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'select-tag', tag: string | null): void;
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
  <div class="space-y-4">
    <!-- Tag Search -->
    <div class="relative group">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted group-focus-within:text-brand transition-colors" />
      <input 
        v-model="searchQuery"
        type="text" 
        :placeholder="placeholder || 'Rechercher un tag...'"
        class="w-full bg-bg-card/50 border border-brand/10 rounded-xl pl-10 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-brand/40 focus:bg-bg-card transition-all"
      />
      <button 
        v-if="searchQuery" 
        @click="searchQuery = ''"
        class="absolute right-3 top-1/2 -translate-y-1/2"
      >
        <X class="h-3 w-3 text-text-muted hover:text-brand" />
      </button>
    </div>

    <!-- Tags List -->
    <div class="flex flex-wrap gap-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
      <button 
        @click="emit('select-tag', null)"
        :class="cn(
          'px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border',
          selectedTag === null 
            ? 'bg-text-primary text-bg-card border-text-primary shadow-lg' 
            : 'bg-bg-card/70 text-text-secondary border-brand/5 hover:border-brand/20 shadow-sm'
        )"
      >
        TOUS
      </button>

      <button 
        v-for="tag in filteredTags" 
        :key="tag"
        @click="emit('select-tag', tag)"
        :class="cn(
          'px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border shadow-sm flex items-center gap-1',
          selectedTag === tag
            ? 'bg-brand text-white border-brand shadow-md icon-glow-brand' 
            : 'bg-bg-card/80 text-text-secondary border-brand/5 hover:border-brand/20'
        )"
      >
        <Hash class="h-2.5 w-2.5 opacity-50" />
        {{ tag }}
      </button>

      <div v-if="filteredTags.length === 0" class="w-full py-4 text-center">
        <p class="text-[9px] font-bold uppercase tracking-widest text-text-muted italic">Aucun tag trouvé</p>
      </div>
    </div>
  </div>
</template>
