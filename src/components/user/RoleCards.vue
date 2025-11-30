<script setup>
import girlUsingMobile from '@images/pages/girl-using-mobile.png'
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import ManageRoleDialog from "@/components/role/ManageRoleDialog.vue"

const {
  roles,
  loading,
  fetchRoles,
  saveRole,
  createRole,
  updateRole,
  deleteRole,
  clearFormErrors,
} = useManageRole()


const selectedRole = ref(null)
const isManageRoleDrawerVisible = ref(false)
const showDeleteDialog = ref(false)


const loadRoles = async () => {
  await fetchRoles()
}


/**
 * Open drawer for adding new role
 */
const openAddRoleDialog = () => {
  selectedRole.value = null
  clearFormErrors()
  isManageRoleDrawerVisible.value = true
}

/**
 * Close add/edit drawer
 */
const closeAddRoleDialog = () => {
  isManageRoleDrawerVisible.value = false
  selectedRole.value = null
  clearFormErrors()
}


/**
 * Open drawer for adding new role
 */

/**
 * Close add/edit drawer
 */


/**
 * Open drawer for editing role
 */
const handleEdit = role => {
  selectedRole.value = { ...role }
  clearFormErrors()
  isManageRoleDrawerVisible.value = true
}

/**
 * Open delete confirmation dialog
 */
const openDeleteDialog = role => {
  selectedRole.value = role
  showDeleteDialog.value = true
}

/**
 * Close delete dialog
 */
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedRole.value = null
}

/**
 * Handle save role (create or update)
 */
const handleSaveRole = async roleData => {
  const result = await saveRole(roleData)

  if (result.success) {
    closeAddRoleDrawer()
    await loadRoles()

    // Optional: Show success notification
  } else {
    // Errors sudah di-set di formErrors oleh composable
    console.error('Failed to save role:', result.error || result.errors)
  }
}

/**
 * Handle delete role
 */
const handleDeleteRole = async formData => {
  if (!selectedRole.value?.id) {
    console.warn('No role selected for deletion')

    return
  }

  const reason = formData.reason || ''
  const result = await deleteRole(selectedRole.value.id, reason)

  if (result.success) {
    closeDeleteDialog()
    await loadRoles()

    // Optional: Show success notification
  } else {
    console.error('Failed to delete role:', result.error)

    // Optional: Show error notification
  }
}

onMounted(() => {
  loadRoles()
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
            Total {{ item.roles?.length }} roles
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
                @click="openAddRoleDialog"
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

  <ManageRoleDialog
    v-model:is-dialog-visible="isManageRoleDrawerVisible"
    v-model:role-permissions="selectedRole"
    @submit="saveRole"
  />
  <DeleteDialog
    v-model="showDeleteDialog"
    :fields="[{ key: 'reason', label: 'Reason', placeholder: 'Type your reason...', type: 'text' }]"
    message="Tell a reason why?"
    title="Delete Role"
    @submit="deleteRole(selectedRole.id, $event)"
  />
</template>
