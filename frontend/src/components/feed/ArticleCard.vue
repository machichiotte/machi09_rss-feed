<script setup lang="ts">
import { 
  TrendingUp, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  ArrowRight, 
  Minus,
  FileText,
  Bookmark,
  Rss
} from 'lucide-vue-next';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toRef } from 'vue';
import { useI18n } from '../../composables/useI18n';

interface Article {
  _id: string;
  title: string;
  link: string;
  sourceFeed: string;
  feedName: string;
  category: string;
  language?: string;
  publicationDate: string;
  summary: string;
  fetchedAt: string;
  analysis?: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    sentimentScore: number;
    iaSummary?: string;
    isPromotional?: boolean;
    entities?: { text: string; label: string; score: number }[];
  };
  translations?: Record<string, {
    title: string;
    summary: string;
    iaSummary?: string;
  }>;
  imageUrl?: string;
  author?: string;
  sourceColor?: string;
  isBookmarked?: boolean;
  variants?: Article[];
}

const emit = defineEmits<{
  (e: 'toggleBookmark', id: string): void
}>();

const props = defineProps<{
  article: Article;
  globalInsightMode: boolean;
  globalSummaryMode: boolean;
  preferredLanguage: string;
  translationToggles: Record<string, boolean>;
  viewMode: 'grid' | 'list' | 'compact';
}>();

const { t } = useI18n(toRef(props, 'preferredLanguage'));

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const formatDate = (dateStr: string) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return t('common.loading'); 
  }
};

const getLangFlag = (lang?: string) => {
  if (!lang) return '🌍';
  const map: Record<string, string> = {
    'fr': '🇫🇷', 'en': '🇺🇸', 'es': '🇪🇸', 'de': '🇩🇪',
    'it': '🇮🇹', 'pt': '🇵🇹', 'nl': '🇳🇱', 'ru': '🇷🇺',
    'zh': '🇨🇳', 'ja': '🇯🇵', 'ar': '🇸🇦', 'cn': '🇨🇳'
  };
  return map[lang.toLowerCase()] || '🌍';
};

const getArticleTitle = (article: Article) => {
  return article.title;
};

const getArticleInsightTitle = (article: Article) => {
  const translations = article.translations;
  const isTranslated = props.translationToggles[article._id];
  const translation = translations?.[props.preferredLanguage];
  
  if (isTranslated && translation) {
    return translation.title;
  }
  return '';
};

const getArticleInsight = (article: Article) => {
  const translations = article.translations;
  const translation = translations ? translations[props.preferredLanguage] : undefined;
  const isTranslated = props.translationToggles[article._id];
  
  if (isTranslated && translation) {
    return translation.iaSummary || translation.summary;
  }
  return article.analysis?.iaSummary || article.summary || t('article.no_insight');
};

const hasTranslation = (article: Article) => {
  return !!(article.translations && article.translations[props.preferredLanguage]);
};

const getDomain = (url: string) => {
  try {
    return new window.URL(url).hostname;
  } catch {
    return '';
  }
};
</script>

