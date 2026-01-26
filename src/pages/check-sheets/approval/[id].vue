<script setup>
import { useManageCheckSheet } from '@/composables/useManageCheckSheet'
import { useManageCheckSheetDocumentTemplate } from '@/composables/useManageCheckSheetDocumentTemplate'
import { useManageParameter } from '@/composables/useManageParameter'
import '@jaxtheprime/vue3-dropzone/dist/style.css'
import { ref } from 'vue'



const route = useRoute()
const router = useRouter()
let id = route.params.id

const numberedSteps = [
  {
    title: 'Mapping Parameter & Checkpoint',
    subtitle: 'Select and adjust parameter with checkpoint',
  },
  {
    title: 'Fill Report',
    subtitle: 'Input report with valid data',
  },

]

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

const {
  parameters,
  fetchParameters,
} = useManageParameter()

const {
  telemetries,
  fetchTelemetriesInterval,
} = useFetchTelemetry()


const currentStep = ref(0)

const processedCheckSheetDocumentTemplates = ref([])

const processedParameters = computed(() => {
  const listParameter = parameters.value['entries']

  if (!Array.isArray(listParameter)) return []

  return listParameter.map(parameter => {
    return {
      value: parameter.id,
      title: parameter.code,
    }
  })
})

const getParameterById = id => {
  return parameters.value?.entries?.find(p => p.id === id)
}

const onParameterChange = (parameterId, index) => {
  const param = getParameterById(parameterId)

  if (!param) return

  checkpoints.value[index] = {

    parameter: {
      id: param.id,
      isAutomatic: param.is_automatic,
      unit: param.unit,
    },
  }
}


const checkpoints = ref([])

const activeParametersCount = computed(() => {
  return checkpoints.value.filter(cp => cp.parameterId).length
})

const totalCheckpoints = computed(() => {
  return checkpoints.value.length
})

const addCheckpoint = () => {
  checkpoints.value.push({
    name: "",
    parameter: {
      id: null,
      isAutomatic: false,
      unit: "",
    },
  })
}

const removeCheckpoint = index => {
  checkpoints.value.splice(index, 1)
}

// ==========================================
// Form State
// ==========================================
const refForm = ref()

// Form fields
const selectedCheckSheetDocumentTemplateId = ref(1)
const timestamp = ref(new Date())
const status = ref("Draft")
const note = ref("")

const isAlertDialogVisible = ref(false)
const bodyAlert = ref('')
const titleAlert = ref('')
const alertType = ref('info')
const checkSheetValues = ref({})
const showApproveDialog = ref(false)
const showRejectDialog = ref(false)

const openApproveDialog = () => {
  showApproveDialog.value = true
}

const openRejectDialog = () => {
  showRejectDialog.value = true
}

const handleApprove = async data => {
  let approvalPayload = {
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
  } else {
    console.error(formErrors)
  }
}

const handleReject = async data => {
  let approvalPayload = {
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
  } else {
    console.error(formErrors)
  }
}


/* =========================
   SUBMIT / PAYLOAD
========================= */
const onSubmit = async () => {
  formErrors.value = {}

  const checkSheetCheckPoint = checkpoints.value.map((checkpoint, checkpointIndex) => {
    // Kumpulkan semua values untuk checkpoint ini dari semua timeSlots
    const checkSheetValues = timeSlots.value.map(time => {
      const value = getCellValue(time, checkpointIndex)

      return {
        timestamp: time,
        value: value,
      }
    })

    // Build checkpoint object
    const checkpointData = {
      parameter_id: checkpoint.parameter.id,
      name: checkpoint.name,
      check_sheet_values: checkSheetValues,
    }

    // Hanya tambahkan id jika ada (edit mode)
    if (checkpoint.id) {
      checkpointData.id = checkpoint.id
    }

    // Hanya tambahkan check_sheet_id jika ada (edit mode)
    if (checkpoint.check_sheet_id) {
      checkpointData.check_sheet_id = checkpoint.check_sheet_id
    }

    return checkpointData
  })



  const payload = {
    check_sheet_document_template_id: selectedCheckSheetDocumentTemplateId.value,
    check_sheet_check_points: checkSheetCheckPoint,
  }

  console.log(payload)

  const result = await createCheckSheet(payload)
  if (result.success) {
    isAlertDialogVisible.value = true
    bodyAlert.value = "You will be redirected to Check Sheet page"
    alertType.value = 'info'
    titleAlert.value = "Success manage Check Sheet"

    setTimeout(() => {
      router.push('/check-sheets')
    }, 2000)
  } else {
    console.error('submit failed', result)
    refForm.value?.resetValidation()

  }
}

