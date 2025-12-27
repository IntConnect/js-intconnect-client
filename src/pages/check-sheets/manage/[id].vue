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
  formErrors,
  fetchCheckSheet,
} = useManageCheckSheet()

const processedCheckSheetDocumentTemplates = ref([])

// ==========================================
// Form State
// ==========================================
const isFormValid = ref(false)
const refForm = ref()

// Form fields
const checkSheetDocumentTemplateId = ref('')

const isAlertDialogVisible = ref(false)
const bodyAlert = ref('')
const titleAlert = ref('')
const alertType = ref('info')
const checkSheetValues = ref([])

watch(() => checkSheetDocumentTemplateId.value, val => {
  console.log(val)
  let checkSheetDocumentTemplate = processedCheckSheetDocumentTemplates.value.find(item => item.value === val)
  console.log(checkSheetDocumentTemplate)
})


/* =========================
   SUBMIT / PAYLOAD
========================= */
const onSubmit = async () => {
  formErrors.value = {}

  const payload = {
    id: id,
    
  }

  const result = await saveFacility(payload)
  if (result.success) {
    isAlertDialogVisible.value = true
    bodyAlert.value = "You will be redirected to facilities page"
    alertType.value = 'info'
    titleAlert.value = "Success manage facilities"

    setTimeout(() => {
      router.push('/facilities')
    }, 2000)
  } else {
    console.error('submit failed', result)
  }
}

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
  }else{

  }
  if (checkSheetResult.success) {
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
          @submit.prevent="onSubmit"
        >
          <VRow>
            <VCol cols="6">
              <AppSelect
                v-model="checkSheetDocumentTemplateId"
                :items="processedCheckSheetDocumentTemplates"
                :error="!!formErrors.category"
                :error-messages="formErrors.category || []"
                :rules="[requiredValidator]"
                label="Check Sheet Document Template"
              />
            </VCol>
          </VRow>

        

          <!-- Actions -->
          <VCol cols="12">
            <div class="d-flex justify-end gap-3">
              <VBtn 
                to="/facilities"
                color="error"
                variant="tonal"
              >
                Back
              </VBtn>
              <VBtn
                :loading="actionLoading"
                color="primary"
                type="submit"
              >
                {{ isEditMode ? 'Update' : 'Create' }}
              </VBtn>
            </div>
          </VCol>
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
</template>
