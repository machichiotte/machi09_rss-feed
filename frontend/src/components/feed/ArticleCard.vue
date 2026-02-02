<script setup lang="ts">
import { 
  TrendingUp, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  ArrowRight, 
  Minus,
  FileText
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
  };
  translations?: Record<string, {
    title: string;
    summary: string;
    iaSummary?: string;
  }>;
  imageUrl?: string;
}

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
</script>

<template>
  <article 
    :class="cn(
      'group glass-card rounded-[2.5rem] transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl dark:hover:shadow-brand/5',
      viewMode === 'grid' && 'p-8 flex flex-col h-full',
      viewMode === 'list' && 'p-6 flex flex-row gap-8 items-start h-auto',
      viewMode === 'compact' && 'p-5 flex flex-col h-full'
    )"
  >
    <!-- cinematic Image Header (Grid & Compact) -->
    <div 
      v-if="viewMode !== 'list'"
      class="relative w-full overflow-hidden rounded-[2rem] aspect-[21/9] mb-6 shadow-inner bg-brand/5 border border-brand/10 group/img h-48"
    >
      <div v-if="article.imageUrl" class="absolute inset-0">
        <img 
          :src="article.imageUrl" 
          :alt="article.title"
          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-bg-card/80 via-transparent to-transparent opacity-60"></div>
      </div>
      <div v-else class="absolute inset-0 bg-gradient-to-br from-brand/10 via-brand/5 to-transparent flex items-center justify-center">
        <Sparkles class="h-12 w-12 text-brand/20 animate-pulse" />
      </div>
      
      <!-- Overlaid Badge -->
      <div class="absolute bottom-4 left-4 flex gap-2">
        <span class="px-2.5 py-1 rounded-lg bg-bg-card/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-brand border border-brand/20 shadow-xl">
          {{ article.feedName }}
        </span>
      </div>
    </div>

    <!-- Main Content Area -->
    <div
      :class="cn(
        'flex-1 flex flex-col',
        viewMode === 'list' && 'flex-row gap-8'
      )"
    >
      <!-- Thumbnail for List Mode -->
      <div v-if="viewMode === 'list'" class="w-32 h-32 sm:w-48 sm:h-48 shrink-0 rounded-[2rem] bg-brand/5 border border-brand/10 flex items-center justify-center overflow-hidden relative shadow-lg group/img">
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
        <!-- Categories & Meta (Moved inside flex group for list) -->
        <div class="flex items-center gap-3 mb-4 flex-wrap">
          <span class="px-3 py-1.5 rounded-xl meta-news bg-brand/5 border border-brand/10 flex items-center gap-1.5 shadow-sm text-[10px]">
            {{ article.category }}
            <span class="mx-1 opacity-50">•</span>
            {{ getLangFlag(article.language || 'en') }}
          </span>

          <span class="meta-news flex items-center gap-1.5 text-[10px]">
            <Clock class="h-3.5 w-3.5" />
            {{ formatDate(article.publicationDate || article.fetchedAt) }}
          </span>

          <span v-if="article.analysis?.isPromotional" class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            {{ t('common.promotional') }}
          </span>
          
          <div 
            v-if="article.analysis" 
            :class="cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all',
              article.analysis?.sentiment === 'bullish' 
                ? 'bg-success/20 text-success border-success/30' 
                : article.analysis?.sentiment === 'bearish'
                  ? 'bg-danger/20 text-danger border-danger/30'
                  : 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
            )"
          >
            <TrendingUp v-if="article.analysis?.sentiment !== 'neutral'" :class="cn('h-3 w-3', article.analysis?.sentiment === 'bearish' && 'rotate-180')" />
            <Minus v-else class="h-3 w-3" />
            {{ Math.round((article.analysis?.sentimentScore || 0) * 100) }}%
          </div>
        </div>

        <div class="mb-5">
          <h3
            :class="cn(
              'title-news leading-[1.2] group-hover:text-brand transition-colors cursor-pointer flex-1 mb-2',
              viewMode === 'grid' && 'text-xl font-black uppercase tracking-tight',
              viewMode === 'list' && 'text-2xl md:text-3xl font-black uppercase tracking-tighter',
              viewMode === 'compact' && 'text-base font-black uppercase tracking-tight'
            )"
          >
            <a :href="article.link" target="_blank" rel="noopener noreferrer">
              {{ getArticleTitle(article) }}
            </a>
          </h3>
          <div v-if="viewMode === 'list'" class="flex items-center gap-2 mb-4">
            <span class="text-xs font-black uppercase tracking-widest text-brand/60 italic">{{ article.feedName }}</span>
          </div>
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

          <p class="text-sm font-medium leading-relaxed italic text-text-primary/90">
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
        'pt-6 border-t border-text-secondary/10 flex items-center justify-between',
        viewMode === 'list' && 'border-t-0 pt-0'
      )"
    >
      <div v-if="viewMode === 'grid'" class="flex items-center gap-2">
        <span class="meta-news opacity-80 tracking-tighter">{{ article.feedName }}</span>
      </div>
      
      <a 
        :href="article.link" 
        target="_blank" 
        rel="noopener noreferrer"
        class="group/btn flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-text-primary text-bg-card text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95 ml-auto"
      >
        {{ t('common.view_source') }}
        <ExternalLink class="h-3 w-3 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
      </a>
    </div>
  </article>
</template>
