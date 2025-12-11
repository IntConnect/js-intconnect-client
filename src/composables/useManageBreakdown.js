import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useManageBreakdown = () => {
  // --------------------
  // State
  // --------------------
  const breakdowns = ref([])
  const breakdown = ref({})
  const breakdownDependency = ref({})
  const totalItems = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalPages = ref(0)

  const errorMessage = ref(null)
  const formErrors = ref({})
  const actionLoading = ref(false)


  const clearFormErrors = () => (formErrors.value = {})

  const clearErrors = () => {
    errorMessage.value = null
    formErrors.value = {}
  }

  // --------------------
  // Main API Methods
  // --------------------

  const fetchBreakdownsPagination = async ({ page = 1, size = 10, query = '', sort = 'id', order = 'asc' }) => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/breakdowns/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      applyPaginationResponse(
        {
          entries: breakdowns,
          totalItems,
          currentPage,
          pageSize,
          totalPages,
        },
        response.value,
      )
      console.log(response)
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchBreakdowns = async () => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/breakdowns', {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      breakdowns.value = response.value
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchBreakdown = async id => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl(`/breakdowns/${id}`, {}),
      )
        .get()
        .json()

      console.log(response)

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      breakdown.value = response.value
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchBreakdownDependency = async () => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/breakdowns/create', {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      breakdownDependency.value = response.value
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const createBreakdown = async breakdownData => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi('/breakdowns')
        .post(breakdownData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result


      applyPaginationResponse(
        {
          entries: breakdowns,
          totalItems,
          currentPage,
          pageSize,
          totalPages,
        },
        response.value,
      )

      return { success: true }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const updateBreakdown = async (breakdownId, breakdownData) => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/breakdowns/${breakdownId}`)
        .put(breakdownData)
        .json()


      const result = handleApiError(apiError, { formErrors, errorMessage })

      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: breakdowns,
          totalItems,
          currentPage,
          pageSize,
          totalPages,
        },
        response.value,
      )

      return { success: true }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const deleteBreakdown = async (breakdownId, reason = '') => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/breakdowns/${breakdownId}`)
        .delete({ reason })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: breakdowns,
          totalItems,
          currentPage,
          pageSize,
          totalPages,
        },
        response.value,
      )

      return { success: true }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const saveBreakdown = async breakdownData => {
    if (breakdownData.id) {
      const { id, ...payload } = breakdownData

      return updateBreakdown(id, payload)
    }

    return createBreakdown(breakdownData)
  }

  return {
    breakdown,
    breakdowns,
    breakdownDependency,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchBreakdowns,
    fetchBreakdown,
    fetchBreakdownsPagination,
    fetchBreakdownDependency,
    createBreakdown,
    updateBreakdown,
    deleteBreakdown,
    saveBreakdown,
    clearFormErrors,
    clearErrors,
  }
}

