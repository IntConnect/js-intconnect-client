<script setup>
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppDrawerHeaderSection from "@core/components/AppDrawerHeaderSection.vue"
import { nextTick, onMounted, ref, watch } from 'vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  formErrors: {
    type: Object,
    default: () => ({}),
  },
  checkSheetDocumentTemplateData: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'checkSheetDocumentTemplateData',
  'close',
])

const {
  parameters,
  fetchParameters,
} = useManageParameter()

const processedParameters = ref([])

onMounted(async () => {
  await fetchParameters({})
  await nextTick()
  processedParameters.value = parameters.value?.entries?.map(parameter => ({
    title: parameter.code,
    value: parameter.id,
  })) ?? []
})


// ==========================================
// Form State
// ==========================================
const isFormValid = ref(false)
const refForm = ref()

// Form fields
const id = ref('')
const name = ref('')
const no = ref('')
const description = ref('')
const category = ref('Inspection')
const intervalType = ref('Hours')
const interval = ref(1)
const revisionNumber = ref(0)
const effectiveDate = ref('')
 
const parameterIds = ref([])

// ==========================================
// Computed
// ==========================================
const isEditMode = computed(() => Boolean(id.value))


// ==========================================
// Methods
// ==========================================

/**
 * Close drawer and reset form
 */
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)
  emit('close')

  nextTick(() => {
    refForm.value?.reset()
    refForm.value?.resetValidation()

    // 🔥 Reset ALL fields including id
    id.value = ''
  })
}


/**
 * Handle form submission
 */
const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (!valid) return

    // Prepare checkSheetDocumentTemplate data
    const checkSheetDocumentTemplateData = {
      id: id.value,
      name: name.value,
      no: no.value,
      description: description.value,
      category: category.value,
      interval: interval.value,
      interval_type: intervalType.value,
      interval: interval.value,
      revision_number: revisionNumber.value,
      effective_date: effectiveDate.value,
      parameter_ids: parameterIds.value,
    }


    // Include id for update
    if (id.value) {
      checkSheetDocumentTemplateData.id = id.value
    }

    emit('checkSheetDocumentTemplateData', checkSheetDocumentTemplateData)
  })
}


// ==========================================
// Watchers
// ==========================================

/**
 * Watch for checkSheetDocumentTemplateData changes (for edit mode)
 */
watch(
  () => props.checkSheetDocumentTemplateData,
  val => {
    if (val && Object.keys(val).length) {
      
      id.value = val.id || ''
      name.value = val.name || ''
      no.value = val.no || ''
      description.value = val.description || ''
      category.value = val.category || ''
      interval.value = val.interval || ''
      intervalType.value = val.interval_type || ''
      revisionNumber.value = val.revision_number || ''
      effectiveDate.value = val.effective_date || ''
      parameterIds.value = val.parameters.map(parameter => {
        return parameter.parameter_id
      })
    }
  },
  { immediate: true, deep: true },
)

/**
 * Watch drawer close to reset form
 */
watch(
  () => props.isDrawerOpen,
  isOpen => {
    if (!isOpen) {
      nextTick(() => {
        refForm.value?.reset()
        refForm.value?.resetValidation()

        id.value = ''
      })
    }
  },
)


const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
  if (!val) {
    // drawer ditutup → reset form internal
    nextTick(() => {
      refForm.value?.reset()
      refForm.value?.resetValidation()
    })
  }
}
</script>

<template>
  <VNavigationDrawer
    :model-value="props.isDrawerOpen"
    :width="700"
    class="scrollable-content"
    location="end"
    temporary
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- Header -->
    <AppDrawerHeaderSection
      :title="isEditMode ? 'Edit Check Sheet Document Template' : 'Create Check Sheet Document Template'"
      @cancel="closeNavigationDrawer"
    />

    <VDivider />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- Form -->
          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="name"
                  :error="!!props.formErrors.name"
                  :error-messages="props.formErrors.name || []"
                  :rules="[requiredValidator]"
                  label="Name"
                  placeholder="SPX.001"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="no"
                  :error="!!props.formErrors.no"
                  :error-messages="props.formErrors.no || []"
                  :rules="[requiredValidator]"
                  label="No"
                  placeholder="SPX.001"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="description"
                  :error="!!props.formErrors.description"
                  :error-messages="props.formErrors.description || []"
                  :rules="[requiredValidator]"
                  label="Description"
                  placeholder="Type something..."
                />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="category"
                  :items="[{
                             title: 'Inspection',
                             value: 'Inspection'
                           },{
                             title: 'Lubrication', 
                             value:'Lubrication'
                           },{
                             title: 'Cleaning', 
                             value:'Cleaning'
                           }
                           ,{
                             title: 'Standar Operating Procedure', 
                             value:'Standar Operating Procedure'
                           }]"
                  :error="!!props.formErrors.category"
                  :error-messages="props.formErrors.category || []"
                  :rules="[requiredValidator]"
                  label="Category"
                />
              </VCol>
             
              <VCol cols="12">
                <VRow>
                  <VCol cols="6">
                    <AppTextField
                      v-model.number="interval"
                      :error="!!props.formErrors.interval"
                      :error-messages="props.formErrors.interval || []"
                      :rules="[requiredValidator]"
                      label="Interval"
                      placeholder="0"
                    />
                  </VCol>
                  <VCol cols="6">
                    <AppSelect
                      v-model="intervalType"
                      :items="[{
                        title: 'Hours',
                        value: 'Hours'
                      },{
                        title: 'Minutes', 
                        value:'Minutes'
                      }]"
                      :error="!!props.formErrors.interval_type"
                      :error-messages="props.formErrors.interval_type || []"
                      :rules="[requiredValidator]"
                      label="Interval Type"
                    />
                  </VCol>
                </VRow>
              </VCol>
             
              <VCol cols="12">
                <AppTextField
                  v-model.number="revisionNumber"
                  :error="!!props.formErrors.revision_number"
                  :error-messages="props.formErrors.revision_number || []"
                  :rules="[requiredValidator]"
                  label="Revision Number"
                  placeholder="1"
                  :disabled="isEditMode"
                />
              </VCol>
              <VCol cols="12">
                <AppDateTimePicker
                  id="effectiveDate"
                  v-model="effectiveDate"
                  style="width: full;"
                  :config="{
                    dateFormat: 'Y-m-d',
                    altInput: true,
                    altFormat: 'd M Y',     
                  }"
                  :error="!!props.formErrors.effective_date"
                  :error-messages="props.formErrors.effective_date || []"
                  label="Effective Date"
                  :rules="[requiredValidator]"

                  placeholder="Select date"
                />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="parameterIds"
                  :error="!!props.formErrors.parameter_ids"
                  :error-messages="props.formErrors.parameter_ids || []"
                  :items="processedParameters"
                  :rules="[requiredValidator]"
                  chips
                  closable-chips
                  label="Parameter"
                  multiple
                  placeholder="Select parameter"
                />
              </VCol>
              <!-- Actions -->
              <VCol cols="12">
                <VBtn
                  :loading="props.loading"
                  class="me-3"
                  type="submit"
                >
                  {{ isEditMode ? 'Update' : 'Create' }}
                </VBtn>
                <VBtn
                  color="error"
                  variant="tonal"
                  @click="closeNavigationDrawer"
                >
                  Cancel
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
