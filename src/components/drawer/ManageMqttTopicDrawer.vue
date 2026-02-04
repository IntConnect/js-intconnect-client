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
  mqttTopicData: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  mqttTopicDependency: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'mqttTopicData',
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
const mqttBrokerId = ref('')
const name = ref('')
const qos = ref(0)
const processedMachines = ref([])
const processedMqttBrokers = ref([])

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

    // Prepare mqttTopic data
    const mqttTopicData = {
      machine_id: machineId.value,
      mqtt_broker_id: mqttBrokerId.value,
      name: name.value,
      qos: qos.value,
    }

    // Include id for update
    if (id.value) {
      mqttTopicData.id = id.value
    }

    emit('mqttTopicData', mqttTopicData)
  })
}


// ==========================================
// Watchers
// ==========================================

/**
 * Watch for mqttTopicData changes (for edit mode)
 */
watch(
  () => props.mqttTopicData,
  val => {
    if (val && Object.keys(val).length) {
      id.value = val.id || ''
      machineId.value = val.machine_id
      mqttBrokerId.value = val.mqtt_broker_id
      name.value = val.name
      qos.value = val.qos
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => props.mqttTopicDependency,
  val => {
    if (val && Object.keys(val).length) {
      processedMachines.value = val.entry.machines?.map(machine => ({
        title: machine.name,
        value: machine.id,
      }))
      processedMqttBrokers.value = val.entry.mqtt_brokers?.map(mqttBroker => ({
        title: mqttBroker.host_name,
        value: mqttBroker.id,
      }))
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
      title="Manage MQTT Topic"
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
                <AppSelect
                  v-model="machineId"
                  :error="!!props.formErrors.machine_id"
                  :error-messages="props.formErrors.machine_id || []"
                  :items="processedMachines"
                  :rules="[requiredValidator]"
                  label="Machine"
                  placeholder="Select machine"
                />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="mqttBrokerId"
                  :error="!!props.formErrors.mqtt_broker_id"
                  :error-messages="props.formErrors.mqtt_broker_id || []"
                  :items="processedMqttBrokers"
                  :rules="[requiredValidator]"
                  label="MQTT Broker"
                  placeholder="Select MQTT Broker"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="name"
                  :error-messages="props.formErrors.name || []"
                  :rules="[requiredValidator]"
                  label="Name"
                  placeholder="sensor/data"
                />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="qos"
                  :error="!!props.formErrors.qos"
                  :error-messages="props.formErrors.qos || []"
                  :items="[{title: '0',value: 0},{title: '1',value: 1},{title: '2',value: 2}]"
                  :rules="[requiredValidator]"
                  label="QoS"
                  placeholder="Select QoS"
                  data-testid="qos-selector"
                />
              </VCol>


              <!-- Actions -->
              <VCol cols="12">
                <VBtn
                  :loading="props.loading"
                  class="me-3"
                  type="submit"
                >
                Manage
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