onMounted(async () => {
  let checkSheetResult = await fetchCheckSheet(id)
  let checkSheetDocumentTemplatesResult = await fetchChecksheetDocumentTemplates()
  let parameterResult = await fetchParameters({})
  await nextTick()

  if (checkSheetDocumentTemplatesResult.success) {
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
    selectedCheckSheetDocumentTemplateId.value = checkSheet.value["check_sheet_document_template_id"]
    checkpoints.value = checkSheet.value['check_sheet_check_points'].map(checkSheetCheckPoint => {
      let parameter = getParameterById(checkSheetCheckPoint.parameter_id)
      console.log(parameter)
      
      return {
        name: checkSheetCheckPoint.name,
        parameter: {
          id: checkSheetCheckPoint.parameter_id,
          isAutomatic: parameter.is_automatic,
          unit: parameter.unit,
        },
      }
    })
  } else {
    id = null
  }
})

const activeCell = ref(null)
const hoveredRow = ref(null)
const hoveredCol = ref(null)

const setActiveCell = (time, cpIndex) => {
  activeCell.value = `${time}-${cpIndex}`
}

const isActiveCell = (time, cpIndex) => {
  return activeCell.value === `${time}-${cpIndex}`
}

// Auto-fill feature
const fillDown = (time, cpIndex) => {
  const currentValue = getCellValue(time, cpIndex)
  const timeIndex = timeSlots.value.indexOf(time)

  // Fill semua cell dibawahnya dengan value yang sama
  for (let i = timeIndex + 1; i < timeSlots.value.length; i++) {
    setCellValue(timeSlots.value[i], cpIndex, currentValue)
  }
}

const isCheckpointValid = computed(() => {
  if (!selectedCheckSheetDocumentTemplateId.value) return false

  return checkpoints.value.every(checkpoint =>
    checkpoint.name &&
    checkpoint.parameter?.id,
  )
})

const timeSlots = ref([])

function parseHour(timeStr) {
  // "12:00:00" → 12
  return parseInt(timeStr.split(':')[0], 10)
}

const selectedCheckSheetDocumentTemplate = computed(() => {
  return processedCheckSheetDocumentTemplates.value?.find(item => item.value === selectedCheckSheetDocumentTemplateId.value)

})

watch(() => selectedCheckSheetDocumentTemplate.value, () => {
  if (!selectedCheckSheetDocumentTemplate.value?.rawData) {
    timeSlots.value = []
    
    return
  }

  const { interval, starting_hour } = selectedCheckSheetDocumentTemplate.value.rawData
  if (!interval || !starting_hour) {
    timeSlots.value = []
    
    return
  }

  const startHour = parseHour(starting_hour)

  timeSlots.value = []

  let currentHour = startHour
  const visited = new Set()

  while (!visited.has(currentHour)) {
    visited.add(currentHour)

    timeSlots.value.push(
      `${String(currentHour % 24).padStart(2, '0')}:00`,
    )

    currentHour = (currentHour + interval) % 24
  }
},
{ immediate: true },
)

// Initialize checkSheetData untuk menyimpan nilai
const checkSheetData = ref({})

// Function untuk get/set value
const getCellValue = (time, checkpointIndex) => {
  const key = `${time}-${checkpointIndex}`

  const valueCheckSheet = checkSheetData.value[key]?.value

  if (valueCheckSheet == null) return ""

  return String(valueCheckSheet)
}

const setCellValue = (time, checkpointIndex, value, parameterId) => {
  const key = `${time}-${checkpointIndex}`

  checkSheetData.value[key] = {
    value,
    parameterId,
  }

}

// Copy row
const copyRow = time => {
  const rowData = {}

  checkpoints.value.forEach((_, cpIndex) => {
    rowData[cpIndex] = getCellValue(time, cpIndex)
  })

  return rowData
}



