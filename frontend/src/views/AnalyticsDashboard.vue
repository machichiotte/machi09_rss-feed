<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { TrendingUp, BarChart3, PieChart, Clock, Download, RefreshCw } from 'lucide-vue-next';
import VueApexCharts from 'vue3-apexcharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// State
const loading = ref(true);
const dateRange = ref<'today' | 'week' | 'month' | 'all'>('week');
const selectedCategory = ref<string | null>(null);
const selectedSource = ref<string | null>(null);

// Data
const sentimentData = ref<{
  total: number;
  distribution: { bullish: number; bearish: number; neutral: number };
  bySource: Record<string, { bullish: number; bearish: number; neutral: number }>;
} | null>(null);

const topicsData = ref<{ keyword: string; count: number; sentiment: string }[]>([]);
const timelineData = ref<{ date: string; bullish: number; bearish: number; neutral: number }[]>([]);

// Chart Options
const sentimentChartOptions = computed(() => ({
  chart: {
    type: 'donut' as const,
    fontFamily: 'Inter, sans-serif',
    toolbar: { show: false },
    animations: {
      enabled: true,
      easing: 'easeinout' as const,
      speed: 800,
    }
  },
  labels: ['Bullish', 'Bearish', 'Neutral'],
  colors: ['#10b981', '#ef4444', '#6b7280'],
  legend: {
    position: 'bottom' as const,
    fontSize: '12px',
    fontWeight: 700,
    labels: { colors: '#9ca3af' }
  },
  dataLabels: {
    enabled: true,
    style: {
      fontSize: '14px',
      fontWeight: 'bold',
    }
  },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          name: { show: true, fontSize: '14px', fontWeight: 700 },
          value: { show: true, fontSize: '24px', fontWeight: 900 },
          total: {
            show: true,
            label: 'Total Articles',
            fontSize: '12px',
            fontWeight: 700,
            color: '#9ca3af',
            formatter: () => sentimentData.value?.total.toString() || '0'
          }
        }
      }
    }
  },
  tooltip: {
    theme: 'dark',
    y: {
      formatter: (val: number) => `${val} articles`
    }
  }
}));

const sentimentChartSeries = computed(() => {
  if (!sentimentData.value) return [0, 0, 0];
  const { bullish, bearish, neutral } = sentimentData.value.distribution;
  return [bullish, bearish, neutral];
});

const timelineChartOptions = computed(() => ({
  chart: {
    type: 'area' as const,
    fontFamily: 'Inter, sans-serif',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: {
      enabled: true,
      easing: 'easeinout' as const,
      speed: 800,
    }
  },
  dataLabels: { enabled: false },
  stroke: {
    curve: 'smooth' as const,
    width: 3
  },
  fill: {
    type: 'gradient',
    gradient: {
      opacityFrom: 0.6,
      opacityTo: 0.1,
    }
  },
  colors: ['#10b981', '#ef4444', '#6b7280'],
  xaxis: {
    categories: timelineData.value.map(t => t.date),
    labels: {
      style: { colors: '#9ca3af', fontSize: '10px', fontWeight: 700 }
    }
  },
  yaxis: {
    labels: {
      style: { colors: '#9ca3af', fontSize: '10px', fontWeight: 700 }
    }
  },
  legend: {
    position: 'top' as const,
    fontSize: '12px',
    fontWeight: 700,
    labels: { colors: '#9ca3af' }
  },
  grid: {
    borderColor: '#374151',
    strokeDashArray: 4
  },
  tooltip: {
    theme: 'dark',
    y: {
      formatter: (val: number) => `${val} articles`
    }
  }
}));

const timelineChartSeries = computed(() => [
  {
    name: 'Bullish',
    data: timelineData.value.map(t => t.bullish)
  },
  {
    name: 'Bearish',
    data: timelineData.value.map(t => t.bearish)
  },
  {
    name: 'Neutral',
    data: timelineData.value.map(t => t.neutral)
  }
]);

