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
    isPromotional?: boolean;
  };
  translations?: Record<string, {
    title: string;
    summary: string;
    iaSummary?: string;
  }>;
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
    <!-- Card Header / Metadata -->
    <div
      :class="cn(
        'flex justify-between items-center mb-6',
        viewMode === 'list' && 'hidden'
      )"
    >
      <div class="flex gap-2 flex-wrap">
        <span class="px-3 py-1.5 rounded-xl meta-news bg-bg-card/80 border border-brand/5 flex items-center gap-1.5 shadow-sm">
          {{ article.category }}
          <span class="mx-1 opacity-50">•</span>
          {{ getLangFlag(article.language || 'en') }}
        </span>

        <span v-if="article.analysis?.isPromotional" class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse">
          {{ t('common.promotional') }}
        </span>
        
        <!-- AI Sentiment Hub -->
        <div 
          v-if="article.analysis" 
          :class="cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all',
            article.analysis?.sentiment === 'bullish' 
              ? 'bg-success/20 text-success border-success/30 icon-glow-success' 
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
      
      <span class="meta-news flex items-center gap-1.5">
        <Clock class="h-3 w-3" />
        {{ formatDate(article.publicationDate || article.fetchedAt) }}
      </span>
    </div>

    <!-- Main Content Area -->
    <div
      :class="cn(
        'flex-1 flex flex-col',
        viewMode === 'list' && 'flex-row gap-6'
      )"
    >
      <!-- Thumbnail Placeholder for List Mode or Grid -->
      <div v-if="viewMode === 'list'" class="w-24 h-24 sm:w-40 sm:h-40 shrink-0 rounded-3xl bg-brand/5 border border-brand/10 flex items-center justify-center overflow-hidden">
        <Rss class="h-10 w-10 text-brand/20" />
      </div>

      <div
        :class="cn(
          'flex-1',
          viewMode !== 'compact' && 'mb-8'
        )"
      >
        <div class="mb-4">
          <div v-if="viewMode === 'list'" class="flex gap-2 mb-2">
            <span class="text-[10px] font-bold uppercase tracking-widest text-brand">{{ article.feedName }}</span>
            <span class="text-[10px] text-text-muted">•</span>
            <span class="text-[10px] text-text-muted uppercase">{{ formatDate(article.publicationDate || article.fetchedAt) }}</span>
          </div>

          <h3
            :class="cn(
              'title-news leading-[1.3] group-hover:text-brand transition-colors cursor-pointer flex-1',
              viewMode === 'grid' && 'text-xl',
              viewMode === 'list' && 'text-xl md:text-2xl font-black',
              viewMode === 'compact' && 'text-base font-bold'
            )"
          >
            <a :href="article.link" target="_blank" rel="noopener noreferrer">
              {{ getArticleTitle(article) }}
            </a>
          </h3>
        </div>
      
        <!-- AI Summary Block -->
        <div v-if="globalInsightMode && (article.analysis?.iaSummary || hasTranslation(article))" class="mb-4 p-5 rounded-2xl bg-insight/10 border border-insight/20 relative overflow-hidden group/ia transition-all duration-300 shadow-sm text-balance">
          <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-insight"></div>
        
          <div class="flex justify-between items-center mb-2">
            <p class="text-[10px] font-black uppercase tracking-widest text-insight flex items-center gap-1">
              <Sparkles class="h-3 w-3" /> 
              {{ t('article.ai_insight') }}
              <span v-if="translationToggles[article._id] && article.language?.toLowerCase() !== preferredLanguage.toLowerCase()" class="ml-2 px-2 py-0.5 rounded-full bg-translate/10 text-translate border border-translate/20 text-[8px] flex items-center gap-1">
                {{ getLangFlag(article.language || 'en') }} 
                <ArrowRight class="h-2 w-2" /> 
                {{ getLangFlag(preferredLanguage) }}
              </span>
            </p>
          </div>

          <h4 v-if="translationToggles[article._id] && getArticleInsightTitle(article)" class="text-xs font-bold text-text-primary dark:text-insight mb-2 leading-tight">
            {{ getArticleInsightTitle(article) }}
          </h4>

          <p class="body-news italic">
            "{{ getArticleInsight(article) }}"
          </p>
        </div>

        <!-- Reader Block - Original RSS Summary -->
        <div v-if="globalSummaryMode && article.summary && viewMode !== 'compact'" class="mb-4 p-5 rounded-2xl bg-summary/10 border border-summary/20 relative overflow-hidden group/reader transition-all duration-300 shadow-sm">
          <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-summary"></div>
        
          <div class="flex justify-between items-center mb-2">
            <p class="text-[10px] font-black uppercase tracking-widest text-summary flex items-center gap-1">
              <FileText class="h-3 w-3" /> 
              {{ t('article.source_summary') }}
            </p>
          </div>

          <p class="body-news opacity-80">
            {{ article.summary.replace(/<[^>]*>/g, '').slice(0, 300) }}...
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
