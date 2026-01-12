<script setup>
import ManageRoleDialog from "@/components/dialogs/ManageRoleDialog.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import girlUsingMobile from '@images/pages/girl-using-mobile.png'

const {
  roles,
  loading,
  fetchRoles,
  saveRole,
  createRole,
  updateRole,
  deleteRole,
  formErrors,
  clearFormErrors,
} = useManageRole()


const selectedRole = ref(null)
const isManageRoleDrawerVisible = ref(false)
const showDeleteDialog = ref(false)
const showAlertDialog = ref(false)
const titleAlert = ref('')
const bodyAlert = ref('')
const alertType = ref('info')

const loadRoles = async () => {
  await fetchRoles()
  await nextTick()
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
  console.log("EXECUTED")
  showDeleteDialog.value = false
  selectedRole.value = null
}

/**
 * Handle save role (create or update)
 */
const handleSaveRole = async roleData => {
  const result = await saveRole(roleData)

  if (result.success) {
    closeAddRoleDialog()
    showAlertDialog.value = true
    titleAlert.value = 'Action success'
    bodyAlert.value = 'Role has been saved'
  } else {
    showAlertDialog.value = true
    titleAlert.value = 'Action failed'
    bodyAlert.value = 'Role failed to be saved'
    alertType.value = 'error'
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

  const result = await deleteRole(selectedRole.value.id, formData)
  console.log(result)
  if (result.success) {
    closeDeleteDialog()
    showAlertDialog.value = true
    titleAlert.value = 'Action success'
    bodyAlert.value = 'Role has been deleted'
  } else {
    showAlertDialog.value = true
    titleAlert.value = 'Action failed'
    bodyAlert.value = 'Role failed to be deleted'
    alertType.value = 'error'
  }
}

onMounted(() => {
  loadRoles()
})
</script>


<template>
  <VRow>
    <template v-if="loading">
      <VCol v-for="n in 6" :key="n" cols="12" lg="4" sm="6">
        <VSkeletonLoader type="card" />
      </VCol>
    </template>
    <template v-else>
      <VCol v-for="item in roles.entries" :key="item.id" cols="12" lg="4" sm="6">
        <VCard>
          <VCardText class="d-flex align-center pb-4">
            <div class="text-body-1">
              Has {{ item.permissions.length }} permissions
            </div>

            <VSpacer />
          </VCardText>

          <VCardText>
            <div class="d-flex justify-space-between align-center">
              <div>
                <h5 class="text-h5">
                  {{ item.name }}
                </h5>
                <div class="d-flex align-center">
                  <a href="javascript:void(0)" @click="handleEdit(item)">
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
      <VCol cols="12" lg="4" sm="6">
        <VCard :ripple="false" class="h-100">
          <VRow class="h-100" no-gutters>
            <VCol class="d-flex flex-column justify-end align-center mt-5" cols="5">
              <img :src="girlUsingMobile" width="85">
            </VCol>

            <VCol cols="7">
              <VCardText class="d-flex flex-column align-end justify-end gap-4">
                <VBtn size="small" @click="openAddRoleDialog">
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
    </template>
  </VRow>

  <ManageRoleDialog v-model:is-dialog-visible="isManageRoleDrawerVisible" v-model:role-permissions="selectedRole"
    @submit="handleSaveRole" />
  <DeleteDialog v-model="showDeleteDialog"
    :fields="[{ key: 'reason', label: 'Reason', placeholder: 'Type your reason...', type: 'text', }]"
    message="Tell a reason why?" title="Delete Role" :formErrors="formErrors" @submit="handleDeleteRole" />
  <AlertDialog v-model:is-dialog-visible="showAlertDialog" :body-alert="bodyAlert" :title-alert="titleAlert"
    :type="alertType" />
</template>
