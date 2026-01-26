import { useApi } from "@/composables/useApi"
import { ref } from "vue"

export const useManageRole = () => {
  // --------------------
  // State
  // --------------------
  const role = ref({})
  const roles = ref([])
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

  const fetchRoles = async () => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl("/roles", {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      roles.value = response.value
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchRole = async id => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl(`/roles/${id}`, {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      role.value = response

      return {
        success: true,
      }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const createRole = async roleData => {
    actionLoading.value = true
    clearFormErrors()
    try {
      const { data: response, error: apiError } = await useApi("/roles")
        .post(roleData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })

      roles.value = response.value

      return { success: true }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const updateRole = async (roleId, roleData) => {
    actionLoading.value = true
    clearFormErrors()
    try {
      const { data: response, error: apiError } = await useApi(
        `/roles/${roleId}`,
        {},
      )
        .put(roleData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      roles.value = response.value

      return { success: true }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const deleteRole = async (roleId, reason = "") => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(
        `/roles/${roleId}`,
      )
        .delete({ reason })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      roles.value = response.value

      return { success: true }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const saveRole = async roleData => {
    if (roleData.id) {
      const { id, ...payload } = roleData

      return updateRole(id, payload)
    }

    return createRole(roleData)
  }

  return {
    role,
    roles,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchRoles,
    fetchRole,
    createRole,
    updateRole,
    deleteRole,
    saveRole,
    clearFormErrors,
    clearErrors,
  }
}
