import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useManageMqttTopic = () => {
  // State
  const mqttTopics = ref([])
  const totalItems = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalPages = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const formErrors = ref({})
  const actionLoading = ref(false)


  /**
   * Fetch mqttTopics with pagination
   */
  const fetchMqttTopicsPagination = async ({ page = 1, size = 10, query = '', sort = 'id', order = 'asc' }) => {
    loading.value = true
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/mqtt-topics/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Failed to fetch mqttTopics')
      }

      const res = response.value

      console.log(res)
      if (res.success) {
        mqttTopics.value = res.data ?? []
        totalItems.value = res.pagination.total_items
        currentPage.value = res.pagination.current_page
        pageSize.value = res.pagination.page_size
        totalPages.value = res.pagination.total_pages
      } else {
        throw new Error(res.message || 'Failed to fetch mqttTopics')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch mqttTopics:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch mqttTopics with pagination
   */
  const fetchMqttTopics = async () => {
    loading.value = true
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/mqtt-topics', {}),
      )
        .get()
        .json()

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Failed to fetch mqttTopics')
      }

      const res = response.value

      console.log(res)
      if (res.status) {
        mqttTopics.value = res.data ?? []
      } else {
        throw new Error(res.message || 'Failed to fetch mqttTopics')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch mqttTopics:', err)
    } finally {
      loading.value = false
    }
  }


  /**
   * Create new mqttTopic
   */
  const createMqttTopic = async mqttTopicData => {
    actionLoading.value = true
    formErrors.value = {}
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi('/mqttTopics')
        .post(mqttTopicData)
        .json()

      console.log(error, response)

      if (apiError.value) {
        const errorData = apiError.value

        // Handle validation errors (422)
        if (errorData.status === 422) {
          if (errorData.error?.details) {
            // Backend format: { error: { details: { field: "message" } } }
            formErrors.value = errorData.error.details
          } else if (errorData.errors) {
            // Alternative format: { errors: { field: ["message"] } }
            formErrors.value = errorData.errors
          }

          return { success: false, errors: formErrors.value }
        }

        throw new Error(errorData.message || 'Failed to create mqttTopic')
      }

      const res = response.value

      if (res.success) {
        return { success: true, data: res.data }
      } else {
        throw new Error(res.message || 'Failed to create mqttTopic')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to create mqttTopic:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Update existing mqttTopic
   */
  const updateMqttTopic = async (mqttTopicId, mqttTopicData) => {
    actionLoading.value = true
    formErrors.value = {}
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(`/mqttTopics/${mqttTopicId}`)
        .put(mqttTopicData)
        .json()

      if (apiError.value) {
        const errorData = apiError.value

        // Handle validation errors (422)
        if (errorData.status === 422) {
          if (errorData.error?.details) {
            formErrors.value = errorData.error.details
          } else if (errorData.errors) {
            formErrors.value = errorData.errors
          }

          return { success: false, errors: formErrors.value }
        }

        throw new Error(errorData.message || 'Failed to update mqttTopic')
      }

      const res = response.value

      if (res.success) {
        return { success: true, data: res.data }
      } else {
        throw new Error(res.message || 'Failed to update mqttTopic')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to update mqttTopic:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Delete mqttTopic
   */
  const deleteMqttTopic = async (mqttTopicId, reason = '') => {
    actionLoading.value = true
    error.value = null

    try {
      const { data: response, error: apiError } = await useApi(`/mqttTopics/${mqttTopicId}`)
        .delete({ description: reason })
        .json()

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Failed to delete mqttTopic')
      }

      const res = response.value

      if (res.success) {
        return { success: true, message: res.message }
      } else {
        throw new Error(res.message || 'Failed to delete mqttTopic')
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to delete mqttTopic:', err)

      return { success: false, error: err.message }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * Save mqttTopic (create or update)
   */
  const saveMqttTopic = async mqttTopicData => {
    const isUpdate = Boolean(mqttTopicData.id)

    if (isUpdate) {
      const mqttTopicId = mqttTopicData.id

      // Remove id from mqttTopicData untuk update
      const { id, ...updateData } = mqttTopicData

      return await updateMqttTopic(mqttTopicId, updateData)
    } else {
      return await createMqttTopic(mqttTopicData)
    }
  }

  /**
   * Clear form errors
   */
  const clearFormErrors = () => {
    formErrors.value = {}
  }

  /**
   * Clear all errors
   */
  const clearErrors = () => {
    error.value = null
    formErrors.value = {}
  }

  return {
    // State
    mqttTopics,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    loading,
    actionLoading,
    error,
    formErrors,

    // Methods
    fetchMqttTopicsPagination,
    fetchMqttTopics,
    createMqttTopic,
    updateMqttTopic,
    deleteMqttTopic,
    saveMqttTopic,
    clearFormErrors,
    clearErrors,
  }
}
