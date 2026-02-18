<script setup>
import { exportAlarmLogPDF, loadImageAsBase64 } from '@/@core/utils/helpers'
import { useFetchTelemetry } from '@/composables/useFetchTelemetry'
import { useManageReportDocumentTemplate } from '@/composables/useManageReportDocumentTemplate'
import { format } from 'date-fns'
import { nextTick } from 'vue'



const page = ref(1)
const itemsPerPage = ref(10)
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")
const processedReportDocumentTemplates = ref([])
const showAlertDialog = ref(false)
const alertBody = ref('')
const alertTitle = ref('')
const alertType = ref('error')
const refForm =  ref()

const {
  fetchTelemetriesReport,
  telemetries,
  fetchTelemetriesReportError,
  generateXLSX,
} = useFetchTelemetry()

const {
  reportDocumentTemplates,
  fetchReportDocumentTemplates,
} = useManageReportDocumentTemplate()

const startDate = ref('2026-02-18 21:23')
const endDate = ref('2026-02-18 21:30')
const interval = ref(1)
const selectedReportDocumentTemplateId = ref()

const flatRows = computed(() => {
  if (telemetries.value.length == 0) return []
  
  return telemetries.value.entries?.flatMap(group =>
    group.entries.map(e => ({
      ...e,
      timestamp: format( group.timestamp, 'yyyy-MM-dd HH:mm:ss'),
    })),
  )
})

const headers = [
  { title: "Group by Timestamp", key: "data-table-group" },
  { title: "Timestamp", key: "timestamp" },
  { title: "Machine", key: "machine_name" },
  { title: "Parameter", key: "parameter_name" },
  { title: "Value", key: "value" },
]


const getIcon = props => props.icon

const handleSubmitTelemetryReport = async payload => {
 
  refForm.value?.validate().then(async ({ valid }) => {
    if (!valid) return
    await fetchTelemetriesReport({
      reportDocumentTemplateId: selectedReportDocumentTemplateId.value,
      interval: interval.value,
      startDate: startDate.value,
      endDate: endDate.value,
    })
  })
}

onMounted(async () => {
  let result =  await fetchReportDocumentTemplates()
  await nextTick()
  if(result.success){
    processedReportDocumentTemplates.value = reportDocumentTemplates.value.entries?.map(reportDocumentTemplate => {
      return {
        title: reportDocumentTemplate.code,
        value: reportDocumentTemplate.id,
      }
    })
  }
})

const handleExportIntoPDF = async () => {
  const logoBase64 = await loadImageAsBase64('/public/images/sinergiLogo.png')

  exportAlarmLogPDF({
    data: flatRows.value,
    logoBase64: logoBase64,
    company: {
      name: 'PT Sinergi Bisnis Indonesia',
      address: '  Jl. Raya Kawasan Industri Indotaisei',
    },
    filters: {
      'Date Range': '26 Jan 2026 01:06 - 01:18',
      'Machine': 'Chiller',
    },
    generatedBy: 'Admin (admin@company.com)',
    documentNumber: 'DOC-ALARM-2026-001',
  })
}

const handleExportIntoXLSX = async () => {
 

    refForm.value?.validate().then(async ({ valid }) => {
    if (!valid) return
    await generateXLSX({
      reportDocumentTemplateId: selectedReportDocumentTemplateId.value,
      interval: interval.value,
      startDate: startDate.value,
      endDate: endDate.value,
    })
  })
}
</script>

