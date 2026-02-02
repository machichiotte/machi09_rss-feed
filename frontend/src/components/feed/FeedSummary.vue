<script setup lang="ts">
import { Sun, Calendar, Mail, Star } from 'lucide-vue-next';
import { toRef } from 'vue';
import { useI18n } from '../../composables/useI18n';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

const props = defineProps<{
  counts: {
    today: number;
    week: number;
    unread: number;
    saved: number;
  };
  activeFilter: string;
  preferredLanguage: string;
}>();

const emit = defineEmits<{
  (e: 'filter-change', filter: string): void;
}>();

const { t } = useI18n(toRef(props, 'preferredLanguage'));

function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

const filters = [
  { id: '24h', label: 'summary.today', icon: Sun, color: 'text-brand', bg: 'bg-brand/10', border: 'border-brand/20' },
  { id: '7d', label: 'summary.this_week', icon: Calendar, color: 'text-insight', bg: 'bg-insight/10', border: 'border-insight/20' },
  { id: 'unread', label: 'summary.unread', icon: Mail, color: 'text-summary', bg: 'bg-summary/10', border: 'border-summary/20' },
  { id: 'saved', label: 'summary.saved', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
];

const getCount = (id: string) => {
  if (id === '24h') return props.counts.today;
  if (id === '7d') return props.counts.week;
  if (id === 'unread') return props.counts.unread;
  if (id === 'saved') return props.counts.saved;
  return 0;
};
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
    <button
      v-for="filter in filters"
      :key="filter.id"
      @click="emit('filter-change', filter.id)"
      :class="cn(
        'group relative overflow-hidden glass rounded-2xl px-4 py-3.5 transition-all duration-300 text-left border flex flex-col justify-between h-[90px]',
        props.activeFilter === filter.id 
          ? twMerge(filter.bg, filter.border, 'shadow-md') 
          : 'bg-bg-card/40 border-brand/5 hover:border-brand/20'
      )"
    >
      <div class="flex items-center justify-between relative z-10">
        <div class="flex items-center gap-3 min-w-0">
          <div :class="cn('p-2 rounded-xl bg-white/5 border border-white/10 shadow-sm shrink-0', filter.color)">
            <component :is="filter.icon" class="h-4 w-4" />
          </div>
          <p class="text-[9px] font-black uppercase tracking-[0.1em] text-text-muted transition-colors group-hover:text-text-primary truncate">
            {{ t(filter.label) }}
          </p>
        </div>
        <span :class="cn('text-2xl font-black tracking-tighter tabular-nums', props.activeFilter === filter.id ? filter.color : 'text-text-primary')">
          {{ getCount(filter.id) }}
        </span>
      </div>

      <div class="relative z-10">
        <div :class="cn('h-1 w-full rounded-full bg-text-secondary/5 overflow-hidden')">
          <div 
            :class="cn('h-full transition-all duration-1000', props.activeFilter === filter.id ? filter.bg.replace('/10', '') : 'bg-brand/20')"
            :style="{ width: props.activeFilter === filter.id ? '100%' : '30%' }"
          ></div>
        </div>
      </div>
    </button>
  </div>
</template>

<style scoped>
.glass {
  backdrop-filter: blur(20px);
}
</style>
