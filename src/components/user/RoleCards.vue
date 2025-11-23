<script setup>
import girlUsingMobile from '@images/pages/girl-using-mobile.png'
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import AddEditRoleDialog from "@/components/general/AddEditRoleDialog.vue"

const {
  roles,
  roleDetail,
  selectedRole,
  formErrors,
  isAddRoleDialogVisible,
  showDeleteDialog,

  fetchRoles,
  saveRole,
  deleteRole,
  openDeleteDialog,
  editPermission,
} = useRole()

onMounted(() => {
  fetchRoles()
})
</script>


<template>
  <VRow>
    <VCol
      v-for="item in roles"
      :key="item.id"
      cols="12"
      lg="4"
      sm="6"
    >
      <VCard>
        <VCardText class="d-flex align-center pb-4">
          <div class="text-body-1">
            Total {{ item.users?.length }} users
          </div>

          <VSpacer />
        </VCardText>

        <VCardText>
          <div class="d-flex justify-space-between align-center">
            <div>
              <h5 class="text-h4">
                {{ item.name }}
              </h5>
              <div class="d-flex align-center">
                <a
                  href="javascript:void(0)"
                  @click="editPermission(item)"
                >
                  Edit Role
                </a>
              </div>
            </div>
            <IconBtn @click="openDeleteDialog(item)">
              <VIcon icon="tabler-trash" />
            </IconBtn>
          </div>
        </VCardText>
      </VCard>
    </VCol>
    <!-- 👉 Add New Role -->
    <VCol
      cols="12"
      lg="4"
      sm="6"
    >
      <VCard
        :ripple="false"
        class="h-100"
      >
        <VRow
          class="h-100"
          no-gutters
        >
          <VCol
            class="d-flex flex-column justify-end align-center mt-5"
            cols="5"
          >
            <img
              :src="girlUsingMobile"
              width="85"
            >
          </VCol>

          <VCol cols="7">
            <VCardText class="d-flex flex-column align-end justify-end gap-4">
              <VBtn
                size="small"
                @click="isAddRoleDialogVisible = true"
              >
                Add New Role
              </VBtn>
              <div class="text-end">
                Add new role,<br> if it doesn't exist.
              </div>
            </VCardText>
          </VCol>
        </VRow>
      </VCard>
    </VCol>
  </VRow>

  <AddEditRoleDialog
    v-model:is-dialog-visible="isAddRoleDialogVisible"
    v-model:role-permissions="roleDetail"
    @submit="saveRole"
  />
  <DeleteDialog
    v-model="showDeleteDialog"
    :fields="[{ key: 'reason', label: 'Reason', placeholder: 'Type your reason...', type: 'text' }]"
    message="Tell a reason why?"
    title="Delete Role"
    @submit="deleteRole"
  />
</template>
