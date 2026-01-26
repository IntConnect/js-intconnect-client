<script setup>
import AppTextField from '@core/components/app-form-elements/AppTextField.vue'
import '@jaxtheprime/vue3-dropzone/dist/style.css'
import { nextTick, onMounted, reactive, ref } from 'vue'


const router = useRouter()

const {
  systemSetting,
  saveSystemSetting,
  fetchSystemSetting,
  formErrors,
} = useManageSystemSetting()



/* =========================
   FORM STATE (PERSISTED)
========================= */
const localForm = reactive({
  id: null,
  key: 'LISTENER_SETTINGS',
  description: '',
  insertionWorkersAmount: 0,
  insertionQueueSize: 0,
  parameterRecoveryCount: 20,
  snapshotTicker: 1,
  snapshotTickerType: 'Seconds',
})

const isAlertDialogVisible = ref(false)
const bodyAlert = ref('')
const titleAlert = ref('')
const alertType = ref('info')




/* =========================
   SUBMIT / PAYLOAD
========================= */
const onSubmit = async () => {
  formErrors.value = {}

  const payload = {
    key: localForm.key,
    description: localForm.description,
    value: {
      insertion_workers_amount: localForm.insertionWorkersAmount,
      insertion_queue_size: localForm.insertionQueueSize,
      parameter_recovery_count: localForm.parameterRecoveryCount,
      snapshot_ticker: localForm.snapshotTicker,
      snapshot_ticker_type: localForm.snapshotTickerType,
    },
  }


  const result = await saveSystemSetting(payload)
  if (result.success) {
    isAlertDialogVisible.value = true
    bodyAlert.value = "You will be redirect to system settings page"
    titleAlert.value = "Success manage Listener settings"

    setTimeout(() => {
      router.push('/system-settings')
    }, 2000)
  } else {
    // errors are already populated into formErrors by composable
    console.error('submit failed', result)
  }
}

onMounted(async () => {
  await fetchSystemSetting({ isMinimal: false, key: "LISTENER_SETTINGS" })
  await nextTick()

  if (systemSetting.value.entry) {
    Object.assign(localForm, {
      description: systemSetting.value.entry.description,
      insertionWorkersAmount: systemSetting.value.entry.value.insertion_workers_amount,
      insertionQueueSize: systemSetting.value.entry.value.insertion_queue_size,
      parameterRecoveryCount: systemSetting.value.entry.value.parameter_recovery_count,
      snapshotTicker: systemSetting.value.entry.value.snapshot_ticker,
      snapshotTickerType: systemSetting.value.entry.value.snapshot_ticker_type,
    })
  }
})
</script>

<template>
  <VCol cols="12">
    <h4 class="text-h4 mb-1">
      Manage Listener Settings
    </h4>
    <p class="text-body-1 mb-4">
      Configure Listener model and camera position
    </p>

    <VCard>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="localForm.key"
              disabled
              label="Key"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="localForm.description"
              label="Description"
              placeholder="Listener configuration description"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model.number="localForm.insertionWorkersAmount"
              :error="!!formErrors.insertion_workers_amount"
              :error-messages="formErrors.insertion_workers_amount || []"
              label="Insertion Workers Amount"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model.number="localForm.insertionQueueSize"
              :error="!!formErrors.insertion_queue_size"
              :error-messages="formErrors.insertion_queue_size || []"
              label="Insertion Queue Size"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="localForm.parameterRecoveryCount"
              :error="!!formErrors.parameter_recovery_count"
              :error-messages="formErrors.parameter_recovery_count || []"
              label="Parameter Recovery Count"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VRow>
              <VCol
                cols="6"
                md="6"
              >
                <AppTextField
                  v-model="localForm.snapshotTicker"
                  :error="!!formErrors.snapshot_ticker"
                  :error-messages="formErrors.snapshot_ticker || []"
                  label="Snapshot Ticker"
                />
              </VCol>

              <VCol
                cols="6"
                md="6"
              >
                <AppSelect
                  v-model="localForm.snapshotTickerType"
                  :error="!!formErrors.snapshotTickerType"
                  :error-messages="formErrors.snapshotTickerType || []"
                  :items="[{ title: 'Seconds', value: 'Seconds' }, { title: 'Minutes', value: 'Minutes' }]"
                  :rules="[requiredValidator]"
                  label="Snapshot Ticker Type"
                  placeholder="Select Snapshot Ticker Type"
                />
              </VCol>
            </VRow>
          </VCol>
        </VRow>

        <div class="d-flex justify-end mt-6 gap-4">
          <div class="d-flex flex-row gap-2">
            <VBtn
              color="error"
              variant="tonal"
              to="/system-settings"
            >
              <VIcon
                start
                icon="tabler-arrow-left"
              />
              Back
            </VBtn>


            <VBtn
              color="success"
              @click="onSubmit"
            >
              Save Settings
            </VBtn>
          </div>
        </div>
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
</template>
