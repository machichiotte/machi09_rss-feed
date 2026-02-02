<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

// Layout Components
import AuroraBackground from './components/layout/AuroraBackground.vue';
import Navbar from './components/layout/Navbar.vue';
import Footer from './components/layout/Footer.vue';
import SettingsModal from './components/settings/SettingsModal.vue';

// i18n
// import { useI18n } from './composables/useI18n';
import type { UserUserSettings } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// State
const searchQuery = ref('');
const processing = ref(false);
const globalInsightMode = ref(localStorage.globalInsightMode === 'true');
const globalSummaryMode = ref(localStorage.globalSummaryMode === 'true');
const autoTranslate = ref(localStorage.autoTranslate !== 'false');
const preferredLanguage = ref(localStorage.preferredLanguage || 'fr');
if (!localStorage.preferredLanguage) localStorage.preferredLanguage = 'fr';

const viewMode = ref<'grid' | 'list' | 'compact'>((localStorage.viewMode as 'grid' | 'list' | 'compact') || 'grid');
const isDark = ref(false);

const userId = ref(localStorage.userId || `user_${Math.random().toString(36).substring(2, 15)}`);
if (!localStorage.userId) localStorage.userId = userId.value;

const customTags = ref<string[]>(JSON.parse(localStorage.customTags || '[]'));
const bookmarkedIds = ref<string[]>(JSON.parse(localStorage.bookmarkedIds || '[]'));

const isSettingsOpen = ref(false);
const settingsTab = ref('feeds');

// Metadata
const allCategories = ref<string[]>([]);
const allSources = ref<string[]>([]);
const groupedSources = ref<Record<string, { name: string; language: string; enabled: boolean; maxArticles?: number }[]>>({});
const allLanguages = ref<string[]>([]);

// const { t } = useI18n(preferredLanguage);
// const route = useRoute();

// Methods
const syncProfile = async () => {
  try {
    axios.post(`${API_BASE_URL}/api/user/${userId.value}/profile`, {
      bookmarks: bookmarkedIds.value,
      customTags: customTags.value,
      settings: {
        viewMode: viewMode.value,
        globalInsightMode: globalInsightMode.value,
        globalSummaryMode: globalSummaryMode.value,
        autoTranslate: autoTranslate.value,
        preferredLanguage: preferredLanguage.value,
      }
    }); // fire and forget
  } catch (e) {
    console.error('Failed to sync user profile:', e);
  }
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  applyTheme();
};

const applyTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.setProperty('color-scheme', 'dark');
    localStorage.theme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.setProperty('color-scheme', 'light');
    localStorage.theme = 'light';
  }
};

