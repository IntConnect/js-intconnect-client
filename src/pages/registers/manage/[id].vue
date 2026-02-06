<script setup>
import AlertDialog from "@/components/general/AlertDialog.vue"
import GeneralAlert from "@/components/general/GeneralAlert.vue"
import ThreeDimensionModelRenderer from "@/components/ThreeDimensionModelRenderer.vue"
import { useManageMachine } from "@/composables/useManageMachine.js"
import { useManageRegister } from "@/composables/useManageRegister.js"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// ==========================================
// Composable
// ==========================================
const {
  registers,
  register,
  registerDependency,
  loading,
  actionLoading,
  fetchRegisterDependency,
  fetchRegister,
  fetchRegisters,
  totalItems,
  saveRegister,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
  getRegisterById,
} = useManageRegister()

const {
  machine,
  fetchMachine,
} = useManageMachine()

// ==========================================
// State
// ==========================================
const currentStep = ref(0)
const machineId = ref(null)
const modbusServerId = ref(null)
const memoryLocation = ref('')
const name = ref('')
const unit = ref('') // ADDED: Missing unit field
const code = ref('')
const description = ref('')
const dataType = ref('String')
const positionX = ref(0)
const positionY = ref(0)
const positionZ = ref(0)
const rotationX = ref(0)
const rotationY = ref(0)
const rotationZ = ref(0)
const processedMachines = ref([])
const processedModbusServers = ref([])
const isAlertDialogVisible = ref(false)
const isModelClickable = ref(false)
const refForm = ref()
const modelPath = ref('')
const modelViewerRef = ref(null)

const route = useRoute()
const router = useRouter()
const id = ref(route.params.id)

const isEditMode = computed(() => route.name === 'register-edit')

const numberedSteps = [
  {
    title: 'Register Details',
    subtitle: 'Basic Information',
  },
  {
    title: 'Register Positions',
    subtitle: 'Register Placement in 3D',
  },
  {
    title: 'Summary',
    subtitle: 'Review Before Submit',
  },
]

const buttonModelColor = computed(() => {
  return isModelClickable.value ? "warning" : "info"
})

const buttonModelText = computed(() => {
  return isModelClickable.value ? "Click Again to Turn Off Set Position" : "Click on 3D Model to Set Position"
})

const bodyAlert = ref('')
const titleAlert = ref('')
const alertType = ref('info')

// Computed properties for 3D renderer
const markerPosition = computed(() => ({
  x: positionX.value,
  y: positionY.value,
  z: positionZ.value,
}))

const markerRotation = computed(() => ({
  x: rotationX.value,
  y: rotationY.value,
  z: rotationZ.value,
}))

const showMarker = computed(() => {
  return !!name.value && !!unit.value
})

onMounted(async () => {
  await fetchRegisterDependency()
  
  processedMachines.value = registerDependency.value.entry.machines?.map(machine => ({
    title: machine.name,
    value: machine.id,
  }))
  
  processedModbusServers.value = registerDependency.value.entry.modbus_servers?.map(modbus_server => ({
    title: modbus_server.host_name,
    value: modbus_server.id,
  }))
  
  if (isEditMode.value) {
    let result = await fetchRegister(id.value)
    await nextTick()
    
    if (result.success) {
      let processedRegister = register.value.entry
      console.log(processedRegister)
      
      id.value = processedRegister.id
      name.value = processedRegister.name
      unit.value = processedRegister.unit || '' // Handle unit
      machineId.value = processedRegister.machine_id 
      modbusServerId.value = processedRegister.modbus_server_id
      memoryLocation.value = processedRegister.memory_location
      description.value = processedRegister.description
      dataType.value = processedRegister.data_type || 'String'
      
      // FIXED: Correct field names for position and rotation
      positionX.value = processedRegister.position_x || 0
      positionY.value = processedRegister.position_y || 0
      positionZ.value = processedRegister.position_z || 0
      rotationX.value = processedRegister.rotation_x || 0
      rotationY.value = processedRegister.rotation_y || 0
      rotationZ.value = processedRegister.rotation_z || 0
    } else {
      id.value = null
    }
  }
})

// ----------------------------------------
// Handle 3D model click
// ----------------------------------------
const setPositionFromClick = () => {
  if (!name.value) {
    isAlertDialogVisible.value = true
    bodyAlert.value = 'Fill Name First!'
    titleAlert.value = "Invalid Input"
    alertType.value = 'error'
    
    return
  }
  
  isModelClickable.value = !isModelClickable.value
  
  if (modelViewerRef.value) {
    modelViewerRef.value.setClickable(isModelClickable.value)
  }
}

