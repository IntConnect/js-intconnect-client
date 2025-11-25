import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useManageMachine = () => {
  // State
  const machines = ref([])
  const totalItems = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalPages = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const formErrors = ref({})
  const actionLoading = ref(false)


  /**
   * Fetch machines with pagination
   */
  const fetchMachinesPagination = async ({ page = 1, size = 10, query = '', sort = 'id', order = 'asc' }) => {
    loading.value = true
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/machines/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Failed to fetch machines')
      }

      const res = response.value

      console.log(res)
      if (res.success) {
        machines.value = res.data ?? []
        totalItems.value = res.pagination.total_items
        currentPage.value = res.pagination.current_page
        pageSize.value = res.pagination.page_size
        totalPages.value = res.pagination.total_pages
      } else {
        throw new Error(res.message || 'Failed to fetch machines')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch machines:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch machines with pagination
   */
  const fetchMachines = async () => {
    loading.value = true
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/machines', {}),
      )
        .get()
        .json()

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Failed to fetch machines')
      }

      const res = response.value

      console.log(res)
      if (res.status) {
        machines.value = res.data ?? []
      } else {
        throw new Error(res.message || 'Failed to fetch machines')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch machines:', err)
    } finally {
      loading.value = false
    }
  }


  /**
   * Create new machine
   */
  const createMachine = async machineData => {
    actionLoading.value = true
    formErrors.value = {}
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi('/machines')
        .post(machineData)
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

        throw new Error(errorData.message || 'Failed to create machine')
      }

      const res = response.value

      if (res.success) {
        return { success: true, data: res.data }
      } else {
        throw new Error(res.message || 'Failed to create machine')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to create machine:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Update existing machine
   */
  const updateMachine = async (machineId, machineData) => {
    actionLoading.value = true
    formErrors.value = {}
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(`/machines/${machineId}`)
        .put(machineData)
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

        throw new Error(errorData.message || 'Failed to update machine')
      }

      const res = response.value

      if (res.success) {
        return { success: true, data: res.data }
      } else {
        throw new Error(res.message || 'Failed to update machine')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to update machine:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Delete machine
   */
  const deleteMachine = async (machineId, reason = '') => {
    actionLoading.value = true
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(`/machines/${machineId}`)
        .delete({ description: reason })
        .json()

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Failed to delete machine')
      }

      const res = response.value

      if (res.success) {
        return { success: true, message: res.message }
      } else {
        throw new Error(res.message || 'Failed to delete machine')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to delete machine:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Save machine (create or update)
   */
  const saveMachine = async machineData => {
    const isUpdate = Boolean(machineData.id)

    if (isUpdate) {
      const machineId = machineData.id

      // Remove id from machineData untuk update
      const { id, ...updateData } = machineData

      return await updateMachine(machineId, updateData)
    } else {
      return await createMachine(machineData)
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
    machines,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    loading,
    actionLoading,
    error,
    formErrors,

    // Methods
    fetchMachinesPagination,
    fetchMachines,
    createMachine,
    updateMachine,
    deleteMachine,
    saveMachine,
    clearFormErrors,
    clearErrors,
  }
}
