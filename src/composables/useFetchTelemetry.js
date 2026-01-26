import { useApi } from "@/composables/useApi"
import { ref } from "vue"

export const useFetchTelemetry = () => {
  // --------------------
  // State
  // --------------------
  const telemetries = ref([])
  const totalItems = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalPages = ref(0)
  const errorMessage = ref("")
  const actionLoading = ref(false)
  const fetchTelemetriesReportError = ref({})

  const clearErrors = () => {
    errorMessage.value = null
  }

  // --------------------
  // Main API Methods
  // --------------------

  const fetchTelemetriesReport = async ({
    reportDocumentTemplateId,
    interval,
    startDate,
    endDate,
  }) => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        "/telemetries/report",
      )
        .post({
          report_document_template_id: reportDocumentTemplateId,
          interval,
          start_date: startDate,
          end_date: endDate,
        })
        .json()

      const result = handleApiError(apiError, { errorMessage })
      if (!result.success) return result
      telemetries.value = response.value
      console.log(response.value)

      return {
        success: true,
      }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  const fetchTelemetriesInterval = async ({
    interval,
    timestamp,
    startingHour,
    parameterIds,
  }) => {
    clearErrors()
    actionLoading.value = true

    try {
      const { data: response, error: apiError } = await useApi(
        "/telemetries/interval",
      )
        .post({
          interval,
          timestamp,
          starting_hour: startingHour,
          parameter_ids: parameterIds,
        })
        .json()

      const result = handleApiError(apiError, { errorMessage })
      if (!result.success) return result
      telemetries.value = response.value

      return {
        success: true,
      }
    } catch (_) {
      return { success: false, error: "Unknown error" }
    } finally {
      actionLoading.value = false
    }
  }

  return {
    telemetries,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    fetchTelemetriesReportError,

    fetchTelemetriesReport,
    fetchTelemetriesInterval,
    clearErrors,
  }
}
