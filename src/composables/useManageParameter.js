import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useManageParameter = () => {
  // State
  const parameters = ref([])
  const totalItems = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalPages = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const formErrors = ref({})
  const actionLoading = ref(false)

  /**
   * Fetch parameters with pagination
   */
  const fetchParameters = async ({ page = 1, size = 10, query = '', sort = 'id', order = 'asc' }) => {
    loading.value = true
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/parameters/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Failed to fetch parameters')
      }

      const res = response.value

      if (res.success) {
        parameters.value = res.data ?? []
        totalItems.value = res.pagination.total_items
        currentPage.value = res.pagination.current_page
        pageSize.value = res.pagination.page_size
        totalPages.value = res.pagination.total_pages
      } else {
        throw new Error(res.message || 'Failed to fetch parameters')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch parameters:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new parameter
   */
  const createParameter = async parameterData => {
    actionLoading.value = true
    formErrors.value = {}
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi('/parameters')
        .post(parameterData)
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

        throw new Error(errorData.message || 'Failed to create parameter')
      }

      const res = response.value

      if (res.success) {
        return { success: true, data: res.data }
      } else {
        throw new Error(res.message || 'Failed to create parameter')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to create parameter:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Update existing parameter
   */
  const updateParameter = async (parameterId, parameterData) => {
    actionLoading.value = true
    formErrors.value = {}
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(`/parameters/${parameterId}`)
        .put(parameterData)
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

        throw new Error(errorData.message || 'Failed to update parameter')
      }

      const res = response.value

      if (res.success) {
        return { success: true, data: res.data }
      } else {
        throw new Error(res.message || 'Failed to update parameter')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to update parameter:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Delete parameter
   */
  const deleteParameter = async (parameterId, reason = '') => {
    actionLoading.value = true
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(`/parameters/${parameterId}`)
        .delete({ description: reason })
        .json()

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Failed to delete parameter')
      }

      const res = response.value

      if (res.success) {
        return { success: true, message: res.message }
      } else {
        throw new Error(res.message || 'Failed to delete parameter')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to delete parameter:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Save parameter (create or update)
   */
  const saveParameter = async parameterData => {
    const isUpdate = Boolean(parameterData.id)

    if (isUpdate) {
      const parameterId = parameterData.id

      // Remove id from parameterData untuk update
      const { id, ...updateData } = parameterData

      return await updateParameter(parameterId, updateData)
    } else {
      return await createParameter(parameterData)
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
    parameters,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    loading,
    actionLoading,
    error,
    formErrors,

    // Methods
    fetchParameters,
    createParameter,
    updateParameter,
    deleteParameter,
    saveParameter,
    clearFormErrors,
    clearErrors,
  }
}
