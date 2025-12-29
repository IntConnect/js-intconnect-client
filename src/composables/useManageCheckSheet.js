import { useApi } from '@/composables/useApi'
import { ref } from 'vue'

export const useManageCheckSheet = () => {
  // --------------------
  // State
  // --------------------
  const checkSheets = ref([])
  const checkSheet = ref({})
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

  const fetchCheckSheetsPagination = async ({
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
        createUrl('/check-sheets/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      applyPaginationResponse(
        {
          entries: checkSheets,
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

  const fetchCheckSheet = async id => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl(`/check-sheets/${id}`, {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      checkSheet.value = response.value
      
      return {
        success: true,
      }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const createCheckSheet = async checkSheetData => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi('/check-sheets')
        .post(checkSheetData)
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

  const approvalCheckSheet = async approvalPayload => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/check-sheets/approval/${approvalPayload.check_sheet_id}`)
        .post(approvalPayload)
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

  const updateCheckSheet = async (checkSheetId, checkSheetData) => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const {
        data: response,
        error: apiError,
      } = await useApi(`/check-sheets/${checkSheetId}`)
        .put(checkSheetData)
        .json()


      const result = handleApiError(apiError, { formErrors, errorMessage })

      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: checkSheets,
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

  const deleteCheckSheet = async (checkSheetId, reason = '') => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const {
        data: response,
        error: apiError,
      } = await useApi(`/check-sheets/${checkSheetId}`)
        .delete({ reason })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: checkSheets,
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

  const saveCheckSheet = async checkSheetData => {
    if (checkSheetData.id) {
      const { id, ...payload } = checkSheetData

      return updateCheckSheet(id, payload)
    }

    return createCheckSheet(checkSheetData)
  }

  return {
    checkSheets,
    checkSheet,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchCheckSheetsPagination,
    fetchCheckSheet,
    createCheckSheet,
    approvalCheckSheet,
    updateCheckSheet,
    deleteCheckSheet,
    saveCheckSheet,
    clearFormErrors,
    clearErrors,
  }
}

