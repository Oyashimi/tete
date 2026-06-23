import { createRouter, createWebHistory } from "vue-router";
import Home from "./pages/Home.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: Home },
    {
      // ログイン後の入口：自分のスペース一覧
      path: "/spaces",
      name: "spaces",
      component: () => import("./pages/Spaces.vue"),
    },
    {
      // スペース内：下部タブで各タブを切り替える共通レイアウト
      path: "/space/:id",
      component: () => import("./layouts/SpaceLayout.vue"),
      children: [
        { path: "", name: "space", component: () => import("./pages/space/SpaceHome.vue") },
        {
          path: "calendar",
          name: "space-calendar",
          component: () => import("./pages/space/SpaceCalendar.vue"),
        },
        {
          path: "anniversary",
          name: "space-anniversary",
          component: () => import("./pages/space/SpaceAnniversary.vue"),
        },
        {
          path: "personal",
          name: "space-personal",
          component: () => import("./pages/space/SpacePersonal.vue"),
        },
        {
          path: "settings",
          name: "space-settings",
          component: () => import("./pages/space/SpaceSettings.vue"),
        },
      ],
    },
  ],
});
