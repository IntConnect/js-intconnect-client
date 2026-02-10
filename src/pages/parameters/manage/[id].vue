<script setup>
import AlertDialog from "@/components/general/AlertDialog.vue"
import GeneralAlert from "@/components/general/GeneralAlert.vue"
import ThreeDimensionalModelRenderer from "@/components/ThreeDimensionModelRenderer.vue"
import { useManageMachine } from "@/composables/useManageMachine.js"
import { useManageParameter } from "@/composables/useManageParameter.js"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// ==========================================
// Composable
// ==========================================
const {
  parameters,
  parameter,
  parameterDependency,
  loading,
  actionLoading,
  fetchParameterDependency,
  fetchParameter,
  fetchParameters,
  totalItems,
  saveParameter,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
  getParameterById,
} = useManageParameter()

const {
  machine,
  fetchMachine,
} = useManageMachine()

// ==========================================
// State
// ==========================================
const currentStep = ref(0)
const name = ref('')
const machineId = ref(null)
const mqttTopicId = ref(null)
const code = ref('')
const unit = ref('')
const minValue = ref(0)
const maxValue = ref(0)
const description = ref('')
const positionX = ref(0)
const positionY = ref(0)
const positionZ = ref(0)
const rotationX = ref(0)
const rotationY = ref(0)
const rotationZ = ref(0)
const category = ref('Data')
const isDisplay = ref(false)
const isAutomatic = ref(false)
const isWatch = ref(false)
const isFeatured = ref(false)
const isRunningTime = ref(false)
const isProcessed = ref(false)
const processedMachines = ref([])
const processedMqttTopic = ref([])
const processedParameterSequences = ref([])
const isAlertDialogVisible = ref(false)
const isModelClickable = ref(false)
const refForm = ref()
const modelPath = ref('')
const processedParameters = ref([])
const modelViewerRef = ref(null)

const route = useRoute()
const router = useRouter()
const id = ref(route.params.id)

const isEditMode = computed(() => route.name === 'parameter-edit')

const numberedSteps = [
  {
    title: 'Parameter Details',
    subtitle: 'Basic Information',
  },
  {
    title: 'Parameter Positions',
    subtitle: 'Parameter Placement in 3D',
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
  return !!name.value && !!unit.value && (positionX.value !== 0 || positionY.value !== 0 || positionZ.value !== 0)
})

onMounted(async () => {
  await fetchParameterDependency()
  
  if (isEditMode.value) {
    let result = await fetchParameter(id.value)
    await fetchParameters({ isAutomatic: null })
    await nextTick()
    
    processedMachines.value = parameterDependency.value.entry.machines?.map(machine => ({
      title: machine.name,
      value: machine.id,
    }))
    
    processedMqttTopic.value = parameterDependency.value.entry.mqtt_topics?.map(mqtt_topic => ({
      title: mqtt_topic.name,
      value: mqtt_topic.id,
    }))
    
    if (result.success) {
      let processedParameter = parameter.value.entry
      id.value = processedParameter.id
      name.value = processedParameter.name
      machineId.value = processedParameter['mqtt_topic']['machine_id'] != 0 ? processedParameter['mqtt_topic']['machine_id'] : processedParameter['machine_id']
      mqttTopicId.value = processedParameter.mqtt_topic_id
      code.value = processedParameter.code
      unit.value = processedParameter.unit
      minValue.value = processedParameter.min_value
      maxValue.value = processedParameter.max_value
      description.value = processedParameter.description
      positionX.value = processedParameter.position_x
      positionY.value = processedParameter.position_y
      positionZ.value = processedParameter.position_z
      rotationX.value = processedParameter.rotation_x
      rotationY.value = processedParameter.rotation_y
      rotationZ.value = processedParameter.rotation_z
      isAutomatic.value = processedParameter.is_automatic
      isWatch.value = processedParameter.is_watch
      isDisplay.value = processedParameter.is_display
      isFeatured.value = processedParameter.is_featured
      isProcessed.value = processedParameter.is_processed
      processedParameterSequences.value = processedParameter.processed_parameter_sequence?.map(processedParameterSequence => {
        return {
          type: processedParameterSequence.type,
          parameter_id: processedParameterSequence.parameter_id,
        }
      })
    } else {
      id.value = null
    }
  } else {
    processedMachines.value = parameterDependency.value.entry.machines?.map(machine => ({
      title: machine.name,
      value: machine.id,
    }))
    
    processedMqttTopic.value = parameterDependency.value.entry.mqtt_topics?.map(mqtt_topic => ({
      title: mqtt_topic.name,
      value: mqtt_topic.id,
    }))
  }
})

