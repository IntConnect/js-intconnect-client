import { ref } from 'vue'
import { toast } from 'vue3-toastify'

export const useManageRole = () => {
  const roles = ref([])
  const formErrors = ref({})
  const selectedRole = ref(null)
  const roleDetail = ref(null)
  const isAddRoleDialogVisible = ref(false)
  const showDeleteDialog = ref(false)

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const { data: response } = await useApi(`/roles`).get().json()

      roles.value = response.value.data
    } catch (err) {
      console.error('Failed to fetch roles:', err)
    }
  }

  // Save / Update role
  const saveRole = async payload => {
    try {
      const { data: response } = await useApi(`/roles`)
        .post(payload)
        .json()

      toast.success('Permission successfully changed! Please login again to take effects')
      fetchRoles()
    } catch (err) {
      console.error('❌ Failed to save role:', err)
    }
  }

  // Open delete dialog
  const openDeleteDialog = role => {
    selectedRole.value = role
    showDeleteDialog.value = true
  }

  // Delete role
  const deleteRole = async description => {
    try {
      if (!selectedRole.value?.id) {
        toast.error('Pick a data first')

        return
      }

      await useApi(`/roles/${selectedRole.value.id}`)
        .delete({ description })
        .json()

      toast.success('Role successfully deleted')
      fetchRoles()
    } catch (err) {
      console.error('Failed to delete role:', err)
    }
  }

  // Open edit modal
  const editPermission = role => {
    roleDetail.value = role
    isAddRoleDialogVisible.value = true
  }

  return {
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
  }
}