<template>
  <article 
    :class="cn(
      'group glass-card rounded-[2.5rem] transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl dark:hover:shadow-brand/5 relative overflow-hidden flex flex-col h-full',
      viewMode === 'list' && 'flex-row gap-0 h-auto'
    )"
    :style="{ 
      borderLeft: (viewMode === 'list' && article.sourceColor) ? `5px solid ${article.sourceColor}` : undefined,
      '--source-color': article.sourceColor || 'var(--brand)'
    }"
  >
    <!-- Source Accent Glow -->
    <div 
      v-if="article.sourceColor"
      class="absolute top-0 right-0 w-32 h-32 bg-[var(--source-color)] opacity-[0.03] blur-[50px] pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-700"
    ></div>

    <!-- cinematic Image Header (Grid & Compact) -->
    <div 
      v-if="viewMode !== 'list'"
      class="relative w-full overflow-hidden border-b border-brand/5 group/img h-52 shrink-0"
    >
      <div 
        v-if="article.sourceColor"
        class="absolute top-0 left-0 right-0 h-1.5 z-20"
        :style="{ backgroundColor: article.sourceColor }"
      ></div>
      <div v-if="article.imageUrl" class="absolute inset-0">
        <img 
          :src="article.imageUrl" 
          :alt="article.title"
          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-bg-card/40 via-transparent to-transparent opacity-60"></div>
      </div>
      <div v-else class="absolute inset-0 bg-gradient-to-br from-brand/10 via-brand/5 to-transparent flex items-center justify-center">
        <Sparkles class="h-12 w-12 text-brand/20 animate-pulse" />
      </div>
    </div>

    <!-- Bookmark Toggle (Float) -->
    <button 
      @click.stop="emit('toggleBookmark', article._id)"
      :class="cn(
        'absolute top-4 right-4 z-40 p-2.5 rounded-2xl transition-all duration-300 backdrop-blur-md border shadow-lg group/bookmark',
        article.isBookmarked 
          ? 'bg-brand text-white border-brand scale-110 shadow-brand/20' 
          : 'bg-bg-card/40 text-text-muted border-white/10 hover:bg-bg-card/60 hover:text-brand'
      )"
    >
      <Bookmark :class="cn('h-5 w-5 transition-transform duration-300', article.isBookmarked ? 'fill-current' : 'group-hover/bookmark:scale-110')" />
    </button>

    <!-- Main Content Area -->
    <div
      :class="cn(
        'flex-1 flex flex-col p-8',
        viewMode === 'compact' && 'p-5',
        viewMode === 'list' && 'p-8 flex-row gap-8'
      )"
    >
      <!-- Thumbnail for List Mode -->
      <div v-if="viewMode === 'list'" class="w-40 h-40 sm:w-56 sm:h-56 shrink-0 rounded-[1.5rem] bg-brand/5 border border-brand/10 flex items-center justify-center overflow-hidden relative shadow-lg group/img m-0">
        <img 
          v-if="article.imageUrl"
          :src="article.imageUrl" 
          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <Rss v-else class="h-12 w-12 text-brand/20" />
        <div class="absolute inset-0 bg-gradient-to-tr from-brand/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      <div
        :class="cn(
          'flex-1',
          viewMode !== 'compact' && 'mb-8'
        )"
      >
        <!-- Categories & Meta -->
        <div class="flex items-center gap-3 mb-5 flex-wrap">
          <div class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-bg-card border border-brand/20 shadow-sm">
            <img 
              v-if="getDomain(article.link)"
              :src="`https://www.google.com/s2/favicons?domain=${getDomain(article.link)}&sz=64`"
              class="w-3.5 h-3.5 rounded-sm grayscale group-hover:grayscale-0 transition-all opacity-70 group-hover:opacity-100"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <span class="text-[9px] font-black uppercase tracking-[0.2em]" :style="{ color: article.sourceColor || 'var(--brand)' }">
              {{ article.feedName }}
            </span>
            <span v-if="article.variants && article.variants.length > 0" class="px-2 py-0.5 rounded-lg bg-brand/5 border border-brand/10 text-[7px] font-black text-brand uppercase ml-1">
              {{ t('article.other_sources', { count: article.variants.length }) }}
            </span>
          </div>

          <span class="px-3 py-1.5 rounded-xl meta-news bg-brand/5 border border-brand/10 flex items-center gap-2 shadow-sm text-text-primary">
            {{ article.category }}
            <span class="mx-1 opacity-20 text-text-muted">•</span>
            {{ getLangFlag(article.language || 'en') }}
          </span>

          <span class="meta-news flex items-center gap-2 text-text-muted">
            <Clock class="h-3.5 w-3.5 opacity-50" />
            {{ formatDate(article.publicationDate || article.fetchedAt) }}
            <template v-if="article.author">
              <span class="mx-1 opacity-20">•</span>
              <span class="truncate max-w-[120px] italic opacity-80" :title="article.author">{{ article.author }}</span>
            </template>
          </span>

          <div 
            v-if="article.analysis" 
            :class="cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] border transition-all shadow-sm',
              article.analysis?.sentiment === 'bullish' 
                ? 'bg-success/10 text-success border-success/20' 
                : article.analysis?.sentiment === 'bearish'
                  ? 'bg-danger/10 text-danger border-danger/20'
                  : 'bg-text-secondary/5 text-text-secondary border-text-secondary/10'
            )"
          >
            <TrendingUp v-if="article.analysis?.sentiment !== 'neutral'" :class="cn('h-3 w-3', article.analysis?.sentiment === 'bearish' && 'rotate-180')" />
            <Minus v-else class="h-3 w-3" />
            {{ Math.round((article.analysis?.sentimentScore || 0) * 100) }}%
          </div>

          <!-- NER Entities -->
          <div v-if="article.analysis?.entities && article.analysis.entities.length > 0" class="flex items-center gap-1.5 flex-wrap">
            <span 
              v-for="entity in article.analysis.entities.slice(0, 5)" 
              :key="entity.text"
              :class="cn(
                'px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-wider border shadow-sm transition-all hover:scale-105 cursor-default',
                entity.label === 'ORG' ? 'bg-brand/10 text-brand border-brand/20' : 
                entity.label === 'PER' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                entity.label === 'LOC' ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' :
                'bg-text-secondary/5 text-text-secondary border-text-secondary/10'
              )"
              :title="`${entity.label}: ${Math.round(entity.score * 100)}%`"
            >
              {{ entity.text }}
            </span>
          </div>
        </div>

        <div class="mb-4">
          <h3
            :class="cn(
              'title-news group-hover:text-brand transition-colors cursor-pointer flex-1 mb-2',
              viewMode === 'grid' && 'text-xl font-bold tracking-tight',
              viewMode === 'list' && 'text-2xl md:text-3xl font-extrabold tracking-tighter',
              viewMode === 'compact' && 'text-base font-bold tracking-tight'
            )"
          >
            <a :href="article.link" target="_blank" rel="noopener noreferrer">
              {{ getArticleTitle(article) }}
            </a>
          </h3>
        </div>
      
        <!-- AI Summary Block -->
        <div v-if="globalInsightMode && (article.analysis?.iaSummary || hasTranslation(article))" class="mb-5 p-6 rounded-[2rem] bg-insight/5 border border-insight/10 relative overflow-hidden group/ia transition-all duration-300 shadow-sm">
          <div class="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-insight to-insight/40"></div>
        
          <div class="flex justify-between items-center mb-3">
            <p class="text-[10px] font-black uppercase tracking-widest text-insight flex items-center gap-2">
              <Sparkles class="h-3.5 w-3.5" /> 
              {{ t('article.ai_insight') }}
              <span v-if="translationToggles[article._id] && article.language?.toLowerCase() !== preferredLanguage.toLowerCase()" class="ml-2 px-2.5 py-1 rounded-full bg-translate/10 text-translate border border-translate/20 text-[8px] flex items-center gap-1.5 font-bold">
                {{ getLangFlag(article.language || 'en') }} 
                <ArrowRight class="h-2.5 w-2.5" /> 
                {{ getLangFlag(preferredLanguage) }}
              </span>
            </p>
          </div>

          <h4 v-if="translationToggles[article._id] && getArticleInsightTitle(article)" class="text-[13px] font-black text-text-primary dark:text-insight/90 mb-2 leading-tight uppercase tracking-tight">
            {{ getArticleInsightTitle(article) }}
          </h4>

          <p class="text-[13px] leading-relaxed italic text-text-primary/90 font-medium">
            "{{ getArticleInsight(article) }}"
          </p>
        </div>

        <!-- Reader Block - Original RSS Summary -->
        <div v-if="globalSummaryMode && article.summary && viewMode !== 'compact'" class="mb-4 p-6 rounded-[2rem] bg-bg-card/30 border border-brand/5 relative overflow-hidden group/reader transition-all duration-300 shadow-sm">
          <div class="absolute left-0 top-0 bottom-0 w-2 bg-text-muted/20"></div>
        
          <div class="flex justify-between items-center mb-3">
            <p class="text-[10px] font-black uppercase tracking-widest text-text-muted/60 flex items-center gap-2">
              <FileText class="h-3.5 w-3.5" /> 
              {{ t('article.source_summary') }}
            </p>
          </div>

          <p class="text-[13px] leading-relaxed text-text-primary/70 font-medium">
            {{ article.summary.replace(/<[^>]*>/g, '').slice(0, 250) }}...
          </p>
        </div>
      </div>
    </div>
    
    <!-- Card Footer -->
    <div
      v-if="viewMode !== 'compact'" :class="cn(
        'px-8 pb-8 pt-4 border-t border-text-secondary/5 flex items-center justify-between',
        viewMode === 'list' && 'border-t-0 pt-0 px-8 pb-8'
      )"
    >
      <div v-if="article.analysis?.isPromotional" class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
        {{ t('common.promotional') }}
      </div>
      
      <a 
        :href="article.link" 
        target="_blank" 
        rel="noopener noreferrer"
        class="group/btn flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-text-primary text-bg-card text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md active:scale-95 ml-auto"
      >
        {{ t('common.view_source') }}
        <ExternalLink class="h-3 w-3 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
      </a>
    </div>
  </article>
</template>
