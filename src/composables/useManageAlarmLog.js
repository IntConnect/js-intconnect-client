import { useApi } from '@/composables/useApi'
import { ref } from 'vue'

export const useManageAlarmLog = () => {
  // --------------------
  // State
  // --------------------
  const alarmLogs = ref([])
  const alarmLog = ref({})
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

  const fetchAlarmLogsPagination = async ({
    page = 1,
    size = 10,
    query = '',
    sort = 'id',
    order = 'asc',
  }) => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/alarm-logs/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      applyPaginationResponse(
        {
          entries: alarmLogs,
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

  const fetchAlarmLog = async id => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl(`/alarm-logs/${id}`, {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      alarmLog.value = response.value
      
      return {
        success: true,
      }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchAlarmLogsByMachineId = async (machineId, isMinimal) => {
    clearErrors()
    actionLoading.value = true

     let endpointUrl = `/alarm-logs/machine/${machineId}`
    if (isMinimal) {
      endpointUrl = `public/alarm-logs/machine/${machineId}`
    }


    try {
      const { data: response, error: apiError } = await useApi(
        createUrl(endpointUrl, {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      alarmLogs.value = response.value
      
      return {
        success: true,
      }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }


 
  const updateAlarmLog = async alarmLogData => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/alarm-logs/${alarmLogData.id}`)
        .put({
          note: alarmLogData.note,
        })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result     

      return { success: true }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  return {
    alarmLogs,
    alarmLog,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchAlarmLogsPagination,
    fetchAlarmLog,
    fetchAlarmLogsByMachineId,
    updateAlarmLog,
    clearFormErrors,
    clearErrors,
  }
}

