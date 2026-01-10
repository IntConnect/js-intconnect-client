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
];