<template>
  <VCard>
    <AppCardActions
      no-actions
      title="Generate Report"
    >
      <VCardText class="d-flex flex-wrap gap-4 justify-space-between align-end">
        <!-- Items per page selector -->
        <div class="d-flex gap-2 align-center flex-wrap">
          <span class="text-body-1">Show</span>
          <AppSelect
            :items="ITEMS_PER_PAGE_OPTIONS"
            :model-value="itemsPerPage"
            style="inline-size: 5.5rem;"
            @update:model-value="itemsPerPage = parseInt($event, 10)"
          />
        </div>
      
        <!-- Right side controls -->
        <div class="d-flex flex-row gap-2 align-end flex-wrap">
          <VForm
            ref="refForm"
            class="d-flex flex-row gap-2 align-end flex-wrap"
            @submit.prevent="handleSubmitTelemetryReport"
          >
            <AppDateTimePicker
              id="startDate"
              v-model="startDate"
              style="inline-size: 12rem;"
              :config="{
                enableTime: true,
                dateFormat: 'Y-m-d H:i',
                altInput: true,
                altFormat: 'd M Y H:i',     
                time_24hr: true,
              }"
              :rules="[requiredValidator]"
              :error-messages="fetchTelemetriesReportError.start_date || []"
              label="Start Date"
              placeholder="Select date and time"
              data-testid="start-date-field"
            />
            <AppDateTimePicker
              id="endDate"
              v-model="endDate"
              style="inline-size: 12rem;"
              :config="{
                enableTime: true,
                dateFormat: 'Y-m-d H:i',
                altInput: true,
                altFormat: 'd M Y H:i',     
                time_24hr: true,
              }"
              :error-messages="fetchTelemetriesReportError.end_date || []"
              label="End Date"
              :rules="[requiredValidator]"

              placeholder="Select date and time"
              data-testid="end-date-field"

            />
            <AppTextField
              v-model.number="interval"
              style="inline-size: 10rem;"
              :error="!!fetchTelemetriesReportError.interval"
              :error-messages="fetchTelemetriesReportError.interval || []"
              :rules="[requiredValidator]"
              label="Interval"
              placeholder="5"
            />
            <AppSelect
              v-model="selectedReportDocumentTemplateId"
              style="inline-size: 18rem;"
              :error="!!fetchTelemetriesReportError.parameter_ids"
              :error-messages="fetchTelemetriesReportError.parameter_ids || []"
              :items="processedReportDocumentTemplates"
              :rules="[requiredValidator]"
              label="Report Document Template"
              placeholder="Select Report Document Template"
              data-testid="report-document-template-field"

            />
            <VBtn
              icon="tabler-cloud-up"
              rounded
              type="submit"
            />
          </VForm>
          <AppTextField
            v-model="searchQuery"
            clearable
            placeholder="Search something..."
            style="inline-size: 15.625rem;"
          />
        </div>
        <div class="d-flex flex-row gap-2 justify-end w-100 align-end flex-wrap ">
          <VBtn
            color="primary"
            @click="handleExportIntoPDF"
          >
            Export Into PDF
          </VBtn>
          <VBtn color="info"
            @click="handleExportIntoXLSX"
          >
            Export Into XLSX
          </VBtn>
        </div>
        <div class="table-scroll-wrapper">

        <VDataTable
          :headers="headers"
          :items="flatRows"
          :group-by="[{ key: 'timestamp' }]"
          item-value="id"
        >
          <template #data-table-group="{ props, item, count }">
            <td>
              <VBtn
                v-bind="props"
                variant="text"
                density="comfortable"
              >
                <VIcon
                  class="flip-in-rtl"
                  :icon="getIcon(props)"
                />
              </VBtn>

              <span>{{ format(new Date(item.value), 'dd MMM yyyy HH:mm:ss') }}</span>
              <span>({{ count }})</span>
            </td>
          </template>
        </VDataTable>
        </div>
      </VCardText>
    </AppCardActions>
  </VCard>
  <AlertDialog
    v-model:is-dialog-visible="showAlertDialog"
    :title-alert="alertTitle"
    :body-alert="alertBody"
    :type="alertType"
  />
</template>

<style>
.table-scroll-wrapper {
  overflow-y: auto;
  width: 100%;
  max-height: calc(100vh - 420px);
}</style>
