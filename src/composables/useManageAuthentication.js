export const useManageAuthentication = () => {
  const formErrors = ref({})
  const errorMessage = ref(null)

  const handleLogin = async form => {
    clearErrors()

    try {
      const { data: response, error: apiError } = await useApi('/authentication/login')
        .post({
          user_identifier: form.user_identifier, password: form.password,
        })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })

      console.log(errorMessage)
      if (!result.success) return result
      console.log(response)

      const token = response.value?.entry?.token

      if (token) {
        useCookie("access_token").value = token
      }

      // Redirect
      window.location.href = "/"
    } catch (err) {
      console.error("Login failed:", err)
    }
  }

  // 🧹 Membersihkan error form
  const clearErrors = () => {
    formErrors.value = {}
    errorMessage.value = null
  }

  return {
    handleLogin, formErrors, errorMessage,
  }
}
