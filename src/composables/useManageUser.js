import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useManageUser = () => {
  // State
  const users = ref([])
  const totalItems = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalPages = ref(0)
  const errorMessage = ref(null)
  const formErrors = ref({})
  const actionLoading = ref(false)

  /**
   * Fetch users with pagination
   */
  const fetchUsers = async ({ page = 1, size = 10, query = '', sort = 'id', order = 'asc' }) => {
    clearErrors()

    try {
      const { data: response, error: apiError } = await useApi(createUrl('/users/pagination', {
        query: { page, size, query, sort, order },
      }))
        .get()
        .json()


      const result = handleApiError(apiError, { formErrors, errorMessage })

      if (!result.success) return result

      const res = response.value

      users.value = res.entries ?? []
      totalItems.value = res.pagination.total_items
      currentPage.value = res.pagination.current_page
      pageSize.value = res.pagination.page_size
      totalPages.value = res.pagination.total_pages
    } catch (err) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Create new user
   */
  const createUser = async userData => {
    actionLoading.value = true
    clearFormErrors()
    try {
      const { data: response, error: apiError } = await useApi('/users')
        .post(userData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })

      if (!result.success) return result

      const res = response.value

      users.value = res.entries ?? []
      totalItems.value = res.pagination.total_items
      currentPage.value = res.pagination.current_page
      pageSize.value = res.pagination.page_size
      totalPages.value = res.pagination.total_pages

      return {
        success: true,
      }

    } catch (err) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Update existing user
   */
  const updateUser = async (userId, userData) => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/users/${userId}`)
        .put(userData)
        .json()


      const result = handleApiError(apiError, { formErrors, errorMessage })

      if (!result.success) return result

      const res = response.value

      users.value = res.entries ?? []
      totalItems.value = res.pagination.total_items
      currentPage.value = res.pagination.current_page
      pageSize.value = res.pagination.page_size
      totalPages.value = res.pagination.total_pages

      return {
        success: true,
      }
    } catch (err) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Delete user
   */
  const deleteUser = async (userId, reason = '') => {
    actionLoading.value = true
    clearFormErrors()
    console.log(reason)
    try {
      const { data: response, error: apiError } = await useApi(`/users/${userId}`)
        .delete({ reason: reason })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })

      if (!result.success) return result

      const res = response.value

      users.value = res.entries ?? []
      totalItems.value = res.pagination.total_items
      currentPage.value = res.pagination.current_page
      pageSize.value = res.pagination.page_size
      totalPages.value = res.pagination.total_pages

      return {
        success: true,
      }
    } catch (err) {
      return { success: false, error: "Unknown error" }
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
    errorMessage.value = null
    formErrors.value = {}
  }

  return {
    // State
    users, totalItems, currentPage, pageSize, totalPages, actionLoading, errorMessage, formErrors,

    // Methods
    fetchUsers, createUser, updateUser, deleteUser, saveUser, clearFormErrors, clearErrors,
  }
}
