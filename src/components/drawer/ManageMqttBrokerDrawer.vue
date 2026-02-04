<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppDrawerHeaderSection from "@core/components/AppDrawerHeaderSection.vue"

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  formErrors: {
    type: Object,
    default: () => ({}),
  },
  mqttBrokerData: {
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
  'mqttBrokerData',
  'close',
])

// ==========================================
// Form State
// ==========================================
const isFormValid = ref(false)
const refForm = ref()

// Form fields
const id = ref('')
const hostName = ref('')
const mqttPort = ref('')
const wsPort = ref('')
const username = ref('')
const password = ref('')
const isActive = ref(true)

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

    // Prepare mqttBroker data
    const mqttBrokerData = {
      host_name: hostName.value,
      mqtt_port: mqttPort.value,
      ws_port: wsPort.value,
      username: username.value,
      password: password.value,
      is_active: isActive.value,
    }

    // Include id for update
    if (id.value) {
      mqttBrokerData.id = id.value
    }

    emit('mqttBrokerData', mqttBrokerData)
  })
}


// ==========================================
// Watchers
// ==========================================

/**
 * Watch for mqttBrokerData changes (for edit mode)
 */
watch(
  () => props.mqttBrokerData,
  val => {
    if (val && Object.keys(val).length) {
      id.value = val.id || ''
      hostName.value = val.host_name || ''
      mqttPort.value = val.mqtt_port || ''
      wsPort.value = val.ws_port || ''
      username.value = val.username || ''
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
    data-testid="mqtt-broker-drawer"
    location="end"
    temporary
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- Header -->
    <AppDrawerHeaderSection
      title="Manage MQTT Broker"
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
                  v-model="hostName"
                  :error-messages="props.formErrors.host_name || []"
                  :rules="[requiredValidator]"
                  label="Host Name"
                  placeholder="127.0.0.1"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="mqttPort"
                  :error-messages="props.formErrors.mqtt_port || []"
                  :rules="[requiredValidator]"
                  label="MQTT Port"
                  placeholder="1883"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="wsPort"
                  :error="!!props.formErrors.ws_port"
                  :error-messages="props.formErrors.ws_port || []"
                  :rules="[requiredValidator]"
                  label="WS Port"
                  placeholder="9001"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="username"
                  :error-messages="props.formErrors.username || []"
                  label="Username"
                  placeholder=""
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="password"
                  :error="!!props.formErrors.password"
                  :error-messages="props.formErrors.password || []"
                  label="Password"
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
                  data-testid="submit-drawer"
                >
                Manage
                </VBtn>
                <VBtn
                  color="error"
                  variant="tonal"
                  @click="closeNavigationDrawer"
                  data-testid="cancel-drawer"
                >Cancel</VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
