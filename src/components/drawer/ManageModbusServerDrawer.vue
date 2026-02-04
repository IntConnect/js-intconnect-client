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
  modbusServerData: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  modbusServerDependency: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'modbusServerData',
  'close',
])

// ==========================================
// Form State
// ==========================================
const isFormValid = ref(false)
const refForm = ref()

// Form fields
const id = ref('')
const ipAddress = ref('')
const port = ref('')
const slaveId = ref('')
const isActive = ref(false)
const timeout = ref(0)

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

    // Prepare modbusServer data
    const modbusServerData = {
      id: id.value,
      ip_address: ipAddress.value,
      port: port.value,
      slave_id: slaveId.value,
      timeout: timeout.value,
      is_active: isActive.value,
    }

    // Include id for update
    if (id.value) {
      modbusServerData.id = id.value
    }

    emit('modbusServerData', modbusServerData)
  })
}


// ==========================================
// Watchers
// ==========================================

/**
 * Watch for modbusServerData changes (for edit mode)
 */
watch(
  () => props.modbusServerData,
  val => {
    if (val && Object.keys(val).length) {
      id.value = val.id || ''
      ipAddress.value = val.ip_address || ''
      port.value = val.port
      slaveId.value = val.slave_id
      timeout.value = val.timeout
      isActive.value = val.is_active || false
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
    data-testid="modbus-server-drawer"
    location="end"
    temporary
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- Header -->
    <AppDrawerHeaderSection
      title="Manage Modbus Server"
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
                  v-model="ipAddress"
                  :error="!!props.formErrors.ipAddress"
                  :error-messages="props.formErrors.ipAddress || []"
                  :rules="[requiredValidator]"
                  label="IP Address"
                  placeholder="127.0.0.1"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="port"
                  :error="!!props.formErrors.port"
                  :error-messages="props.formErrors.port || []"
                  :rules="[requiredValidator]"
                  label="Port"
                  placeholder="100"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="slaveId"
                  :error="!!props.formErrors.slaveId"
                  :error-messages="props.formErrors.slaveId || []"
                  :rules="[requiredValidator]"
                  label="Slave ID"
                  placeholder="1"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model.number="timeout"
                  :error="!!props.formErrors.timeout"
                  :error-messages="props.formErrors.timeout || []"
                  :rules="[requiredValidator]"
                  label="Timeout"
                  placeholder="1"
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
                  data-testid="submit-drawer"
                >
                Manage
                </VBtn>
                <VBtn
                  color="error"
                  variant="tonal"
                  @click="closeNavigationDrawer"
                  data-testid="cancel-drawer"
                
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