// Methods
const fetchAnalytics = async () => {
  loading.value = true;
  try {
    const params: Record<string, string> = {
      dateRange: dateRange.value
    };
    if (selectedCategory.value) params.category = selectedCategory.value;
    if (selectedSource.value) params.source = selectedSource.value;

    const [sentimentRes, topicsRes, timelineRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/analytics/sentiment`, { params }),
      axios.get(`${API_BASE_URL}/api/analytics/topics`, { params: { ...params, limit: 30 } }),
      axios.get(`${API_BASE_URL}/api/analytics/timeline`, { params })
    ]);

    sentimentData.value = sentimentRes.data.data;
    topicsData.value = topicsRes.data.data.topics;
    timelineData.value = timelineRes.data.data.timeline;
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
  } finally {
    loading.value = false;
  }
};

const exportData = () => {
  const data = {
    dateRange: dateRange.value,
    sentiment: sentimentData.value,
    topics: topicsData.value,
    timeline: timelineData.value,
    exportedAt: new Date().toISOString()
  };

  const blob = new window.Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kognit-analytics-${dateRange.value}-${Date.now()}.json`;
  a.click();
  window.URL.revokeObjectURL(url);
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'bullish': return 'text-success';
    case 'bearish': return 'text-danger';
    default: return 'text-text-muted';
  }
};

const getSentimentBg = (sentiment: string) => {
  switch (sentiment) {
    case 'bullish': return 'bg-success/10 border-success/30';
    case 'bearish': return 'bg-danger/10 border-danger/30';
    default: return 'bg-text-secondary/10 border-text-secondary/20';
  }
};

onMounted(() => {
  fetchAnalytics();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary p-6 sm:p-10">
    <!-- Header -->
    <div class="max-w-7xl mx-auto mb-10">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <div class="p-4 rounded-3xl bg-brand/20 border border-brand/30 shadow-lg">
            <BarChart3 class="h-8 w-8 text-brand" />
          </div>
          <div>
            <h1 class="text-3xl font-black tracking-tighter text-text-primary italic">Analytics Dashboard</h1>
            <p class="text-sm text-text-muted font-medium">Trend Analysis & Sentiment Intelligence</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="fetchAnalytics"
            class="p-3 rounded-2xl bg-brand/10 hover:bg-brand/20 border border-brand/20 hover:border-brand/40 transition-all group"
            :class="{ 'animate-spin': loading }"
          >
            <RefreshCw class="h-5 w-5 text-brand" />
          </button>
          <button
            @click="exportData"
            class="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand text-white shadow-lg hover:scale-105 transition-all font-black text-xs uppercase tracking-widest"
          >
            <Download class="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3 mb-8">
        <button
          v-for="range in ['today', 'week', 'month', 'all']"
          :key="range"
          @click="dateRange = range as any; fetchAnalytics();"
          :class="dateRange === range ? 'bg-brand text-white shadow-lg' : 'bg-bg-card text-text-muted hover:bg-brand/10'"
          class="px-5 py-2.5 rounded-xl border border-brand/20 text-xs font-black uppercase tracking-widest transition-all"
        >
          {{ range }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="max-w-7xl mx-auto flex items-center justify-center py-20">
      <div class="flex flex-col items-center gap-4">
        <RefreshCw class="h-12 w-12 text-brand animate-spin" />
        <p class="text-sm font-bold text-text-muted uppercase tracking-widest">Loading Analytics...</p>
      </div>
    </div>

    <!-- Dashboard Grid -->
    <div v-else class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Sentiment Distribution -->
      <div class="lg:col-span-1 bg-bg-card/95 backdrop-blur-sm border border-brand/10 rounded-[2.5rem] p-8 shadow-xl">
        <div class="flex items-center gap-3 mb-6 border-b border-brand/10 pb-4">
          <PieChart class="h-5 w-5 text-brand" />
          <h2 class="text-xs font-black uppercase tracking-[0.3em] text-brand">Sentiment Distribution</h2>
        </div>
        <VueApexCharts
          type="donut"
          :options="sentimentChartOptions"
          :series="sentimentChartSeries"
          height="300"
        />
      </div>

      <!-- Timeline -->
      <div class="lg:col-span-2 bg-bg-card/95 backdrop-blur-sm border border-brand/10 rounded-[2.5rem] p-8 shadow-xl">
        <div class="flex items-center gap-3 mb-6 border-b border-brand/10 pb-4">
          <Clock class="h-5 w-5 text-brand" />
          <h2 class="text-xs font-black uppercase tracking-[0.3em] text-brand">Sentiment Timeline</h2>
        </div>
        <VueApexCharts
          type="area"
          :options="timelineChartOptions"
          :series="timelineChartSeries"
          height="300"
        />
      </div>

      <!-- Hot Topics -->
      <div class="lg:col-span-3 bg-bg-card/95 backdrop-blur-sm border border-brand/10 rounded-[2.5rem] p-8 shadow-xl">
        <div class="flex items-center gap-3 mb-6 border-b border-brand/10 pb-4">
          <TrendingUp class="h-5 w-5 text-brand" />
          <h2 class="text-xs font-black uppercase tracking-[0.3em] text-brand">Hot Topics</h2>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div
            v-for="topic in topicsData.slice(0, 24)"
            :key="topic.keyword"
            :class="getSentimentBg(topic.sentiment)"
            class="flex flex-col items-center justify-center p-4 rounded-2xl border transition-all hover:scale-105 cursor-pointer"
          >
            <span :class="getSentimentColor(topic.sentiment)" class="text-sm font-black uppercase tracking-tight truncate max-w-full">
              {{ topic.keyword }}
            </span>
            <span class="text-[10px] font-bold text-text-muted mt-1">{{ topic.count }}</span>
          </div>
        </div>
      </div>

      <!-- Source Breakdown -->
      <div v-if="sentimentData" class="lg:col-span-3 bg-bg-card/95 backdrop-blur-sm border border-brand/10 rounded-[2.5rem] p-8 shadow-xl">
        <div class="flex items-center gap-3 mb-6 border-b border-brand/10 pb-4">
          <BarChart3 class="h-5 w-5 text-brand" />
          <h2 class="text-xs font-black uppercase tracking-[0.3em] text-brand">Source Breakdown</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(data, source) in sentimentData.bySource"
            :key="source"
            class="bg-bg-primary/50 border border-brand/5 rounded-2xl p-5"
          >
            <h3 class="text-xs font-black uppercase tracking-widest text-text-primary mb-3">{{ source }}</h3>
            <div class="flex items-center justify-between text-[10px] font-bold">
              <span class="text-success">🟢 {{ data.bullish }}</span>
              <span class="text-danger">🔴 {{ data.bearish }}</span>
              <span class="text-text-muted">⚪ {{ data.neutral }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-in {
  animation: fadeIn 0.5s ease-out;
}
</style>
