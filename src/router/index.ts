import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "init",
    component: () => import("@/views/Init.vue"),
  },
  {
    path: "/bookdetailed",
    name: "bookdetailed",
    component: () => import("@/views/Book.vue"),
  },
  {
    path: "/bookaccount",
    name: "bookaccount",
    component: () => import("@/views/Account.vue"),
  },
  {
    path: "/bookmanage",
    name: "bookmanage",
    component: () => import("@/views/Manage.vue"),
  },
  {
    path: "/bookanalysis",
    name: "bookanalysis",
    component: () => import("@/views/Analysis.vue"),
  },
  {
    path: "/newdiary",
    name: "newdiary",
    component: () => import("@/views/NewDiary.vue"),
  },
  {
    path: "/listdiary",
    name: "listdiary",
    component: () => import("@/views/ListDiary.vue"),
  },
  {
    path: "/goal",
    name: "goal",
    component: () => import("@/views/Goal.vue"),
  },
  {
    path: "/schedule",
    name: "schedule",
    component: () => import("@/views/Schedule.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
