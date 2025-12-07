import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useManageModbusServer = () => {
  // --------------------
  // State
  // --------------------
  const modbusServers = ref([])
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

  const fetchModbusServers = async ({ page = 1, size = 10, query = '', sort = 'id', order = 'asc' }) => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/modbus-servers/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      applyPaginationResponse(
        {
          entries: modbusServers,
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

  const createModbusServer = async modbusServerData => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi('/modbus-servers')
        .post(modbusServerData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result


      applyPaginationResponse(
        {
          entries: modbusServers,
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

  const updateModbusServer = async (modbusServerId, modbusServerData) => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/modbus-servers/${modbusServerId}`)
        .put(modbusServerData)
        .json()


      const result = handleApiError(apiError, { formErrors, errorMessage })

      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: modbusServers,
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

  const deleteModbusServer = async (modbusServerId, reason = '') => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/modbus-servers/${modbusServerId}`)
        .delete({ reason })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: modbusServers,
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

  const saveModbusServer = async modbusServerData => {
    if (modbusServerData.id) {
      const { id, ...payload } = modbusServerData

      return updateModbusServer(id, payload)
    }

    return createModbusServer(modbusServerData)
  }

  return {
    modbusServers,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchModbusServers,
    createModbusServer,
    updateModbusServer,
    deleteModbusServer,
    saveModbusServer,
    clearFormErrors,
    clearErrors,
  }
}