// Quick fill all with same value
const fillColumn = (cpIndex, value) => {
  timeSlots.value.forEach(time => {
    setCellValue(time, cpIndex, value)
  })
}
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
        <div class="mb-6 mt-5 d-flex justify-center">
          <AppStepper
            v-model:current-step="currentStep"
            :items="numberedSteps"
            align="start"
          />
        </div>
      </VCardText>
    </VCard>

    <VCard class="mt-5">
      <VCardText>
        <VForm
          ref="vform"
          lazy-validation
        >
          <VWindow
            v-model="currentStep"
            class="disable-tab-transition"
          >
            <!-- STEP 1: Mapping Parameter -->
            <VWindowItem>
              <VRow>
                <VCol cols="12">
                  <h6 class="text-h6 font-weight-medium">
                    Machine Identity
                  </h6>
                  <p class="mb-4">
                    Enter machine details
                  </p>

                  <!-- Parameter Status Info -->
                  <VAlert
                    color="info"
                    variant="tonal"
                    density="compact"
                    class="mb-6"
                  >
                    <div class="d-flex align-center gap-2">
                      <VIcon
                        icon="tabler-info-circle"
                        size="20"
                      />
                      <div>
                        <span class="font-weight-medium">Parameter Status:</span>
                        <VChip
                          size="small"
                          color="success"
                          variant="flat"
                          class="mx-2"
                        >
                          {{ activeParametersCount }} Active
                        </VChip>
                        <VChip
                          size="small"
                          color="secondary"
                          variant="flat"
                        >
                          {{ totalCheckpoints }} Total Checkpoints
                        </VChip>
                      </div>
                    </div>
                  </VAlert>
                  <VRow class="mb-2 d-flex justify-end">
                    <VCol cols="4">
                      <AppDateTimePicker
                        id="timestamp"
                        v-model="timestamp"
                        :disabled="true"
                        :config="{
                          dateFormat: 'Y-m-d',
                          altInput: true,
                          altFormat: 'd M Y',
                          time_24hr: true,
                        }"
                        label="Timestamp"
                        :rules="[requiredValidator]"
                        placeholder="Select date"
                      />
                    </VCol>
                  </VRow>

                  <VRow class="mb-2">
                    <VCol cols="4">
                      <AppSelect
                        v-model="selectedCheckSheetDocumentTemplateId"
                        :items="processedCheckSheetDocumentTemplates"
                        :error="!!formErrors.check_sheet_document_template_id"
                        :error-messages="formErrors.check_sheet_document_template_id || []"
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
                        placeholder="Insert short note"
                      />
                    </VCol>
                  </VRow>

                  <!-- Excel-like Table -->
                  <div class="excel-table-wrapper">
                    <!-- Header Row -->
                    <div class="excel-header">
                      <div class="excel-cell index-cell">
                        #
                      </div>
                      <div class="excel-cell checkpoint-cell">
                        Checkpoint Name
                      </div>
                      <div class="excel-cell parameter-cell">
                        Parameter
                      </div>
                      <div class="excel-cell action-cell">
                        Is Automatic?
                      </div>
                      <div class="excel-cell action-cell">
                        Unit
                      </div>
                    </div>

                    <!-- Data Rows -->
                    <div
                      v-for="(checkpoint, index) in checkpoints"
                      :key="checkpoint.id"
                      class="excel-row"
                    >
                      <!-- Index -->
                      <div class="excel-cell index-cell">
                        <span class="index-number">{{ index + 1 }}</span>
                      </div>

                      <!-- Checkpoint Name -->
                      <div class="excel-cell checkpoint-cell">
                        <AppTextField
                          v-model="checkpoint.name"
                          placeholder="Enter checkpoint name"
                          density="compact"
                          hide-details="auto"
                        />
                      </div>

                      <!-- Parameter Select -->
                      <div class="excel-cell parameter-cell">
                        <AppSelect
                          v-model="checkpoint.parameter.id"
                          :items="processedParameters"
                          placeholder="Select parameter"
                          density="compact"
                          hide-details="auto"
                          @update:model-value="value => onParameterChange(value, index)"
                        />
                      </div>

                      <!-- Is Automatic -->
                      <div class="excel-cell action-cell">
                        <VChip
                          :color="checkpoint.parameter.isAutomatic ? 'success' : 'info'"
                          variant="elevated"
                          size="small"
                        >
                          {{ checkpoint.parameter.isAutomatic ? 'Automatic' : 'Manual' }}
                        </VChip>
                      </div>

                      <!-- Unit -->
                      <div class="excel-cell action-cell">
                        <span class="text-body-2 font-weight-medium">
                          {{ checkpoint.parameter.unit || '-' }}
                        </span>
                      </div>
                    </div>

                    <!-- Add Row Button -->
                    <div class="excel-footer">
                      <VBtn
                        color="info"
                        variant="tonal"
                        size="small"
                        prepend-icon="tabler-plus"
                        @click="addCheckpoint"
                      >
                        Add Checkpoint
                      </VBtn>
                    </div>
                  </div>

                  <!-- Navigation -->
                  <div class="d-flex justify-end gap-3 mt-6">
                    <VBtn
                      color="primary"
                      :disabled="!isCheckpointValid"
                      @click="() => {
                        currentStep++
                      }"
                    >
                      Next
                      <VIcon
                        icon="tabler-arrow-right"
                        end
                      />
                    </VBtn>
                  </div>
                </VCol>
              </VRow>
            </VWindowItem>

            <VWindowItem>
              <VRow>
                <VCol cols="12">
                  <div class="d-flex align-center justify-space-between mb-4">
                    <div>
                      <h6 class="text-h6 font-weight-medium">
                        Fill Check Sheet Report
                      </h6>
                      <p class="mb-0 text-body-2">
                        Input values for each checkpoint at different times
                      </p>
                    </div>
                    <div class="d-flex gap-2">
                      <VChip
                        color="primary"
                        variant="tonal"
                        prepend-icon="tabler-checklist"
                      >
                        {{ checkpoints.length }} Checkpoints
                      </VChip>
                      <VChip
                        color="info"
                        variant="tonal"
                        prepend-icon="tabler-clock"
                      >
                        {{ timeSlots.length }} Time Slots
                      </VChip>
                    </div>
                  </div>

                  <!-- Quick Tips -->
                  <VAlert
                    color="info"
                    variant="tonal"
                    density="compact"
                    class="mb-4"
                  >
                    <div class="d-flex align-center gap-2">
                      <VIcon icon="tabler-bulb" />
                      <div class="text-caption">
                        <strong>Quick Tips:</strong> Use Tab to navigate • Double-click time badge to fill all cells in
                        that row • Click column header action to quick fill
                      </div>
                    </div>
                  </VAlert>

                  <!-- Excel Data Grid - IMPROVED -->
                  <div
                    v-if="checkpoints.length > 0"
                    class="excel-data-grid"
                  >
                    <div class="grid-toolbar">
                      <div class="d-flex align-center gap-3">
                        <VIcon
                          icon="tabler-table"
                          size="20"
                          color="primary"
                        />
                        <span class="text-body-2 font-weight-medium">Data Entry Grid</span>
                      </div>
                    </div>

                    <div class="grid-container">
                      <table class="modern-excel-table">
                        <!-- Header -->
                        <thead>
                          <tr>
                            <th class="corner-cell">
                              <VIcon
                                icon="tabler-layout-grid"
                                size="18"
                              />
                            </th>
                            <th class="time-column-header">
                              <div class="header-content">
                                <VIcon
                                  icon="tabler-clock"
                                  size="18"
                                />
                                <span>TIME</span>
                              </div>
                            </th>
                            <th
                              v-for="(checkpoint, cpIndex) in checkpoints"
                              :key="cpIndex"
                              class="checkpoint-column-header"
                              @mouseenter="hoveredCol = cpIndex"
                              @mouseleave="hoveredCol = null"
                            >
                              <div class="header-content">
                                <div class="header-main">
                                  <VChip
                                    size="small"
                                    :color="checkpoint.parameter.isAutomatic ? 'success' : 'primary'"
                                    class="mb-1"
                                    variant="flat"
                                  >
                                    {{ String.fromCharCode(65 + cpIndex) }}
                                  </VChip>
                                  <div class="checkpoint-info">
                                    <div class="checkpoint-title">
                                      {{ checkpoint.name }}
                                    </div>
                                    <div class="checkpoint-meta">
                                      <VIcon
                                        :icon="checkpoint.parameter.isAutomatic ? 'tabler-robot' : 'tabler-edit'"
                                        size="12"
                                      />
                                      <span>{{ checkpoint.parameter.unit || 'N/A' }}</span>
                                    </div>
                                  </div>
                                </div>
                                <VMenu>
                                  <template #activator="{ props }">
                                    <VBtn
                                      v-bind="props"
                                      icon
                                      size="x-small"
                                      variant="text"
                                      class="header-action"
                                    >
                                      <VIcon
                                        icon="tabler-dots-vertical"
                                        size="16"
                                      />
                                    </VBtn>
                                  </template>
                                  <VList density="compact">
                                    <VListItem @click="fillColumn(cpIndex, '0')">
                                      <template #prepend>
                                        <VIcon icon="tabler-fill" />
                                      </template>
                                      <VListItemTitle>Fill with 0</VListItemTitle>
                                    </VListItem>
                                    <VListItem @click="fillColumn(cpIndex, '')">
                                      <template #prepend>
                                        <VIcon icon="tabler-eraser" />
                                      </template>
                                      <VListItemTitle>Clear Column</VListItemTitle>
                                    </VListItem>
                                  </VList>
                                </VMenu>
                              </div>
                            </th>
                          </tr>
                        </thead>

                        <!-- Body -->
                        <tbody>
                          <tr
                            v-for="(time, timeIndex) in timeSlots"
                            :key="timeIndex"
                            class="data-row"
                            :class="{ 'row-hovered': hoveredRow === timeIndex }"
                            @mouseenter="hoveredRow = timeIndex"
                            @mouseleave="hoveredRow = null"
                          >
                            <!-- Row Number -->
                            <td class="row-number-cell">
                              <div class="row-number">
                                {{ timeIndex + 1 }}
                              </div>
                            </td>

                            <!-- Time Cell -->
                            <td class="time-data-cell">
                              <VMenu>
                                <template #activator="{ props }">
                                  <div
                                    v-bind="props"
                                    class="time-badge-interactive"
                                  >
                                    <VIcon
                                      icon="tabler-clock"
                                      size="16"
                                    />
                                    <span class="time-text">{{ time }}</span>
                                    <VIcon
                                      icon="tabler-chevron-down"
                                      size="14"
                                      class="dropdown-icon"
                                    />
                                  </div>
                                </template>
                                <VList density="compact">
                                  <VListItem @click="() => { /* Copy row */ }">
                                    <template #prepend>
                                      <VIcon icon="tabler-copy" />
                                    </template>
                                    <VListItemTitle>Copy Row</VListItemTitle>
                                  </VListItem>
                                  <VListItem @click="() => { /* Clear row */ }">
                                    <template #prepend>
                                      <VIcon icon="tabler-eraser" />
                                    </template>
                                    <VListItemTitle>Clear Row</VListItemTitle>
                                  </VListItem>
                                </VList>
                              </VMenu>
                            </td>

                            <!-- Data Cells -->
                            <td
                              v-for="(checkpoint, cpIndex) in checkpoints"
                              :key="cpIndex"
                              class="input-cell"
                              :class="{
                                'cell-active': isActiveCell(time, cpIndex),
                                'cell-hovered': hoveredCol === cpIndex,
                                'cell-disabled': checkpoint.parameter.isAutomatic,
                                'cell-filled': getCellValue(time, cpIndex)
                              }"
                            >
                              <div class="cell-wrapper">
                                <AppTextField
                                  :model-value="getCellValue(time, cpIndex)"
                                  placeholder="--"
                                  density="compact"
                                  hide-details
                                  type="number"
                                  :disabled="checkpoint.parameter.isAutomatic"
                                  class="cell-input"
                                  @focus="setActiveCell(time, cpIndex)"
                                  @blur="activeCell = null"
                                  @update:model-value="val => setCellValue(time, cpIndex, val, checkpoint.parameter.id)"
                                >
                                  <template
                                    v-if="checkpoint.parameter.isAutomatic"
                                    #append-inner
                                  >
                                    <VTooltip location="top">
                                      <template
                                        #activator="{ props }"
                                        activator="parent"
                                      >
                                        <VIcon
                                          v-bind="props"
                                          icon="tabler-lock"
                                          size="14"
                                          color="success"
                                        />
                                      </template>
                                      <span>Automatic Parameter</span>
                                    </VTooltip>
                                  </template>
                                </AppTextField>

                                <!-- Quick Fill Down Button -->
                                <VBtn
                                  v-if="!checkpoint.parameter.isAutomatic && getCellValue(time, cpIndex)"
                                  icon
                                  size="x-small"
                                  variant="text"
                                  class="fill-down-btn"
                                  @click="fillDown(time, cpIndex)"
                                >
                                  <VTooltip location="top">
                                    <template #activator="{ props }">
                                      <VIcon
                                        v-bind="props"
                                        icon="tabler-arrow-down"
                                        size="14"
                                      />
                                    </template>
                                    <span>Fill Down</span>
                                  </VTooltip>
                                </VBtn>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Grid Footer Stats -->
                    <div class="grid-footer">
                      <div class="footer-stats">
                        <div class="stat-item">
                          <VIcon
                            icon="tabler-check"
                            size="16"
                            color="success"
                          />
                          <span>{{ Object.keys(checkSheetData).filter(k => checkSheetData[k]).length }} / {{
                            timeSlots.length *
                              checkpoints.length }} Filled</span>
                        </div>
                        <div class="stat-item">
                          <VIcon
                            icon="tabler-clock"
                            size="16"
                            color="info"
                          />
                          <span>Last updated: {{ new Date().toLocaleTimeString() }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Navigation -->
                  <div class="d-flex justify-space-between mt-6">
                    <VBtn
                      color="secondary"
                      variant="tonal"
                      prepend-icon="tabler-arrow-left"
                      @click="currentStep--"
                    >
                      Back
                    </VBtn>
                    <div class="d-flex gap-2">
                      <VBtn
                        color="error"
                        :loading="actionLoading"
                        prepend-icon="tabler-x"
                        @click="openRejectDialog"
                      >
                        Reject
                      </VBtn>
                      <VBtn
                        color="success"
                        :loading="actionLoading"
                        prepend-icon="tabler-check"
                        @click="openApproveDialog"
                      >
                        Approve
                      </VBtn>
                    </div>
                  </div>
                </VCol>
              </VRow>
            </VWindowItem>
          </VWindow>
        </VForm>
      </VCardText>
    </VCard>
  </VCol>
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
.excel-table-wrapper {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  overflow: hidden;
  background-color: rgb(var(--v-theme-surface));
}

.excel-header {
  display: grid;
  grid-template-columns: 60px 1fr 1fr 120px 120px;
  gap: 0;
  background-color: rgb(var(--v-theme-primary));
  color: white;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 2px solid rgb(var(--v-theme-primary));
}

.excel-row {
  display: grid;
  grid-template-columns: 60px 1fr 1fr 120px 120px;
  gap: 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.3);
  transition: background-color 0.2s;
}

