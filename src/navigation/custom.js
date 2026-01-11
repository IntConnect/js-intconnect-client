export default [
  {
    path: "/facilities/create",
    name: "facility-create",
    component: () => import("@/pages/facilities/manage/[id].vue"),
    meta: {
      layout: "default",

      requiresAuth: true,
      requiredPermission: "FACILITY_CREATE", // optional
    },
  },
  {
    path: "/facilities/:id/edit",
    name: "facility-edit",
    component: () => import("@/pages/facilities/manage/[id].vue"),
    meta: {
      layout: "default",
      requiresAuth: true,
      requiredPermission: "FACILITY_EDIT", // optional
    },
  },
  {
    path: "/machines/create",
    name: "machine-create",
    component: () => import("@/pages/machines/manage/[id].vue"),
    meta: {
      layout: "default",

      requiresAuth: true,
      requiredPermission: "FACILITY_CREATE", // optional
    },
  },
  {
    path: "/machines/:id/edit",
    name: "machine-edit",
    component: () => import("@/pages/machines/manage/[id].vue"),
    meta: {
      layout: "default",
      requiresAuth: true,
      requiredPermission: "FACILITY_EDIT", // optional
    },
  },
  {
    path: "/parameters/create",
    name: "parameter-create",
    component: () => import("@/pages/parameters/manage/[id].vue"),
    meta: {
      layout: "default",

      requiresAuth: true,
      requiredPermission: "FACILITY_CREATE", // optional
    },
  },
  {
    path: "/parameters/:id/edit",
    name: "parameter-edit",
    component: () => import("@/pages/parameters/manage/[id].vue"),
    meta: {
      layout: "default",
      requiresAuth: true,
      requiredPermission: "FACILITY_EDIT", // optional
    },
  },
];
