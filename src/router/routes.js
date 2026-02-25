const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      { path: "", component: () => import("pages/IndexPage.vue") },
      { path: "shop", component: () => import("pages/ShopPage.vue") },
      { path: "profile", component: () => import("pages/ProfilePage.vue") },
      { path: "ranking", component: () => import("pages/RankingPage.vue") },
    ],
  },
  {
    path: "/login",
    component: () => import("layouts/AuthLayout.vue"),
    children: [{ path: "", component: () => import("pages/LoginPage.vue") }],
  },
  {
    path: "/reset-password",
    component: () => import("layouts/AuthLayout.vue"),
    children: [{ path: "", component: () => import("pages/ResetPasswordPage.vue") }],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes
