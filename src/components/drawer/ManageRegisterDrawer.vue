<script setup>
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppDrawerHeaderSection from "@core/components/AppDrawerHeaderSection.vue"
import { nextTick, ref, watch } from 'vue'
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
  registerData: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  registerDependency: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'registerData',
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
const modbusServerId = ref('')
const memoryLocation = ref('')
const name = ref('')
const description = ref('')
const value = ref('')
const dataType = ref('')
const processedMachines = ref([])
const processedModbusServers = ref([])

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

    // Prepare register data
    const registerData = {
      machine_id: machineId.value,
      modbus_server_id: modbusServerId.value,
      memory_location: memoryLocation.value,
      name: name.value,
      description: description.value,
      data_type: dataType.value,
    }

    // Include id for update
    if (id.value) {
      registerData.id = id.value
    }

    emit('registerData', registerData)
  })
}


// ==========================================
// Watchers
// ==========================================

/**
 * Watch for registerData changes (for edit mode)
 */
watch(
  () => props.registerData,
  val => {
    if (val && Object.keys(val).length) {
      id.value = val.id || ''
      machineId.value = val['machine_id']
      modbusServerId.value = val['modbus_server_id']
      memoryLocation.value = val.memory_location
      name.value = val.name
      description.value = val.name
      dataType.value = val['data_type']

    }
  },
  { immediate: true, deep: true },
)

watch(
  () => props.registerDependency,
  val => {
    if (val && Object.keys(val).length) {
      processedMachines.value = val.entry.machines?.map(machine => ({
        title: machine.name,
        value: machine.id,
      }))
      processedModbusServers.value = val.entry.modbus_servers?.map(modbusServer => ({
        title: modbusServer.ip_address,
        value: modbusServer.id,
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
      :title="isEditMode ? 'Edit MQTT Topic' : 'Create MQTT Topic'"
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
                  :error="!!props.formErrors['machine_id']"
                  :error-messages="props.formErrors['machine_id'] || []"
                  :items="processedMachines"
                  :rules="[requiredValidator]"
                  label="Machine"
                  placeholder="Select machine"
                />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="modbusServerId"
                  :error="!!props.formErrors['modbus_server_id']"
                  :error-messages="props.formErrors['modbus_server_id'] || []"
                  :items="processedModbusServers"
                  :rules="[requiredValidator]"
                  label="Modbus Server"
                  placeholder="Select modbus server"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="memoryLocation"
                  :error="!!props.formErrors['memory_location']"
                  :error-messages="props.formErrors['memory_location'] || []"
                  :rules="[requiredValidator]"
                  label="Name"
                  placeholder="40001"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="name"
                  :error="!!props.formErrors['name']"
                  :error-messages="props.formErrors['name'] || []"
                  :rules="[requiredValidator]"
                  label="Name"
                  placeholder="Name"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="description"
                  :error="!!props.formErrors['description']"
                  :error-messages="props.formErrors['description'] || []"
                  label="Description"
                  placeholder="Description"
                />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="dataType"
                  :error="!!props.formErrors['data_type']"
                  :error-messages="props.formErrors['data_type'] || []"
                  :items="[{title: 'Boolean',value: 'Boolean'},{title: 'Number',value: 'Number'}]"
                  :rules="[requiredValidator]"
                  label="Data Type"
                  placeholder="Select data type"
                />
              </VCol>

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
