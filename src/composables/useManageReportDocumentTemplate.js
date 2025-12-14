import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useManageReportDocumentTemplate = () => {
  // --------------------
  // State
  // --------------------
  const reportDocumentTemplates = ref([])
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

  const fetchReportDocumentTemplatesPagination = async ({
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
        createUrl('/report-document-templates/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      applyPaginationResponse(
        {
          entries: reportDocumentTemplates,
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

  const createReportDocumentTemplate = async reportDocumentTemplateData => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi('/report-document-templates')
        .post(reportDocumentTemplateData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result


      applyPaginationResponse(
        {
          entries: reportDocumentTemplates,
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

  const updateReportDocumentTemplate = async (reportDocumentTemplateId, reportDocumentTemplateData) => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/report-document-templates/${reportDocumentTemplateId}`)
        .put(reportDocumentTemplateData)
        .json()


      const result = handleApiError(apiError, { formErrors, errorMessage })

      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: reportDocumentTemplates,
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

  const deleteReportDocumentTemplate = async (reportDocumentTemplateId, reason = '') => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/report-document-templates/${reportDocumentTemplateId}`)
        .delete({ reason })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: reportDocumentTemplates,
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

  const saveReportDocumentTemplate = async reportDocumentTemplateData => {
    if (reportDocumentTemplateData.id) {
      const { id, ...payload } = reportDocumentTemplateData

      return updateReportDocumentTemplate(id, payload)
    }

    return createReportDocumentTemplate(reportDocumentTemplateData)
  }

  return {
    reportDocumentTemplates,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchReportDocumentTemplatesPagination,
    createReportDocumentTemplate,
    updateReportDocumentTemplate,
    deleteReportDocumentTemplate,
    saveReportDocumentTemplate,
    clearFormErrors,
    clearErrors,
  }
}

