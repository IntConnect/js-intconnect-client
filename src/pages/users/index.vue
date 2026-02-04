<script setup lang="ts">
import RoleCards from "@/components/user/RoleCards.vue"
import UserList from "@/components/user/UserList.vue"
</script>

<template>
  <VRow>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        Roles List
      </h4>
      <p class="text-body-1 mb-0">
        A role provided access to predefined menus and features so that depending on assigned role an administrator can
        have access to what he need
      </p>
    </VCol>

    <!-- 👉 Roles Cards -->
    <VCol cols="12">
      <RoleCards />
    </VCol>

    <VCol cols="12">
      <h4 class="text-h4 mb-1 mt-6">
        Total users with their roles
      </h4>
      <p class="text-body-1 mb-0">
View all users and their assigned roles within the system      </p>
    </VCol>

    <VCol cols="12">
      <!-- 👉 User List  -->
      <UserList />
    </VCol>
  </VRow>
</template>
