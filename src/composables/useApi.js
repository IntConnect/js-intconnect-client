import { createFetch } from '@vueuse/core'
import { destr } from 'destr'

export const useApi = createFetch({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  fetchOptions: {
    headers: {
      Accept: 'application/json',
    },
  },
  options: {
    refetch: true,

    /**
     * Before fetch - Add authorization token
     */
    beforeFetch({ url, options }) {
      const accessToken = useCookie('accessToken').value

      if (accessToken) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        }
      }

      return { options }
    },

    /**
     * After fetch - Parse JSON response
     */
    afterFetch(ctx) {
      const { data, response } = ctx

      // Parse data if it's JSON
      let parsedData = null
      try {
        parsedData = destr(data)
      } catch (error) {
        console.error('Failed to parse response:', error)
      }

      return { data: parsedData, response }
    },

    /**
     * On fetch error - Handle all errors
     */
    onFetchError(ctx) {
      const { data, response, error } = ctx

      // Parse error response data
      let errorData = null
      try {
        errorData = destr(data)
      } catch (e) {
        console.error('Failed to parse error response:', e)
      }

      // Create standardized error object
      const standardizedError = {
        status: response?.status || 500,
        statusText: response?.statusText || 'Unknown Error',
        message: errorData?.message || error?.message || 'An error occurred',
        data: errorData,
        error: errorData?.error || null,
        errors: errorData?.errors || null, // validation errors
      }

      console.error('API Error:', standardizedError)

      // Return error in ctx.data so it's accessible via error.value
      return {
        data: null,
        error: standardizedError,
      }
    },
  },
})