// ----------------------------------------
// Handle 3D model click
// ----------------------------------------
const setPositionFromClick = () => {
  if (!name.value || !unit.value) {
    isAlertDialogVisible.value = true
    bodyAlert.value = 'Fill Name and Unit First!'
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

    const arranged = processedParameterSequences.value?.map((op, i) => ({
      ...op,
      sequence: i + 1,
    }))
    
    const parameterData = {
      id: id.value,
      name: name.value,
      code: code.value,
      unit: unit.value,
      min_value: minValue.value,
      max_value: maxValue.value,
      description: description.value,
      machine_id: machineId.value,
      mqtt_topic_id: mqttTopicId.value,
      category: category.value,
      position_x: positionX.value,
      position_y: positionY.value,
      position_z: positionZ.value,
      rotation_x: rotationX.value,
      rotation_y: rotationY.value,
      rotation_z: rotationZ.value,
      is_display: isDisplay.value,
      is_automatic: isAutomatic.value,
      is_watch: isWatch.value,
      is_featured: isFeatured.value,
      is_processed: isProcessed.value,
      is_running_time: isRunningTime.value,
      processed_parameter_sequence: arranged,
    }

    const result = await saveParameter(parameterData)

    if (result.success) {
      await nextTick()

      isAlertDialogVisible.value = true
      bodyAlert.value = "You will be redirected to parameter page"
      alertType.value = 'info'
      titleAlert.value = "Success Manage Parameter"

      setTimeout(() => {
        router.push('/parameters')
      }, 2000)
    } else {
      currentStep.value = 0
      console.error('Failed to save parameter:', result.error || result.errors)
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
    
    if (machine.value && machine.value.entry && machine.value.entry.model_path) {
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

watch(parameters, () => {
  const list = parameters.value['entries']

  if (!Array.isArray(list)) return []
  processedParameters.value = list.map(parameter => {
    return {
      title: parameter.code,
      value: parameter.id,
    }
  })
})

const availableOps = [
  { title: 'Add (+)', value: 'ADDITION' },
  { title: 'Subtract (-)', value: 'SUBTRACTION' },
  { title: 'Multiply (×)', value: 'MULTIPLICATION' },
  { title: 'Divide (÷)', value: 'DIVISION' },
]

function addOperation() {
  processedParameterSequences.value.push({
    type: 'ADDITION',
    parameter_id: null,
  })
}

function removeOperation(index) {
  processedParameterSequences.value.splice(index, 1)
}
</script>

<template>
  <VCol cols="6">
    <h4 class="text-h4 mb-1 mt-1">
      Manage Parameter
    </h4>
    <p class="text-body-1 mb-2">
      Setup parameter location and rotation on your 3D model.
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
              <!-- STEP 1: Parameter Details -->
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
                      data-testid="machine-select"
                    />
                  </VCol>
                  
                  <VCol
                    v-if="isAutomatic"
                    cols="12"
                  >
                    <AppSelect 
                      v-model="mqttTopicId" 
                      :error="!!formErrors.mqtt_topic_id"
                      :error-messages="formErrors.mqtt_topic_id" 
                      :items="processedMqttTopic" 
                      label="MQTT Topic"
                      placeholder="Select a MQTT Topic" 
                      data-testid="mqtt-topic-select"
                    />
                  </VCol>

                  <VCol cols="12">
                    <AppTextField 
                      v-model="name" 
                      :error="!!formErrors.name" 
                      :error-messages="formErrors.name"
                      label="Parameter Name" 
                      placeholder="e.g., Temperature" 
                      required 
                    />
                  </VCol>

                  <VCol cols="12">
                    <AppTextField 
                      v-model="code" 
                      :error="!!formErrors.code" 
                      :error-messages="formErrors.code"
                      label="Code" 
                      placeholder="e.g., TEMP_01" 
                      required 
                    />
                  </VCol>
                  
                  <VCol cols="12">
                    <AppSelect 
                      v-model="category" 
                      :error="!!formErrors.category"
                      :error-messages="formErrors.category" 
                      :items="[
                        { title: 'Data', value: 'Data' },
                        { title: 'Status', value: 'Status' },
                        { title: 'Time', value: 'Time' }
                      ]" 
                      label="Category" 
                      placeholder="Select a Category" 
                      data-testid="category-select"
                    />
                  </VCol>

                  <VCol cols="12">
                    <AppTextField 
                      v-model="unit" 
                      :error="!!formErrors.unit" 
                      :error-messages="formErrors.unit"
                      label="Unit" 
                      placeholder="e.g., °C" 
                      required 
                    />
                  </VCol>

                  <VCol cols="12">
                    <VRow>
                      <VCol cols="6">
                        <AppTextField 
                          v-model.number="minValue" 
                          :error="!!formErrors.min_value"
                          :error-messages="formErrors.min_value" 
                          label="Min Value" 
                          placeholder="0" 
                          type="number" 
                        />
                      </VCol>

                      <VCol cols="6">
                        <AppTextField 
                          v-model.number="maxValue" 
                          :error="!!formErrors.max_value"
                          :error-messages="formErrors.max_value" 
                          label="Max Value" 
                          placeholder="100" 
                          type="number" 
                        />
                      </VCol>
                    </VRow>
                  </VCol>
                  
                  <VCol cols="12">
                    <AppTextField 
                      v-model="description" 
                      :error="!!formErrors.description"
                      :error-messages="formErrors.description" 
                      label="Description"
                      placeholder="Describe this parameter" 
                    />
                  </VCol>
                  
                  <VCol
                    cols="12"
                    class="pa-0"
                  >
                    <VRow>
                      <VCol
                        cols="6"
                        md="6"
                      >
                        <VCol
                          cols="6"
                          md="6"
                        >
                          <VLabel
                            class="mb-1 text-body-2 text-wrap"
                            style="line-height: 15px;"
                            text="Is Running Time"
                          />
                          <VSwitch
                            v-model="isRunningTime"
                            data-testid="is-running-time-switch"
                            :label="isRunningTime ? 'Yes' : 'No'"
                          />
                        </VCol>
                        <VCol
                          cols="6"
                          md="6"
                        >
                          <VLabel
                            class="mb-1 text-body-2 text-wrap"
                            style="line-height: 15px;"
                            text="Is Processed"
                          />
                          <VSwitch
                            v-model="isProcessed"
                            :label="isProcessed ? 'Processed Parameter' : 'Regular Parameter'"
                            data-testid="is-processed-switch"

                          />
                        </VCol>
                        <VBtn
                          v-if="isProcessed"
                          block
                          color="primary"
                          variant="tonal"
                          @click="addOperation"
                          data-testid="add-operation-btn"
                        >
                          Add Operation
                        </VBtn>
                      </VCol>
                      
                      <VCol
                        cols="6"
                        class="mt-4"
                      >
                        <VRow
                          v-for="(op, i) in processedParameterSequences"
                          v-if="isProcessed"
                          :key="i"
                          class="align-center mb-4"
                        >
                          <VCol cols="5">
                            <VSelect
                              v-model="op.type"
                              :items="availableOps"
                              label="Operation Type"
                              density="comfortable"
                            />
                          </VCol>

                          <VCol cols="5">
                            <VSelect
                              v-model.number="op.parameter_id"
                              :items="processedParameters"
                              density="comfortable"
                              label="Parameter"
                            />
                          </VCol>

                          <VCol
                            cols="2"
                            class="text-center"
                          >
                            <VBtn
                              icon
                              size="small"
                              color="error"
                              @click="removeOperation(i)"
                            >
                              <VIcon
                                icon="tabler-trash"
                                size="20"
                              />
                            </VBtn>
                          </VCol>
                        </VRow>
                      </VCol>
                    </VRow>
                  </VCol>

                  <VCol cols="12">
                    <VRow>
                      <VCol
                        cols="6"
                        md="6"
                      >
                        <VLabel
                          class="mb-1 text-body-2 text-wrap"
                          style="line-height: 15px;"
                          text="Is Display"
                        />
                        <VSwitch
                          v-model="isDisplay"
                          :label="isDisplay ? 'Active' : 'Inactive'"
                            data-testid="is-display-switch"

                        />
                      </VCol>
                      <VCol
                        cols="6"
                        md="6"
                      >
                        <VLabel
                          class="mb-1 text-body-2 text-wrap"
                          style="line-height: 15px;"
                          text="Is Automatic"
                        />
                        <VSwitch
                          v-model="isAutomatic"
                          :label="isAutomatic ? 'Automatic' : 'Manual'"
                            data-testid="is-automatic-switch"

                        />
                      </VCol>
                    </VRow>
                  </VCol>
                  
                  <VCol cols="12">
                    <VRow>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <VLabel
                          class="mb-1 text-body-2 text-wrap"
                          style="line-height: 15px;"
                          text="Is Watch"
                        />
                        <VSwitch
                          v-model="isWatch"
                          :label="isWatch ? 'Watch' : 'Ignore'"
                            data-testid="is-watch-switch"

                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <VLabel
                          class="mb-1 text-body-2 text-wrap"
                          style="line-height: 15px;"
                          text="Is Featured"
                        />
                        <VSwitch
                          v-model="isFeatured"
                          :label="isFeatured ? 'Yes' : 'No'"
                            data-testid="is-featured-switch"

                        />
                      </VCol>
                    </VRow>
                  </VCol>
                </VCol>
              </VWindowItem>
              
              <!-- STEP 2: 3D Position -->
              <VWindowItem>
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
                      <ThreeDimensionalModelRenderer
                        v-if="currentStep === 1"
                        ref="modelViewerRef"
                        :key="`model-viewer-${machineId}`"
                        :model-path="modelPath"
                        :clickable="isModelClickable"
                        :marker-name="name"
                        :marker-value="unit"
                        :marker-position="markerPosition"
                        :marker-rotation="markerRotation"
                        :show-marker="showMarker"
                        :camera-position="{ x: machine?.entry?.['camera_x'], y: machine?.entry?.['camera_y'], z: machine.entry?.['camera_z'] }"
                        container-height="90vh"
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
                      :model-value="processedMqttTopic?.find(t => t.value === mqttTopicId)?.title"
                      label="MQTT Topic" 
                      disabled 
                    />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField
                      v-model="name"
                      label="Parameter Name"
                      disabled
                    />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField
                      v-model="code"
                      label="Code"
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
                      v-model="category"
                      label="Category"
                      disabled
                    />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField
                      v-model="minValue"
                      label="Min Value"
                      disabled
                    />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField
                      v-model="maxValue"
                      label="Max Value"
                      disabled
                    />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField
                      :model-value="isDisplay ? 'Active' : 'Inactive'"
                      label="Is Display"
                      disabled
                    />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField
                      :model-value="isAutomatic ? 'Automatic' : 'Manual'"
                      label="Is Automatic"
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
                data-testid="prev-btn"
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
                data-testid="submit-btn"
              >
                Submit
              </VBtn>
              
              <VBtn
                v-else
                @click="currentStep++"
                data-testid="next-btn"
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
