<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppDrawerHeaderSection from "@core/components/AppDrawerHeaderSection.vue"
import { useApi } from "@/composables/useApi"

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  formErrors: {
    type: Object,
    default: () => ({}),
  },
  userData: {
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
  'userData',
  'close',
])

// ==========================================
// Form State
// ==========================================
const isFormValid = ref(false)
const refForm = ref()

// Form fields
const id = ref('')
const machineId = ref('')
const name = ref('')
const code = ref('')
const unit = ref('')
const minValue = ref('')
const maxValue = ref('')
const description = ref('')

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
  })
}

/**
 * Handle form submission
 */
const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (!valid) return

    // Prepare user data
    const userData = {
      username: username.value,
      name: name.value,
      email: email.value,
      role_id: roleId.value,
    }

    // Include id for update
    if (id.value) {
      userData.id = id.value
    }

    // Include password if provided (required for create, optional for update)
    if (password.value) {
      userData.password = password.value
    }

    emit('userData', userData)
  })
}

const processedMachines = ref([])

const {
  machines,
  fetchMachines,
  loading,
} = useManageMachine()

onMounted(async () => {
  await fetchMachines()
  await nextTick()
  processedMachines.value = machines.value.map(role => ({
    title: role.name,
    value: role.id,
  }))
})


// ==========================================
// Watchers
// ==========================================

/**
 * Watch for userData changes (for edit mode)
 */
watch(
  () => props.userData,
  val => {
    if (val && Object.keys(val).length) {
      id.value = val.id || ''
      username.value = val.username || ''
      name.value = val.name || ''
      email.value = val.email || ''
      roleId.value = val.role?.id || ''

      // Clear password fields for edit mode
      password.value = ''
      confirmPassword.value = ''
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
      })
    }
  },
)


const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
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
      :title="isEditMode ? 'Edit User' : 'Register User'"
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
                  placeholder="John Doe"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="code"
                  :error-messages="props.formErrors.code || []"
                  :rules="[requiredValidator]"
                  label="Code"
                  placeholder="AICOOL"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="unit"
                  :error-messages="props.formErrors.unit || []"
                  :rules="[requiredValidator]"
                  label="Unit"
                  placeholder="C"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="minValue"
                  :error-messages="props.formErrors.minValue || []"
                  :rules="[requiredValidator]"
                  label="Min Value"
                  placeholder="0"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="maxValue"
                  :error-messages="props.formErrors.maxValue || []"
                  :rules="[requiredValidator]"
                  label="Min Value"
                  placeholder="C"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="description"
                  :error-messages="props.formErrors.description || []"
                  :rules="[requiredValidator]"
                  label="Description"
                  placeholder="Temperature Parameter"
                />
              </VCol>


              <VCol cols="12">
                <AppSelect
                  v-model="machineId"
                  :error-messages="props.formErrors.machine_id || []"
                  :items="processedMachines"
                  :rules="[requiredValidator]"
                  label="Machine"
                  placeholder="Select machine"
                />
              </VCol>

              <!-- Actions -->
              <VCol cols="12">
                <VBtn
                  :loading="props.loading"
                  class="me-3"
                  type="submit"
                >
                  {{ isEditMode ? 'Update' : 'Register' }}
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
