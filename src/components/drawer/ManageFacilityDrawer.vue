<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppDrawerHeaderSection from "@core/components/AppDrawerHeaderSection.vue"
import { useApi } from "@/composables/useApi"
import Vue3Dropzone from '@jaxtheprime/vue3-dropzone'
import "@jaxtheprime/vue3-dropzone/dist/style.css"


const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  formErrors: {
    type: Object,
    default: () => ({}),
  },
  facilityData: {
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
  'facilityData',
  'close',
])

// ==========================================
// Form State
// ==========================================
const isFormValid = ref(false)
const refForm = ref()

// Form fields
const id = ref('')
const name = ref('')
const code = ref('')
const description = ref('')
const location = ref('')
const thumbnail = ref([])

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

    // Prepare facility data
    const facilityData = {
      name: name.value,
      code: code.value,
      description: description.value,
      location: location.value,
      thumbnail: thumbnailFile.value,
    }

    // Include id for update
    if (id.value) {
      facilityData.id = id.value
    }

    emit('facilityData', facilityData)
  })
}


// ==========================================
// Watchers
// ==========================================

/**
 * Watch for facilityData changes (for edit mode)
 */
watch(
  () => props.facilityData,
  val => {
    if (val && Object.keys(val).length) {
      id.value = val.id || ''
      name.value = val.name || ''
      code.value = val.code || ''
      description.value = val.description || ''
      location.value = val.location || ''
      thumbnail.value = val.thumbnail || true
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

const thumbnailFile = computed(() => thumbnail.value[0]?.file || null)


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
    :width="400"
    class="scrollable-content"
    location="end"
    temporary
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- Header -->
    <AppDrawerHeaderSection
      :title="isEditMode ? 'Edit MQTT Broker' : 'Create MQTT Broker'"
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
                  :error-messages="props.formErrors.name || []"
                  :rules="[requiredValidator]"
                  label="Name"
                  placeholder="Drier"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="code"
                  :error-messages="props.formErrors.code || []"
                  :rules="[requiredValidator]"
                  label="Code"
                  placeholder="Drier"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="description"
                  :error-messages="props.formErrors.description || []"
                  :rules="[requiredValidator]"
                  label="Description"
                  placeholder="Drier"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="location"
                  :error-messages="props.formErrors.location || []"
                  :rules="[requiredValidator]"
                  label="Location"
                  placeholder="Drier"
                />
              </VCol>
              <VCol cols="12">
                <p class="text-body-2">
                  Thumbnail
                </p>
                <Vue3Dropzone
                  v-model="thumbnail"
                  :max-file-size="1"
                  accept="image/png, image/jpeg"
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
