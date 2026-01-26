import { useApi } from '@/composables/useApi'
import { ref } from 'vue'

export const useManageRegister = () => {
  // --------------------
  // State
  // --------------------
  const registers = ref([])
  const register = ref({})
  const registerDependency = ref({})
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

  const fetchRegistersPagination = async ({
    page = 1,
    size = 10,
    query = "",
    sort = "id",
    order = "asc",
  }) => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl("/registers/pagination", {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      applyPaginationResponse(
        {
          entries: registers,
          totalItems,
          currentPage,
          pageSize,
          totalPages,
        },
        response.value,
      )
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchRegisters = async ({ isAutomatic = null }) => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl("/registers", {
          query: { is_automatic: isAutomatic },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      registers.value = response.value

      return {
        success: true,
      }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchRegister = async id => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl(`/registers/${id}`, {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })

      if (!result.success) return result
      register.value = response.value

      return {
        success: true,
      }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchRegisterDependency = async () => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl("/registers/dependency", {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      registerDependency.value = response.value
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const createRegister = async registerData => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi("/registers")
        .post(registerData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      return { success: true }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const updateRegister = async (registerId, registerData) => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(
        `/registers/${registerId}`,
      )
        .put(registerData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })

      if (!result.success) return result

      return { success: true }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const manageRegisterValue = async (registerId, registerData) => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(
        `/registers/value/${registerId}`,
      )
        .put(registerData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })

      if (!result.success) return result

      return { success: true }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }


 
  const deleteRegister = async (registerId, reason = "") => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(
        `/registers/${registerId}`,
      )
        .delete({ reason })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: registers,
          totalItems,
          currentPage,
          pageSize,
          totalPages,
        },
        response.value,
      )

      return { success: true }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const saveRegister = async registerData => {
    if (registerData.id) {
      const { id, ...payload } = registerData

      return updateRegister(id, payload)
    }

    return createRegister(registerData)
  }

  const getRegisterById = registerId => {
    return registers.value.find(register => register.id === registerId)
  }

  return {
    register,
    registers,
    registerDependency,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchRegisters,
    fetchRegister,
    fetchRegistersPagination,
    fetchRegisterDependency,
    createRegister,
    updateRegister,
    manageRegisterValue,
    deleteRegister,
    saveRegister,
    clearFormErrors,
    clearErrors,
    getRegisterById,
  }
}
