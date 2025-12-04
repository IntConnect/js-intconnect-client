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
  smtpServerData: {
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
  'smtpServerData',
  'close',
])

// ==========================================
// Form State
// ==========================================
const isFormValid = ref(false)
const refForm = ref()

// Form fields
const id = ref('')
const host = ref('')
const port = ref('')
const username = ref('')
const password = ref('')
const mailAddress = ref('')
const mailName = ref('')
const isActive = ref(false)

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

    // Prepare smtpServer data
    const smtpServerData = {
      host: host.value,
      port: port.value,
      username: username.value,
      password: password.value,
      mail_address: mailAddress.value,
      mail_name: mailName.value,
      is_active: isActive.value,
    }

    // Include id for update
    if (id.value) {
      smtpServerData.id = id.value
    }

    emit('smtpServerData', smtpServerData)
  })
}


// ==========================================
// Watchers
// ==========================================

/**
 * Watch for smtpServerData changes (for edit mode)
 */
watch(
  () => props.smtpServerData,
  val => {
    if (val && Object.keys(val).length) {
      id.value = val.id || ''
      host.value = val.host || ''
      port.value = val.port || ''
      username.value = val.username || ''
      password.value = val.password || ''
      mailAddress.value = val.mail_address || ''
      mailName.value = val.mail_name || ''
      isActive.value = val.is_active || true
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
    :width="400"
    class="scrollable-content"
    location="end"
    temporary
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- Header -->
    <AppDrawerHeaderSection
      :title="isEditMode ? 'Edit SMTP Server' : 'Create SMTP Server'"
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
                  v-model="host"
                  :error-messages="props.formErrors.host || []"
                  :rules="[requiredValidator]"
                  label="Host"
                  placeholder="127.0.0.1"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="port"
                  :error-messages="props.formErrors.port || []"
                  :rules="[requiredValidator]"
                  label="Port"
                  placeholder="127.0.0.1"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="username"
                  :error-messages="props.formErrors.username || []"
                  :rules="[requiredValidator]"
                  label="Username"
                  placeholder="127.0.0.1"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="password"
                  :error-messages="props.formErrors.password || []"
                  :rules="[requiredValidator]"
                  label="Password"
                  placeholder="*******"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="mailAddress"
                  :error-messages="props.formErrors.mail_address || []"
                  :rules="[requiredValidator]"
                  label="Mail Address"
                  placeholder=""
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="mailName"
                  :error-messages="props.formErrors.mail_name || []"
                  :rules="[requiredValidator]"
                  label="Mail Name"
                  placeholder=""
                />
              </VCol>

              <VCol cols="12">
                <VLabel class="mb-3">
                  Is Active
                </VLabel>
                <VRadioGroup
                  v-model="isActive"
                  inline
                >
                  <div>
                    <VRadio
                      :value="true"
                      class="me-3"
                      label="Active"
                    />
                    <VRadio
                      :value="false"
                      label="Inactive"
                    />
                  </div>
                </VRadioGroup>
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
