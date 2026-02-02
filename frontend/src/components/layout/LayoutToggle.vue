<script setup lang="ts">
import { LayoutGrid, List, LayoutPanelLeft } from 'lucide-vue-next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

defineProps<{
  modelValue: 'grid' | 'list' | 'compact';
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: 'grid' | 'list' | 'compact'): void;
}>();

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const modes = [
  { id: 'grid', icon: LayoutGrid, label: 'Grille' },
  { id: 'list', icon: List, label: 'Liste' },
  { id: 'compact', icon: LayoutPanelLeft, label: 'Compact' }
] as const;
</script>

<template>
  <div class="flex items-center p-1.5 bg-bg-card/50 backdrop-blur-md rounded-2xl border border-brand/20 shadow-sm">
    <button 
      v-for="mode in modes" 
      :key="mode.id"
      @click="emit('update:modelValue', mode.id)"
      :class="cn(
        'p-2 rounded-xl transition-all duration-300 flex items-center justify-center group relative',
        modelValue === mode.id 
          ? 'bg-brand text-bg-card shadow-lg shadow-brand/20 scale-105' 
          : 'text-text-muted hover:bg-bg-card hover:text-brand'
      )"
      :title="mode.label"
    >
      <component :is="mode.icon" class="h-4 w-4" />
    </button>
  </div>
</template>