const handlePositionClick = data => {
  // Set position
  positionX.value = Number(data.position.x.toFixed(4))
  positionY.value = Number(data.position.y.toFixed(4))
  positionZ.value = Number(data.position.z.toFixed(4))
  
  // Set rotation
  rotationX.value = Number(data.rotation.x.toFixed(4))
  rotationY.value = Number(data.rotation.y.toFixed(4))
  rotationZ.value = Number(data.rotation.z.toFixed(4))
  
  // Turn off clickable mode
  isModelClickable.value = false
  if (modelViewerRef.value) {
    modelViewerRef.value.setClickable(false)
  }
  
  // Show success message
  isAlertDialogVisible.value = true
  titleAlert.value = "Position Successfully Set"
  bodyAlert.value = "You can adjust manually using the input fields"
  alertType.value = 'success'
}

const onSubmit = () => {
  refForm.value.validate().then(async ({ valid }) => {
    if (!valid) return

    const registerData = {
      id: id.value,
      machine_id: machineId.value,
      modbus_server_id: modbusServerId.value,
      memory_location: memoryLocation.value,
      name: name.value,
      unit: unit.value,
      description: description.value,
      data_type: dataType.value,
      position_x: positionX.value,
      position_y: positionY.value,
      position_z: positionZ.value,
      rotation_x: rotationX.value,
      rotation_y: rotationY.value,
      code: code.value,
      rotation_z: rotationZ.value,
    }

    const result = await saveRegister(registerData)

    if (result.success) {
      await nextTick()

      isAlertDialogVisible.value = true
      bodyAlert.value = "You will be redirected to register page"
      alertType.value = 'info'
      titleAlert.value = "Success Manage Register"

      setTimeout(() => {
        router.push('/registers')
      }, 2000)
    } else {
      currentStep.value = 0
      console.error('Failed to save register:', result.error || result.errors)
    }
  })
}

watch(machineId, async value => {
  if (!value) {
    modelPath.value = ''
    
    return
  }

  try {
    await fetchMachine(value)
    await nextTick()
    console.log(machine.value)
    if (machine.value && machine.value.entry && machine.value.entry.model_path) {
      console.log(machine.value)
      modelPath.value = machine.value.entry.model_path
      console.log('Machine loaded, modelPath set to:', modelPath.value)
    } else {
      console.warn('Machine loaded but no model_path found')
      modelPath.value = ''
    }
  } catch (error) {
    console.error('Error loading machine:', error)
    modelPath.value = ''
  }
})
</script>

