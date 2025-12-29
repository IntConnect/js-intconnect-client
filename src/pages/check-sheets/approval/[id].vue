<script setup>
import { useManageCheckSheet } from '@/composables/useManageCheckSheet'
import { useManageCheckSheetDocumentTemplate } from '@/composables/useManageCheckSheetDocumentTemplate'
import '@jaxtheprime/vue3-dropzone/dist/style.css'
import { nextTick, onMounted, ref } from 'vue'



const route = useRoute()
const router = useRouter()
let id = route.params.id


const isEditMode = ref(false)

const {
  actionLoading,
  checkSheetDocumentTemplates,
  fetchChecksheetDocumentTemplates,
} = useManageCheckSheetDocumentTemplate()

const {
  checkSheet,
  formErrors,
  fetchCheckSheet,
  createCheckSheet,
  approvalCheckSheet,
} = useManageCheckSheet()

const processedCheckSheetDocumentTemplates = ref([])

// ==========================================
// Form State
// ==========================================
const isFormValid = ref(false)
const refForm = ref()

// Form fields
const checkSheetDocumentTemplateId = ref('')
const selectedCheckSheetDocumentTemplateParameter = ref([])
const groupedCheckSheetValues = ref({})
const status = ref("Draft")
const note = ref("")

const showApproveDialog = ref(false)
const showRejectDialog = ref(false)

const openApproveDialog = () => {
  showApproveDialog.value = true
}

const openRejectDialog = () => {
  showRejectDialog.value = true
}

const handleApprove = async data => {
  let approvalPayload =  {
    check_sheet_id: id,
    note: data.note,
    decision: true,
  }
  const actionResult = await approvalCheckSheet(approvalPayload)

  if (actionResult.success) {
    showApproveDialog.value = false
    isAlertDialogVisible.value = true
    bodyAlert.value = "You will be redirected to Check Sheet page"
    alertType.value = 'info'
    titleAlert.value = "Success approve Check Sheet"

    setTimeout(() => {
      router.push('/check-sheets')
    }, 2000) 
  }else{
    console.error(formErrors)
  }
}

const handleReject = async data => {
  let approvalPayload =  {
    check_sheet_id: id,
    note: data.note,
    decision: false,
  }
  const actionResult = await approvalCheckSheet(approvalPayload)
  if (actionResult.success) {
    showApproveDialog.value = false
    isAlertDialogVisible.value = true
    bodyAlert.value = "You will be redirected to Check Sheet page"
    alertType.value = 'info'
    titleAlert.value = "Success rejected Check Sheet"

    setTimeout(() => {
      router.push('/check-sheets')
    }, 2000) 
  }else{
    console.error(formErrors)
  }
}

const isAlertDialogVisible = ref(false)
const bodyAlert = ref('')
const titleAlert = ref('')
const alertType = ref('info')
const checkSheetValues = ref({})

watch(() => checkSheetDocumentTemplateId.value, val => {
  let checkSheetDocumentTemplate = processedCheckSheetDocumentTemplates.value.find(item => item.value === val)

  const rawGroupedCheckSheetValues = {}

  const interval = checkSheetDocumentTemplate.rawData.interval // misal 1, 2, 3
  const parameters = checkSheetDocumentTemplate.rawData.parameters

  for (let hour = 0; hour <= 24; hour += interval) {
    const timeKey = String(hour).padStart(2, '0') + '.00'

    rawGroupedCheckSheetValues[timeKey] = JSON.parse(JSON.stringify(parameters))
  }
  groupedCheckSheetValues.value = rawGroupedCheckSheetValues
  selectedCheckSheetDocumentTemplateParameter.value = checkSheetDocumentTemplate.rawData.parameters
})




onMounted(async () => {
  let checkSheetResult = await fetchCheckSheet(id)
  let checkSheetDocumentTemplatesResult =  await fetchChecksheetDocumentTemplates()
  await nextTick()

  if(checkSheetDocumentTemplatesResult.success){
    processedCheckSheetDocumentTemplates.value = checkSheetDocumentTemplates.value.entries.map(checkSheetDocumentTemplate => {
      return {
        title: checkSheetDocumentTemplate.name,
        value: checkSheetDocumentTemplate.id,
        rawData: checkSheetDocumentTemplate,
      }
    })
  }
  if (checkSheetResult.success) {
    isEditMode.value = true
    checkSheetDocumentTemplateId.value = checkSheet.value["check_sheet_document_template_id"]
    checkSheetValues.value = checkSheet.value["check_sheet_values"].reduce((acc, item) => {
      acc[`${item["timestamp"]}-${item["check_sheet_document_template_parameter_id"]}`] = {
        value: item.value,
        timestamp: item.timestamp,
        check_sheet_document_template_parameter_id: item.check_sheet_document_template_parameter_id,
      }
      
      return acc
    }, {})
  } else {
    id = null
  }
})
</script>

