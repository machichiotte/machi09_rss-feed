<script setup lang="ts">
import { toRef } from 'vue';
import { useI18n } from '../../composables/useI18n';

const props = defineProps<{
  preferredLanguage?: string;
}>();

const { t } = useI18n(toRef(props, 'preferredLanguage', 'fr'));
</script>

<template>
  <footer class="mt-auto py-4 glass border-t-brand/10 text-center">
    <p class="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">
      &copy; 2025 Kognit &bull; {{ t('footer.engineered_by') }}
    </p>
  </footer>
</template>
