import { useApi } from '@/composables/useApi'
import { ref } from 'vue'

export const useFetchPermission = () => {
  // --------------------
  // State
  // --------------------
  const permissions = ref([])
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

  const fetchPermissionsPagination = async ({ page = 1, size = 10, query = '', sort = 'id', order = 'asc' }) => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/permissions/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { errorMessage })
      if (!result.success) return result
      console.log(permissions)
      applyPaginationResponse(
        {
          entries: permissions,
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

  const fetchPermissions = async () => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/permissions', {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { errorMessage })
      if (!result.success) return result
      permissions.value = response.value
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }


  return {
    permissions,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,

    fetchPermissionsPagination,
    fetchPermissions,
    clearErrors,
  }
}

