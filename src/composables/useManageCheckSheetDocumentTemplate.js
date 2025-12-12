import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useManageCheckSheetDocumentTemplate = () => {
  // --------------------
  // State
  // --------------------
  const checksheetDocumentTemplates = ref([])
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

  const fetchChecksheetDocumentTemplatesPagination = async ({
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
        createUrl('/check-sheet-document-templates/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      applyPaginationResponse(
        {
          entries: checksheetDocumentTemplates,
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

  const createChecksheetDocumentTemplate = async checksheetDocumentTemplateData => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi('/checksheet-document-templates')
        .post(checksheetDocumentTemplateData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result


      applyPaginationResponse(
        {
          entries: checksheetDocumentTemplates,
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

  const updateChecksheetDocumentTemplate = async (checksheetDocumentTemplateId, checksheetDocumentTemplateData) => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const {
        data: response,
        error: apiError,
      } = await useApi(`/check-sheet-document-templates/${checksheetDocumentTemplateId}`)
        .put(checksheetDocumentTemplateData)
        .json()


      const result = handleApiError(apiError, { formErrors, errorMessage })

      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: checksheetDocumentTemplates,
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

  const deleteChecksheetDocumentTemplate = async (checksheetDocumentTemplateId, reason = '') => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const {
        data: response,
        error: apiError,
      } = await useApi(`/check-sheet-document-templates/${checksheetDocumentTemplateId}`)
        .delete({ reason })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: checksheetDocumentTemplates,
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

  const saveChecksheetDocumentTemplate = async checksheetDocumentTemplateData => {
    if (checksheetDocumentTemplateData.id) {
      const { id, ...payload } = checksheetDocumentTemplateData

      return updateChecksheetDocumentTemplate(id, payload)
    }

    return createChecksheetDocumentTemplate(checksheetDocumentTemplateData)
  }

  return {
    checksheetDocumentTemplates,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchChecksheetDocumentTemplatesPagination,
    createChecksheetDocumentTemplate,
    updateChecksheetDocumentTemplate,
    deleteChecksheetDocumentTemplate,
    saveChecksheetDocumentTemplate,
    clearFormErrors,
    clearErrors,
  }
}