const fetchMetadata = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/rss/metadata`);
    allCategories.value = response.data.categories || [];
    allSources.value = response.data.sources || [];
    groupedSources.value = response.data.groupedSources || {};
    allLanguages.value = response.data.languages || [];
  } catch {
    console.warn('Failed to fetch metadata');
  }
};

const handleDeleteSource = (category: string, name: string) => {
  if (groupedSources.value[category]) {
    groupedSources.value[category] = groupedSources.value[category].filter(s => s.name !== name);
    if (groupedSources.value[category].length === 0) {
      delete groupedSources.value[category];
      allCategories.value = allCategories.value.filter(c => c !== category);
    }
  }
};

const handleUpdateSourceLimit = async (category: string, name: string, limit: number) => {
    const sourceArr = groupedSources.value[category];
    if (sourceArr) {
      const source = sourceArr.find(s => s.name === name);
      if (source) source.maxArticles = limit;
    }
    try {
        await axios.patch(`${API_BASE_URL}/api/rss/sources/${encodeURIComponent(name)}`, { maxArticles: limit });
    } catch (err) {
        console.error('Update limit failed', err);
    }
};

const handleToggleSource = async (_category: string, name: string, enabled: boolean) => {
    // Optimistic already handled by binding, just sync
    try {
        await axios.patch(`${API_BASE_URL}/api/rss/sources/${encodeURIComponent(name)}/toggle`, { enabled });
    } catch (e) { console.error(e); }
};

const triggerProcess = async () => {
  processing.value = true;
  try {
    await axios.post(`${API_BASE_URL}/api/rss/process`);
    setTimeout(() => {
      // We can emit or reload - here since view handles data, 
      // we just toggle processing. The view should watch processing status or we rely on optimistic wait
      // Actually HomeView doesn't watch processing, but we can pass a trigger prop
      // For now, simpler: user manually refreshes or we wait
      processing.value = false;
    }, 4000); 
  } catch {
    processing.value = false;
  }
};

const applyProfileSettings = (settings: Partial<UserUserSettings>) => {
  if (settings.viewMode) viewMode.value = settings.viewMode;
  if (settings.globalInsightMode !== undefined) globalInsightMode.value = settings.globalInsightMode;
  if (settings.globalSummaryMode !== undefined) globalSummaryMode.value = settings.globalSummaryMode;
  if (settings.autoTranslate !== undefined) autoTranslate.value = settings.autoTranslate;
  if (settings.preferredLanguage) preferredLanguage.value = settings.preferredLanguage;
};

const initializeUserProfile = async () => {
  try {
    const { data: profile } = await axios.get(`${API_BASE_URL}/api/user/${userId.value}/profile`);
    if (profile?.updatedAt) {
      bookmarkedIds.value = profile.bookmarks || [];
      customTags.value = profile.customTags || [];
      if (profile.settings) {
        applyProfileSettings(profile.settings);
      }
    }
  } catch {
    console.warn('Sync failed on mount, using local storage');
  }
};

// Watchers
watch([customTags, bookmarkedIds], () => {
  localStorage.customTags = JSON.stringify(customTags.value);
  localStorage.bookmarkedIds = JSON.stringify(bookmarkedIds.value);
  syncProfile();
}, { deep: true });

watch([viewMode, globalInsightMode, globalSummaryMode, autoTranslate, preferredLanguage], () => {
  localStorage.viewMode = viewMode.value;
  localStorage.globalInsightMode = globalInsightMode.value.toString();
  localStorage.globalSummaryMode = globalSummaryMode.value.toString();
  localStorage.autoTranslate = autoTranslate.value.toString();
  localStorage.preferredLanguage = preferredLanguage.value;
  syncProfile();
});

onMounted(async () => {
  const savedTheme = localStorage.theme;
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  isDark.value = savedTheme === 'dark' || (!savedTheme && isSystemDark);
  applyTheme();

  await initializeUserProfile();
  fetchMetadata();
});
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans selection:bg-brand/30 text-text-secondary">
    <AuroraBackground />

    <Navbar 
      v-model:search-query="searchQuery"
      :preferred-language="preferredLanguage"
      v-model:auto-translate="autoTranslate"
      v-model:global-insight-mode="globalInsightMode"
      v-model:global-summary-mode="globalSummaryMode"
      v-model:view-mode="viewMode"
      :is-dark="isDark"
      :processing="processing"
      @toggle-theme="toggleTheme"
      @trigger-process="triggerProcess"
      @open-settings="isSettingsOpen = true"
    />

    <SettingsModal 
      v-model:active-tab="settingsTab"
      :is-open="isSettingsOpen"
      :is-dark="isDark"
      :global-insight-mode="globalInsightMode"
      :global-summary-mode="globalSummaryMode"
      :auto-translate="autoTranslate"
      :preferred-language="preferredLanguage"
      :view-mode="viewMode"
      :grouped-sources="groupedSources"
      :languages="allLanguages"
      :selected-sentiment="null"
      :custom-tags="customTags"
      @close="isSettingsOpen = false"
      @toggle-theme="toggleTheme"
      @update:global-insight-mode="globalInsightMode = $event"
      @update:global-summary-mode="globalSummaryMode = $event"
      @update:auto-translate="autoTranslate = $event"
      @update:view-mode="viewMode = $event"
      @update:preferred-language="preferredLanguage = $event"
      @add-custom-tag="(tag) => customTags.push(tag)"
      @remove-custom-tag="(tag) => customTags = customTags.filter(t => t !== tag)"
      @delete-source="handleDeleteSource"
      @toggle-source="handleToggleSource"
      @update-source-limit="handleUpdateSourceLimit"
    />

    <main class="w-full max-w-[1910px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-10 relative">
      <router-view 
        :search-query="searchQuery"
        :preferred-language="preferredLanguage"
        :auto-translate="autoTranslate"
        :global-insight-mode="globalInsightMode"
        :global-summary-mode="globalSummaryMode"
        :view-mode="viewMode"
        :is-dark="isDark"
        :processing="processing"
        :user-id="userId"
        :bookmarked-ids="bookmarkedIds"
        :custom-tags="customTags"
        :grouped-sources="groupedSources"
        :all-languages="allLanguages"
        :all-categories="allCategories"
        @update:bookmarked-ids="(ids: string[]) => bookmarkedIds = ids"
        @update:custom-tags="(tags: string[]) => customTags = tags"
        @open-settings="(tab: string) => { settingsTab = tab; isSettingsOpen = true; }"
        @trigger-process="triggerProcess"
      />
    </main>

    <Footer :preferred-language="preferredLanguage" />
  </div>
</template>