.excel-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.excel-row:last-child {
  border-bottom: none;
}

.excel-cell {
  padding: 12px;
  display: flex;
  align-items: center;
  border-right: 1px solid rgba(var(--v-border-color), 0.2);
}

.excel-cell:last-child {
  border-right: none;
}

.index-cell {
  justify-content: center;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
}

.index-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: rgb(var(--v-theme-primary));
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.checkpoint-cell {
  min-width: 225px;
}

.parameter-cell {
  min-width: 225px;
}

.action-cell {
  justify-content: center;
  gap: 8px;
}

.excel-footer {
  padding: 16px;
  text-align: center;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  border-top: 1px solid rgba(var(--v-border-color), 0.2);
}

/* Responsive */
@media (max-width: 1024px) {

  .excel-header,
  .excel-row {
    grid-template-columns: 50px 1fr 1fr 100px 100px;
  }

  .checkpoint-cell,
  .parameter-cell {
    min-width: 175px;
  }
}

@media (max-width: 768px) {
  .excel-header {
    display: none;
  }

  .excel-row {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 12px;
  }

  .excel-cell {
    border-right: none;
    padding: 0;
  }

  .excel-cell::before {
    content: attr(data-label);
    font-weight: 600;
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    color: rgb(var(--v-theme-primary));
  }

  .index-cell {
    background-color: transparent;
  }

  .action-cell {
    justify-content: flex-start;
  }
}


