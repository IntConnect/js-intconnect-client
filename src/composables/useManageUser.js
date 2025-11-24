import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useManageUser = () => {
  // State
  const users = ref([])
  const totalItems = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalPages = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const formErrors = ref({})
  const actionLoading = ref(false)

  /**
   * Fetch users with pagination
   */
  const fetchUsers = async ({ page = 1, size = 10, query = '', sort = 'id', order = 'asc' }) => {
    loading.value = true
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/users/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Failed to fetch users')
      }

      const res = response.value

      if (res.success) {
        users.value = res.data ?? []
        totalItems.value = res.pagination.total_items
        currentPage.value = res.pagination.current_page
        pageSize.value = res.pagination.page_size
        totalPages.value = res.pagination.total_pages
      } else {
        throw new Error(res.message || 'Failed to fetch users')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch users:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new user
   */
  const createUser = async userData => {
    actionLoading.value = true
    formErrors.value = {}
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi('/users')
        .post(userData)
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

        throw new Error(errorData.message || 'Failed to create user')
      }

      const res = response.value

      if (res.success) {
        return { success: true, data: res.data }
      } else {
        throw new Error(res.message || 'Failed to create user')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to create user:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Update existing user
   */
  const updateUser = async (userId, userData) => {
    actionLoading.value = true
    formErrors.value = {}
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(`/users/${userId}`)
        .put(userData)
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

        throw new Error(errorData.message || 'Failed to update user')
      }

      const res = response.value

      if (res.success) {
        return { success: true, data: res.data }
      } else {
        throw new Error(res.message || 'Failed to update user')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to update user:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Delete user
   */
  const deleteUser = async (userId, reason = '') => {
    actionLoading.value = true
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(`/users/${userId}`)
        .delete({ description: reason })
        .json()

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Failed to delete user')
      }

      const res = response.value

      if (res.success) {
        return { success: true, message: res.message }
      } else {
        throw new Error(res.message || 'Failed to delete user')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to delete user:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Save user (create or update)
   */
  const saveUser = async userData => {
    const isUpdate = Boolean(userData.id)

    if (isUpdate) {
      const userId = userData.id

      // Remove id from userData untuk update
      const { id, ...updateData } = userData

      return await updateUser(userId, updateData)
    } else {
      return await createUser(userData)
    }
  }

  /**
   * Clear form errors
   */
  const clearFormErrors = () => {
    formErrors.value = {}
  }

  /**
   * Clear all errors
   */
  const clearErrors = () => {
    error.value = null
    formErrors.value = {}
  }

  return {
    // State
    users,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    loading,
    actionLoading,
    error,
    formErrors,

    // Methods
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    saveUser,
    clearFormErrors,
    clearErrors,
  }
}
