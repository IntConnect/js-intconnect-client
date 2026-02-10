// composables/useApi.js
import { createFetch } from '@vueuse/core'
import { destr } from 'destr'

export const useApi = createFetch({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  fetchOptions: {
    headers: { Accept: 'application/json' },
  },
  options: {
    refetch: true,
  beforeFetch({ options }) {
  const cookieToken = useCookie('access_token').value
  const storageToken = localStorage.getItem('access_token')

  const accessToken = cookieToken || storageToken
  console.log('TOKEN =>', accessToken)


  if (accessToken) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    }
  }

  return { options }
},
    afterFetch(ctx) {
      let parsedData = null
      try {
        parsedData = destr(ctx.data)
      } catch (e) {
        console.error('Failed to parse response:', e)
      }

      return { data: parsedData, response: ctx.response }
    },
    onFetchError(ctx) {
      const { response, data } = ctx

      let errorData = null
      try {
        errorData = destr(data)
      } catch (e) {
        console.error('Failed to parse error response:', e)
      }

      const status = response?.status || 500
      const message = errorData?.message || 'An error occurred'
      const token = useCookie('access_token').value

      // 🔹 Handle 401 Unauthorized
      if (status === 401) {
        // User belum login
        if (!token) {
          window.location.href = '/login?alert=not_login'
        } else {
          // Session expired
          window.location.href = '/login?alert=session_expired'
        }
      }

      // Return standardized error object
      return {
        data: null,
        error: {
          status,
          message,
          data: errorData,
          error: errorData?.error || null,
          errors: errorData?.errors || null,
        },
      }
    },
  },
})
