import { useApi } from "@/composables/useApi"
import { ref } from "vue"

export const useManageUser = () => {
  // --------------------
  // State
  // --------------------
  const user = ref({})
  const users = ref([])
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

  const fetchUsers = async ({
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
        createUrl("/users/pagination", {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: users,
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

  const fetchUser = async id => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl(`/users/${id}`, {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      user.value = response.value

      return {
        success: true,
      }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchProfile = async () => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl(`/users/profile`, {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      user.value = response.value

      return {
        success: true,
      }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const createUser = async userData => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi("/users")
        .post(userData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: users,
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

  const updateUser = async (userId, userData) => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(
        `/users/${userId}`,
      )
        .put(userData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: users,
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

  const updateProfile = async userData => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/users/profile`)
        .put(userData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      const token = response.value?.entry?.token
      if (token) {
        useCookie("access_token").value = token
      }

      return { success: true }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const deleteUser = async (userId, reason = "") => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(
        `/users/${userId}`,
      )
        .delete({ reason })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      applyPaginationResponse(
        {
          entries: users,
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

  const saveUser = async userData => {
    if (userData.id) {
      const { id, ...payload } = userData

      return updateUser(id, payload)
    }

    return createUser(userData)
  }

  return {
    user,
    users,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchUsers,
    fetchUser,
    fetchProfile,
    createUser,
    updateUser,
    updateProfile,
    deleteUser,
    saveUser,
    clearFormErrors,
    clearErrors,
  }
}
