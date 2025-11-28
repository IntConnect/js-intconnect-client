import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useManageRole = () => {
  const roles = ref([])
  const loading = ref(false)
  const actionLoading = ref(false)
  const formErrors = ref({})
  const error = ref(null)

  const fetchRoles = async () => {
    loading.value = true

    try {
      const { data: response } = await useApi(createUrl('/roles', {}))
        .get()
        .json()


      const res = response.value

      roles.value = res.data ?? []
      loading.value = false
    } catch (err) {
      console.error('Failed to fetch roles:', err)
    }
  }

  const saveRole = async roleData => {
    const isUpdate = Boolean(roleData.id)

    if (isUpdate) {
      const roleId = roleData.id

      // Remove id from roleData untuk update
      const { id, ...updateData } = roleData

      return await updateRole(roleId, updateData)
    } else {
      return await createRole(roleData)
    }
  }

  /**
   * Create new role
   */
  const createRole = async roleData => {
    actionLoading.value = true
    formErrors.value = {}
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi('/roles')
        .post(roleData)
        .json()

      console.log(error, response)

      if (apiError.value) {
        const errorData = apiError.value

        // Handle validation errors (422)
        if (errorData.status === 422) {
          if (errorData.error?.details) {
            // Backend format: { error: { details: { field: "message" } } }
            formErrors.value = errorData.error.details
          } else if (errorData.errors) {
            // Alternative format: { errors: { field: ["message"] } }
            formErrors.value = errorData.errors
          }

          return { success: false, errors: formErrors.value }
        }

        throw new Error(errorData.message || 'Failed to create role')
      }

      const res = response.value

      if (res.success) {
        return { success: true, data: res.data }
      } else {
        throw new Error(res.message || 'Failed to create role')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to create role:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Update existing role
   */
  const updateRole = async (roleId, roleData) => {
    actionLoading.value = true
    formErrors.value = {}
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(`/roles/${roleId}`)
        .put(roleData)
        .json()

      if (apiError.value) {
        const errorData = apiError.value

        // Handle validation errors (422)
        if (errorData.status === 422) {
          if (errorData.error?.details) {
            formErrors.value = errorData.error.details
          } else if (errorData.errors) {
            formErrors.value = errorData.errors
          }

          return { success: false, errors: formErrors.value }
        }

        throw new Error(errorData.message || 'Failed to update role')
      }

      const res = response.value

      if (res.success) {
        return { success: true, data: res.data }
      } else {
        throw new Error(res.message || 'Failed to update role')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to update role:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Delete role
   */
  const deleteRole = async (roleId, reason = '') => {
    actionLoading.value = true
    error.value = null

    try {
      console.log(reason)

      const { data: response, error: apiError } = await useApi(`/roles/${roleId}`)
        .delete({ description: reason })
        .json()

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Failed to delete role')
      }

      const res = response.value

      if (res.success) {
        return { success: true, message: res.message }
      } else {
        throw new Error(res.message || 'Failed to delete role')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to delete role:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }


  /**
   * Clear form errors
   */
  const clearFormErrors = () => {
    formErrors.value = {}
  }

  return {
    roles,
    loading,
    fetchRoles,
    saveRole,
    createRole,
    updateRole,
    deleteRole,
    clearFormErrors,
  }
}