<template>
  <VCol cols="6">
    <h4 class="text-h4 mb-1 mt-1">
      Manage Register
    </h4>
    <p class="text-body-1 mb-2">
      Setup register location and rotation on your 3D model.
    </p>
  </VCol>
  
  <div class="mb-6 d-flex justify-center">
    <AppStepper
      v-model:current-step="currentStep"
      :items="numberedSteps"
      align="start"
    />
  </div>

  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardText>
          <VForm
            ref="refForm"
            lazy-validation
            @submit.prevent="onSubmit"
          >
            <VWindow
              v-model="currentStep"
              class="disable-tab-transition"
            >
              <!-- STEP 1: Register Details -->
              <VWindowItem>
                <VCol>
                  <VCol cols="12">
                    <GeneralAlert 
                      v-if="formErrors.value" 
                      color="error"
                      description="There are errors in some inputs, please fix them first!" 
                      icon="tabler-bug" 
                    />
                    <AppSelect 
                      v-model="machineId" 
                      :error="!!formErrors.machine_id"
                      :error-messages="formErrors.machine_id" 
                      :items="processedMachines" 
                      class="mt-3" 
                      label="Machine"
                      placeholder="Select a Machine" 
                    />
                  </VCol>
                  
                  <VCol cols="12">
                    <AppSelect 
                      v-model="modbusServerId" 
                      :error="!!formErrors.modbus_server_id"
                      :error-messages="formErrors.modbus_server_id" 
                      :items="processedModbusServers" 
                      label="Modbus Server"
                      placeholder="Select a Modbus Server" 
                    />
                  </VCol>

                  <VCol cols="12">
                    <AppTextField 
                      v-model="memoryLocation" 
                      :error="!!formErrors.memory_location" 
                      :error-messages="formErrors.memory_location"
                      label="Memory Location" 
                      placeholder="e.g., 40001" 
                      required 
                    />
                  </VCol>

                   <VCol cols="12">
                    <AppTextField 
                      v-model="code" 
                      :error="!!formErrors.code" 
                      :error-messages="formErrors.code"
                      label="Code" 
                      placeholder="e.g., 1_Leaving_Chilled_Water_Temp_Settings" 
                      required 
                    />
                  </VCol>
                  <VCol cols="12">
                    <AppTextField 
                      v-model="name" 
                      :error="!!formErrors.name" 
                      :error-messages="formErrors.name"
                      label="Name" 
                      placeholder="e.g., Temperature Sensor" 
                      required 
                    />
                  </VCol>

                  <VCol cols="12">
                    <AppTextField 
                      v-model="unit" 
                      :error="!!formErrors.unit" 
                      :error-messages="formErrors.unit"
                      label="Unit" 
                      placeholder="e.g., °C" 
                    />
                  </VCol>
                  
                  <VCol cols="12">
                    <AppTextField 
                      v-model="description" 
                      :error="!!formErrors.description"
                      :error-messages="formErrors.description" 
                      label="Description"
                      placeholder="Describe this register" 
                    />
                  </VCol>
                  
                  <VCol cols="12">
                    <AppSelect 
                      v-model="dataType" 
                      :error="!!formErrors.data_type"
                      :error-messages="formErrors.data_type" 
                      :items="[
                        { title: 'String', value: 'String' },
                        { title: 'Number', value: 'Number' },
                        { title: 'Boolean (TRUE or FALSE)', value: 'Boolean' }
                      ]" 
                      label="Data Type" 
                      placeholder="Select a Data Type" 
                    />
                  </VCol>
                </VCol>
              </VWindowItem>
              
              <!-- STEP 2: 3D Position -->
<VWindowItem class="h-100">
                <VRow>
                  <VCol cols="8">
                    <VAlert
                      v-if="!machineId"
                      type="info"
                      class="mb-4"
                    >
                      Please select a machine first in Step 1
                    </VAlert>
                    <VAlert
                      v-else-if="!modelPath"
                      type="warning"
                      class="mb-4"
                    >
                      Selected machine doesn't have a 3D model
                    </VAlert>
                    <template v-else>
                      <ThreeDimensionModelRenderer
                        v-if="currentStep === 1"
                        ref="modelViewerRef"
          :key="`model-${machineId}-step-${currentStep}-${modelPath}`"
                        :model-path="modelPath"
                        :clickable="isModelClickable"
                        :marker-name="name"
                        :marker-value="unit || 'N/A'"
                        :marker-position="markerPosition"
                        :marker-rotation="markerRotation"
                        :show-marker="showMarker"
                        :camera-position="{ x: machine?.entry?.['camera_x'], y: machine?.entry?.['camera_y'], z: machine.entry?.['camera_z'] }"
                        container-height="90vh"
                        :is-register-marker="true"
                        @position-click="handlePositionClick"
                      />
                    </template>
                  </VCol>
                  
                  <VCol cols="4">
                    <VCol cols="12">
                      <VBtn 
                        :color="buttonModelColor" 
                        :disabled="!modelPath"
                        class="w-full" 
                        @click="setPositionFromClick"
                      >
                        {{ buttonModelText }}
                      </VBtn>
                    </VCol>
                    
                    <VCol cols="12">
                      <h4 class="mt-1 mb-1">
                        Position
                      </h4>
                    </VCol>

                    <VCol cols="12">
                      <AppTextField 
                        v-model.number="positionX" 
                        label="Position X" 
                        type="number"
                        step="0.1"
                      />
                    </VCol>
                    <VCol cols="12">
                      <AppTextField 
                        v-model.number="positionY" 
                        label="Position Y" 
                        type="number"
                        step="0.1"
                      />
                    </VCol>
                    <VCol cols="12">
                      <AppTextField 
                        v-model.number="positionZ" 
                        label="Position Z" 
                        type="number"
                        step="0.1"
                      />
                    </VCol>
                    
                    <VDivider class="my-2" />
                    
                    <VCol cols="12">
                      <h4 class="mt-1 mb-1">
                        Rotation
                      </h4>
                    </VCol>
                    <VCol cols="12">
                      <AppTextField 
                        v-model.number="rotationX" 
                        label="Rotation X" 
                        type="number"
                        step="0.1"
                      />
                    </VCol>
                    <VCol cols="12">
                      <AppTextField 
                        v-model.number="rotationY" 
                        label="Rotation Y" 
                        type="number"
                        step="0.1"
                      />
                    </VCol>
                    <VCol cols="12">
                      <AppTextField 
                        v-model.number="rotationZ" 
                        label="Rotation Z" 
                        type="number"
                        step="0.1"
                      />
                    </VCol>
                  </VCol>
                </VRow>
              </VWindowItem>
              
              <!-- STEP 3: Summary -->
              <VWindowItem>
                <VRow>
                  <VCol cols="12">
                    <h4 class="text-h5 mb-4">
                      Summary
                    </h4>
                  </VCol>
                  <VCol cols="12">
                    <VAlert
                      type="info"
                      variant="tonal"
                      class="mb-4"
                    >
                      Please review all information carefully before submitting.
                    </VAlert>
                  </VCol>

                  <VCol cols="6">
                    <AppTextField 
                      :model-value="processedMachines?.find(m => m.value === machineId)?.title"
                      label="Machine" 
                      disabled 
                    />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField 
                      :model-value="processedModbusServers?.find(m => m.value === modbusServerId)?.title"
                      label="Modbus Server" 
                      disabled 
                    />
                  </VCol>
                  
                  <VCol cols="6">
                    <AppTextField 
                      v-model="name" 
                      label="Register Name" 
                      disabled 
                    />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField 
                      v-model="memoryLocation" 
                      label="Memory Location" 
                      disabled 
                    />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField 
                      v-model="unit" 
                      label="Unit" 
                      disabled 
                    />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField 
                      v-model="dataType" 
                      label="Data Type" 
                      disabled 
                    />
                  </VCol>

                  <VCol cols="12">
                    <VDivider class="my-3" />
                    <h4 class="text-h6 mb-2">
                      Position
                    </h4>
                  </VCol>

                  <VCol cols="4">
                    <AppTextField 
                      v-model="positionX" 
                      label="Position X" 
                      disabled 
                    />
                  </VCol>
                  <VCol cols="4">
                    <AppTextField 
                      v-model="positionY" 
                      label="Position Y" 
                      disabled 
                    />
                  </VCol>
                  <VCol cols="4">
                    <AppTextField 
                      v-model="positionZ" 
                      label="Position Z" 
                      disabled 
                    />
                  </VCol>

                  <VCol cols="12">
                    <h4 class="text-h6 mt-4 mb-2">
                      Rotation
                    </h4>
                  </VCol>

                  <VCol cols="4">
                    <AppTextField 
                      v-model="rotationX" 
                      label="Rotation X" 
                      disabled 
                    />
                  </VCol>
                  <VCol cols="4">
                    <AppTextField 
                      v-model="rotationY" 
                      label="Rotation Y" 
                      disabled 
                    />
                  </VCol>
                  <VCol cols="4">
                    <AppTextField 
                      v-model="rotationZ" 
                      label="Rotation Z" 
                      disabled 
                    />
                  </VCol>
                </VRow>
              </VWindowItem>
            </VWindow>
            
            <div class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center mt-8">
              <VBtn 
                :disabled="currentStep === 0" 
                color="secondary" 
                variant="tonal" 
                @click="currentStep--"
              >
                <VIcon
                  class="flip-in-rtl"
                  icon="tabler-arrow-left"
                  start
                />
                Previous
              </VBtn>
              
              <VBtn
                v-if="numberedSteps.length - 1 === currentStep"
                color="success"
                @click="onSubmit"
              >
                Submit
              </VBtn>
              
              <VBtn
                v-else
                @click="currentStep++"
              >
                Next
                <VIcon
                  class="flip-in-rtl"
                  end
                  icon="tabler-arrow-right"
                />
              </VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
  
  <AlertDialog 
    :body-alert="bodyAlert" 
    :is-dialog-visible="isAlertDialogVisible" 
    :title-alert="titleAlert"
    :type="alertType" 
    @update:is-dialog-visible="isAlertDialogVisible = $event" 
  />
</template>

<style scoped>
/* Tidak perlu style untuk canvas lagi */
</style>