/* Excel Data Grid - Modern Design */
.excel-data-grid {
  border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.grid-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08), rgba(var(--v-theme-primary), 0.02));
  border-bottom: 2px solid rgba(var(--v-border-color), 0.2);
}

.grid-container {
  overflow: auto;
  max-height: 650px;
  position: relative;
}

.modern-excel-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
}

/* Header Styling */
.modern-excel-table thead {
  position: sticky;
  top: 0;
  z-index: 20;
}

.modern-excel-table th {
  background: linear-gradient(180deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.9) 100%);
  color: white;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-right: 2px solid rgba(255, 255, 255, 0.15);
  border-bottom: 3px solid rgb(var(--v-theme-primary));
  padding: 0;
  position: relative;
}

.corner-cell {
  width: 20px;
  text-align: center;
  position: sticky;
  left: 0;
  z-index: 25;
}

.time-column-header {
  min-width: 35px;
  width: 35px;
  position: sticky;
  z-index: 25;
}

.checkpoint-column-header {
  min-width: 200px;
  width: 200px;
}

.header-content {
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.time-column-header .header-content {
  flex-direction: row;
  justify-content: center;
}

.header-main {
  gap: 6px;
  width: 30px;
}

.checkpoint-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.checkpoint-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
}

.checkpoint-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  opacity: 0.9;
}