<template>
  <VCol cols="12">
    <h4 class="text-h4 mb-1">
      {{ isEditMode ? 'Edit' : 'Create' }} Check Sheet
    </h4>
    <p class="text-body-1 mb-4">
      Configure facility details and position in the dashboard model
    </p>
    <VCard>
      <VCardText>
        <VForm
          ref="refForm"
          v-model="isFormValid"
        >
          <VRow>
            <VCol cols="4">
              <AppSelect
                v-model="checkSheetDocumentTemplateId"
                :items="processedCheckSheetDocumentTemplates"
                :error="!!formErrors.category"
                :error-messages="formErrors.category || []"
                :rules="[requiredValidator]"
                label="Check Sheet Document Template"
              />
            </VCol>
            <VCol cols="4">
              <AppTextField
                v-model="status"
                label="Status"
                disabled
              />
            </VCol>
            <VCol cols="4">
              <AppTextField
                v-model="note"
                label="Note"
                disabled
              />
            </VCol>
          </VRow>

          <!-- Check Sheet by Time -->
          <VRow class="mt-4">
            <VCol cols="12">
              <div class="check-sheet-wrapper">
                <!-- Loop each time group -->
                <div
                  v-for="(parameters, time) in groupedCheckSheetValues"
                  :key="time"
                  class="time-section mb-6"
                >
                  <!-- Time Header -->
                  <div class="time-header">
                    <VIcon
                      icon="tabler-clock"
                      size="20"
                      class="me-2"
                    />
                    <span class="time-label">{{ time }}</span>
                    <VChip
                      size="small"
                      color="primary"
                      variant="tonal"
                      class="ms-2"
                    >
                      {{ parameters.length }} Parameter
                    </VChip>
                  </div>

                  <!-- Parameters Grid -->
                  <div class="parameters-grid">
                    <div
                      v-for="(param, index) in parameters"
                      :key="param.id"
                      class="parameter-card"
                    >
                      <div class="parameter-header">
                        <span class="parameter-number">#{{ index + 1 }}</span>
                        <span class="parameter-name">{{ param.parameter.name }}</span>
                      </div>
                      <AppTextField
                        :model-value="checkSheetValues[`${time}-${param.id}`]?.value || ''"
                        placeholder="Masukkan nilai"
                        density="compact"
                        disabled
                        @update:model-value="val => {
                          checkSheetValues[`${time}-${param.id}`] = {
                            value: val,
                            timestamp: time,
                            check_sheet_document_template_parameter_id: param.id,
                          }
                        }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </VCol>
          </VRow>

         
          <VRow>
            <VCol cols="12">
              <div class="d-flex flex-row justify-space-between">
                <div class="d-flex justify-start gap-3 mt-4">
                  <VBtn
                    :loading="actionLoading"
                    color="success"
                    prepend-icon="tabler-check"
                    @click="openApproveDialog"
                  >
                    Approve
                  </VBtn>
                  <VBtn 
                    color="error"
                    prepend-icon="tabler-x"
                    @click="openRejectDialog"
                  >
                    Reject
                  </VBtn>
                </div>
                <div class="d-flex justify-end gap-3 mt-4">
                  <VBtn 
                    to="/check-sheets"
                    color="secondary"
                    variant="tonal"
                  >
                    Back
                  </VBtn>
                </div>
              </div>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VCol>
  <AlertDialog
    :body-alert="bodyAlert"
    :is-dialog-visible="isAlertDialogVisible"
    :title-alert="titleAlert"
    :type="alertType"
    @update:is-dialog-visible="isAlertDialogVisible = $event"
  />


  <!-- Approve Dialog -->
  <ApprovalDialog
    v-model="showApproveDialog"
    action="approve"
    @submit="handleApprove"
  />

  <!-- Reject Dialog -->
  <ApprovalDialog
    v-model="showRejectDialog"
    action="reject"
    @submit="handleReject"
  />
</template>

 <style scoped>
      .check-sheet-wrapper {
      background-color: rgb(var(--v-theme-surface));
      border-radius: 8px;
      padding: 20px;
      }

      .time-section {
      background-color: rgb(var(--v-theme-background));
      border-radius: 8px;
      padding: 20px;
      border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
      }

      .time-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid rgba(var(--v-theme-primary), 0.2);
      }

      .time-label {
      font-size: 18px;
      font-weight: 600;
      color: rgb(var(--v-theme-primary));
      }

      .parameters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      }

      .parameter-card {
      background-color: rgb(var(--v-theme-surface));
      border-radius: 6px;
      padding: 16px;
      border: 1px solid rgba(var(--v-border-color), 0.5);
      transition: all 0.2s;
      }

      .parameter-card:hover {
      border-color: rgb(var(--v-theme-primary));
      box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
      transform: translateY(-2px);
      }

      .parameter-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      gap: 8px;
      }

      .parameter-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background-color: rgb(var(--v-theme-primary));
      color: white;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
      }

      .parameter-name {
      font-size: 14px;
      font-weight: 500;
      color: rgb(var(--v-theme-on-surface));
      }

      /* Responsive */
      @media (max-width: 768px) {
      .parameters-grid {
      grid-template-columns: 1fr;
      }
  
      .check-sheet-wrapper {
      padding: 12px;
      }
  
      .time-section {
      padding: 16px;
      }
      }
    </style>
