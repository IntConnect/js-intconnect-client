import { useApi } from '@/composables/useApi'
import { ref } from 'vue'

export const useManageFacility = () => {
  // --------------------
  // State
  // --------------------
  const facilities = ref([])
  const facility = ref({})
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

  const fetchFacilitiesPagination = async ({ page = 1, size = 10, query = '', sort = 'id', order = 'asc' }) => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/facilities/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      applyPaginationResponse(
        {
          entries: facilities,
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

  const fetchFacilities = async ({ isMinimal = false }) => {
    clearErrors()
    actionLoading.value = true
    try {
      let urlEndpoint = '/facilities'
      if (isMinimal) {
        urlEndpoint = '/public/facilities'
      }

      const { data: response, error: apiError } = await useApi(
        createUrl(urlEndpoint, {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      facilities.value = response.value
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchFacility = async facilityId => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl(`/facilities/${facilityId}`, {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      facility.value = response.value

      return {
        success: true,
      }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }


  const createFacility = async facilityData => {
    actionLoading.value = true
    clearFormErrors()
    try {
      const formData = jsonToFormData(facilityData)


      // Don't set Content-Type header - let the browser set it automatically with boundary
      const { data: response, error: apiError } = await useApi('/facilities', {
        headers: {
          // Remove any default Content-Type headers
        },
      }).post(formData).json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

    
      return { success: true }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const updateFacility = async (facilityId, facilityData) => {
    actionLoading.value = true
    clearFormErrors()
    try {
      const formData = jsonToFormData(facilityData)


      // Don't set Content-Type header - let the browser set it automatically with boundary
      const { data: response, error: apiError } = await useApi(`/facilities/${facilityId}`, {
        headers: {
          // Remove any default Content-Type headers
        },
      }).put(formData).json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      return { success: true }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const deleteFacility = async (facilityId, reason = '') => {
    actionLoading.value = true
    clearFormErrors()
    try {
      const { data: response, error: apiError } = await useApi(`/facilities/${facilityId}`)
        .delete({ reason })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: facilities,
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

  const saveFacility = async facilityData => {
    if (facilityData.id) {
      const { id, ...payload } = facilityData

      return updateFacility(id, payload)
    }

    return createFacility(facilityData)
  }

  return {
    facilities,
    facility,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchFacilitiesPagination,
    fetchFacilities,
    fetchFacility,
    createFacility,
    updateFacility,
    deleteFacility,
    saveFacility,
    clearFormErrors,
    clearErrors,
  }
}