.header-action {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.checkpoint-column-header:hover .header-action {
  opacity: 1;
}

/* Body Styling */
.modern-excel-table tbody tr {
  transition: all 0.2s ease;
}

.data-row:nth-child(even) {
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
}

.data-row:hover,
.row-hovered {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
  box-shadow: inset 0 0 0 1px rgba(var(--v-theme-primary), 0.2);
}

.modern-excel-table td {
  border-right: 1px solid rgba(var(--v-border-color), 0.3);
  border-bottom: 1px solid rgba(var(--v-border-color), 0.3);
  padding: 0;
  position: relative;
}

.row-number-cell {
  width: 50px;
  text-align: center;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  position: sticky;
  left: 0;
  z-index: 15;
  border-right: 2px solid rgba(var(--v-border-color), 0.4) !important;
}

.row-number {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  font-weight: 600;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.time-data-cell {
  width: 140px;
  background: rgba(var(--v-theme-primary), 0.06);
  position: sticky;
  z-index: 15;
  border-right: 2px solid rgba(var(--v-theme-primary), 0.2) !important;
  padding: 8px;
}

.time-badge-interactive {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  margin: 10px 16px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgba(var(--v-theme-primary), 0.8));
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.3);
}

.time-badge-interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.4);
}

.time-text {
  letter-spacing: 0.5px;
}

