import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useFetchAuditLog = () => {
  // --------------------
  // State
  // --------------------
  const auditLogs = ref([])
  const totalItems = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalPages = ref(0)
  const errorMessage = ref("")
  const actionLoading = ref(false)


  const clearErrors = () => {
    errorMessage.value = null
  }

  // --------------------
  // Main API Methods
  // --------------------

  const fetchAuditLogs = async ({ page = 1, size = 10, query = '', sort = 'id', order = 'asc' }) => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/audit-logs/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()


      const result = handleApiError(apiError, { errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: auditLogs,
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


  return {
    auditLogs,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,

    fetchAuditLogs,
    clearErrors,
  }
}

