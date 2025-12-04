import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useManageMqttTopic = () => {
  // --------------------
  // State
  // --------------------
  const mqttTopics = ref([])
  const mqttTopicDependency = ref({})
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

  const fetchMqttTopics = async ({ page = 1, size = 10, query = '', sort = 'id', order = 'asc' }) => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/mqtt-topics/pagination', {
          query: { page, size, query, sort, order },
        }),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      applyPaginationResponse(
        {
          entries: mqttTopics,
          totalItems,
          currentPage,
          pageSize,
          totalPages,
        },
        response.value,
      )
      console.log(response)
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchMqttTopicDependency = async () => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl('/mqtt-topics/create', {}),
      )
        .get()
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result
      mqttTopicDependency.value = response.value
    } catch (_) {
      return { success: false, error: 'Unknown error' }
    } finally {
      actionLoading.value = false
    }
  }

  const createMqttTopic = async mqttTopicData => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi('/mqtt-topics')
        .post(mqttTopicData)
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result


      applyPaginationResponse(
        {
          entries: mqttTopics,
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

  const updateMqttTopic = async (mqttTopicId, mqttTopicData) => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/mqtt-topics/${mqttTopicId}`)
        .put(mqttTopicData)
        .json()


      const result = handleApiError(apiError, { formErrors, errorMessage })

      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: mqttTopics,
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

  const deleteMqttTopic = async (mqttTopicId, reason = '') => {
    actionLoading.value = true
    clearFormErrors()

    try {
      const { data: response, error: apiError } = await useApi(`/mqtt-topics/${mqttTopicId}`)
        .delete({ reason })
        .json()

      const result = handleApiError(apiError, { formErrors, errorMessage })
      if (!result.success) return result

      applyPaginationResponse(
        {
          entries: mqttTopics,
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

  const saveMqttTopic = async mqttTopicData => {
    if (mqttTopicData.id) {
      const { id, ...payload } = mqttTopicData

      return updateMqttTopic(id, payload)
    }

    return createMqttTopic(mqttTopicData)
  }

  return {
    mqttTopics,
    mqttTopicDependency,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchMqttTopics,
    fetchMqttTopicDependency,
    createMqttTopic,
    updateMqttTopic,
    deleteMqttTopic,
    saveMqttTopic,
    clearFormErrors,
    clearErrors,
  }
}

