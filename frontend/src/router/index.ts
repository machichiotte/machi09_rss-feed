// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import AnalyticsDashboard from '../views/AnalyticsDashboard.vue';
import HomeView from '../views/HomeView.vue';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Home',
        component: HomeView,
        meta: { title: 'Kognit - Premium RSS Reader' }
    },
    {
        path: '/analytics',
        name: 'Analytics',
        component: AnalyticsDashboard,
        meta: { title: 'Analytics Dashboard - Kognit' }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, _from, next) => {
    document.title = (to.meta.title as string) || 'Kognit - Premium RSS Reader';
    next();
});

export default router;
