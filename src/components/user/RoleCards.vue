<script setup>
import girlUsingMobile from '@images/pages/girl-using-mobile.png'
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import AddEditRoleDialog from "@/components/general/AddEditRoleDialog.vue"


const isRoleDialogVisible = ref(false)
const roleDetail = ref()
const isAddRoleDialogVisible = ref(false)
const roles = ref([])
const formErrors = ref({})

async function fetchRoles() {
  try {
    roles.value = await $api(`/roles`, { method: 'GET' })
  } catch (err) {
    console.error('Failed to fetch users:', err)
  }
}

const showDeleteDialog = ref(false)
const selectedRole = ref(null)

const openDeleteDialog = (paramSelectedRole) => {
  selectedRole.value = paramSelectedRole
  showDeleteDialog.value = true
}

const saveRole = async payload => {
  try {

    const response = await $api('/permissions/relation', {
      method: 'POST',
      body: payload,
    })

    toast.success('Permission succesfully changed!, please login again to take effects')

  } catch (err) {
    console.error('❌ Failed to save role relation:', err)
  }
}

onMounted(() => {
  fetchRoles()
})

const editPermission = value => {

  isRoleDialogVisible.value = true
  roleDetail.value = value
}

async function deleteRole(description) {
  try {
    if (selectedRole.value.id === null) {
      toast.error('Pick a data first')
    }
    await $api(`/roles/${selectedRole.value.id}`, {
      method: 'DELETE',
      body: { description },
    })
    fetchRoles()
    toast.success('Role successfully deleted')
  } catch (err) {
    processApiError(err, formErrors)
  }
}
</script>

<template>
  <VRow>
    <!-- 👉 Roles -->
    <VCol
      v-for="item in roles"
      :key="item.id"
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard>
        <VCardText class="d-flex align-center pb-4">
          <div class="text-body-1">
            Total {{ item.users?.length }} users
          </div>

          <VSpacer/>

        </VCardText>

        <VCardText>
          <div class="d-flex justify-space-between align-center">
            <div>
              <h5 class="text-h5">
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
              <VIcon icon="tabler-trash"/>
            </IconBtn>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Add New Role -->
    <VCol
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard
        class="h-100"
        :ripple="false"
      >
        <VRow
          no-gutters
          class="h-100"
        >
          <VCol
            cols="5"
            class="d-flex flex-column justify-end align-center mt-5"
          >
            <img
              width="85"
              :src="girlUsingMobile"
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
      <AddEditRoleDialog v-model:is-dialog-visible="isAddRoleDialogVisible"/>
    </VCol>
  </VRow>

  <AddEditRoleDialog
    v-model:is-dialog-visible="isRoleDialogVisible"
    v-model:role-permissions="roleDetail"
    @update:role-permissions="saveRole"
  />
  <DeleteDialog
    v-model="showDeleteDialog"
    title="Delete Role"
    message="Tell a reason why?"
    :fields="[{ key: 'reason', label: 'Reason', placeholder: 'Type your reason...', type: 'text' }]"
    @submit="deleteRole"
  />
</template>
