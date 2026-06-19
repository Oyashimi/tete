import { createRouter, createWebHistory } from "vue-router";
import Home from "./pages/Home.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: Home },
    {
      path: "/space/:id",
      name: "space",
      component: () => import("./pages/Space.vue"),
    },
  ],
});
