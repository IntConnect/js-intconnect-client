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
  reportDocumentTemplateData: {
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
  'reportDocumentTemplateData',
  'close',
])

const {
  parameters,
  fetchParameters,
} = useManageParameter()

const processedParameters = ref([])

onMounted(async () => {
  
  await fetchParameters({ isAutomatic: "true" })
  await nextTick()
  console.log(parameters)
  processedParameters.value = parameters.value.entries?.map(parameter => ({
    title: parameter.code,
    value: parameter.id,
  }))
})


// ==========================================
// Form State
// ==========================================
const isFormValid = ref(false)
const refForm = ref()

// Form fields
const id = ref('')
const name = ref('')
const code = ref('')

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

    // Prepare reportDocumentTemplate data
    const reportDocumentTemplateData = {
      id: id.value,
      name: name.value,
      code: code.value,
      parameter_ids: parameterIds.value,
    }

    // Include id for update
    if (id.value) {
      reportDocumentTemplateData.id = id.value
    }

    emit('reportDocumentTemplateData', reportDocumentTemplateData)
  })
}


// ==========================================
// Watchers
// ==========================================

/**
 * Watch for reportDocumentTemplateData changes (for edit mode)
 */
watch(
  () => props.reportDocumentTemplateData,
  val => {
    if (val && Object.keys(val).length) {
      id.value = val.id || ''
      name.value = val.name || ''
      code.value = val.code || ''
      parameterIds.value = val.parameters.map(parameter => {
        return parameter.id
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
      :title="isEditMode ? 'Edit Report Document Template' : 'Create Report Document Template'"
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
                  v-model="code"
                  :error="!!props.formErrors.code"
                  :error-messages="props.formErrors.code || []"
                  :rules="[requiredValidator]"
                  label="Code"
                  placeholder="SPX.001"
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
