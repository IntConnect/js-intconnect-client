import { useApi } from '@/composables/useApi'
import { ref } from 'vue'

export const useManageSystemSetting = () => {
  // --------------------
  // State
  // --------------------
  const systemSettings = ref([])
  const systemSetting = ref({})
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

  const fetchSystemSettingsPagination = async ({ page = 1, size = 10, query = '', sort = 'id', order = 'asc' }) => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/system-settings/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      applyPaginationResponse(
        {
          entries: systemSettings,
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

  const fetchSystemSettings = async () => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/system-settings', {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      systemSettings.value = response.value
      
      return {
        success: true,
      }
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchSystemSetting = async ({ isMinimal= true, key }) => {
    clearErrors()
    actionLoading.value = true

    try {
      let urlEndpoint = `/system-settings/${key}`
      if (isMinimal) {
        urlEndpoint = `/public/system-settings/${key}`
      }

      const { data: response, error: apiError } = await useApi(
        createUrl(`${urlEndpoint}`, {}),
      )
        .get()
        .json()


      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      systemSetting.value = response.value
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }


  const createSystemSetting = async systemSettingData => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const formData = jsonToFormData(systemSettingData)

      const { data: response, error: apiError } = await useApi('/system-settings')
        .post(formData)
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


  const saveSystemSetting = async systemSettingData => {

    return createSystemSetting(systemSettingData)
  }

  return {
    systemSetting,
    systemSettings,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchSystemSettings,
    fetchSystemSetting,
    fetchSystemSettingsPagination,
    createSystemSetting,
    saveSystemSetting,
    clearFormErrors,
    clearErrors,
  }
}

