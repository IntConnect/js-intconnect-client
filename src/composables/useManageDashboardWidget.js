import { useApi } from '@/composables/useApi'
import { ref } from 'vue'

export const useManageDashboardWidget = () => {
  // --------------------
  // State
  // --------------------
  const dashboardWidget = ref({})
  const dashboardWidgets = ref([])
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

  const fetchDashboardWidgets = async ({ page = 1, size = 10, query = '', sort = 'id', order = 'asc' }) => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/dashboard-widgets/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: dashboardWidgets,
          totalItems,
          currentPage,
          pageSize,
          totalPages,
        },
        response.value,
      )
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchDashboardWidget = async id => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl(`/dashboard-widgets/${id}`, {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      dashboardWidget.value = response.value

      return {
        success: true,
      }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }



  const createDashboardWidget = async dashboardWidgetData => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/machines/dashboard/${dashboardWidgetData.machine_id}`)
        .post(dashboardWidgetData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })

      console.log(result)

      if (!result.success) return result

      return { success: true }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const updateDashboardWidget = async (dashboardWidgetId, dashboardWidgetData) => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/dashboard-widgets/${dashboardWidgetId}`)
        .put(dashboardWidgetData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: dashboardWidgets,
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

  const updateProfile = async dashboardWidgetData => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/dashboard-widgets/profile`)
        .put(dashboardWidgetData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      const token = response.value?.entry?.token
      if (token) {
        useCookie("access_token").value = token
      }

      return { success: true }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const deleteDashboardWidget = async (dashboardWidgetId, reason = '') => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/dashboard-widgets/${dashboardWidgetId}`)
        .delete({ reason })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: dashboardWidgets,
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

  const saveDashboardWidget = async dashboardWidgetData => {
    if (dashboardWidgetData.id) {
      const { id, ...payload } = dashboardWidgetData

      return updateDashboardWidget(id, payload)
    }

    return createDashboardWidget(dashboardWidgetData)
  }

  return {
    dashboardWidget,
    dashboardWidgets,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchDashboardWidgets,
    fetchDashboardWidget,
    createDashboardWidget,
    updateDashboardWidget,
    updateProfile,
    deleteDashboardWidget,
    saveDashboardWidget,
    clearFormErrors,
    clearErrors,
  }
}