.dropdown-icon {
  opacity: 0.7;
}

.input-cell {
  min-width: 200px;
  height: 60px;
  transition: all 0.2s;
}

.input-cell.cell-hovered {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.input-cell.cell-active {
  background-color: rgba(var(--v-theme-primary), 0.12);
  box-shadow: inset 0 0 0 2px rgb(var(--v-theme-primary));
  z-index: 10;
}

.input-cell.cell-disabled {
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
}

.input-cell.cell-filled {
  background-color: rgba(var(--v-theme-success), 0.05);
}

.cell-wrapper {
  padding: 8px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.cell-input {
  flex: 1;
}

.cell-input :deep(.v-field) {
  border-radius: 6px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.cell-input :deep(.v-field:hover) {
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.cell-input :deep(.v-field--focused) {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.1);
}

.cell-input :deep(input) {
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}

.cell-input :deep(input::placeholder) {
  opacity: 0.3;
}

.fill-down-btn {
  opacity: 0;
  transition: opacity 0.2s;
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
}

.input-cell:hover .fill-down-btn {
  opacity: 1;
}

/* Grid Footer */
.grid-footer {
  padding: 12px 20px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-top: 2px solid rgba(var(--v-border-color), 0.2);
}

.footer-stats {
  display: flex;
  gap: 24px;
  font-size: 13px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

/* Scrollbar Styling */
.grid-container::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.grid-container::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 6px;
}

.grid-container::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.4);
  border-radius: 6px;
  border: 2px solid rgba(var(--v-theme-surface-variant), 0.3);
}

.grid-container::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.6);
}

/* Responsive */
@media (max-width: 1200px) {
  .checkpoint-column-header {
    min-width: 160px;
    width: 160px;
  }

  .input-cell {
    min-width: 160px;
  }
}
</style>
