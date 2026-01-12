<script setup>
import AlertDialog from "@/components/general/AlertDialog.vue"
import GeneralAlert from "@/components/general/GeneralAlert.vue"
import { useManageParameter } from "@/composables/useManageParameter.js"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import * as THREE from 'three'
import * as ThreeMeshUI from "three-mesh-ui"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { nextTick, onMounted, ref } from 'vue'


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
  return isModelClickable.value ? "Click Again to Off Set Position" : "Click on 3D Model to Set Position"
})


const wrapperRef = ref(null)
const canvasRef = ref(null)

let scene, camera, renderer, controls
let model = null

// marker untuk parameter ini
let parameterMarker = null
const showAdjustPopup = ref(false)
const bodyAlert = ref('')
const titleAlert = ref('')
const alertType = ref('info')

onMounted(async () => {
  await fetchParameterDependency()
  let result = await fetchParameter(id.value)
  await fetchParameters({isAutomatic: null})
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
    machineId.value = processedParameter['mqtt_topic']['machine_id'] != 0 ? processedParameter['mqtt_topic']['machine_id'] :processedParameter['machine_id']
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
        parameter_id: processedParameterSequence.parameter_id
      }
    })
    initialModel()
  }else{
    id.value = null
  }
})


// ----------------------------------------
// Helper: Hapus marker dari scene
// ----------------------------------------
const removeMarker = marker => {
  if (!marker || !scene) return

  while (marker.children.length > 0) {
    const child = marker.children[0]

    marker.remove(child)
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => {
          if (m.map) m.map.dispose()
          m.dispose()
        })
      } else {
        if (child.material.map) child.material.map.dispose()
        child.material.dispose()
      }
    }
  }

  if (marker.clear) marker.clear()
  if (marker.parent) {
    marker.parent.remove(marker)
  }
  scene.remove(marker)
}

// ----------------------------------------
// Create marker/label
// ----------------------------------------
const createMarker = (parameterName, parameterValue, position) => {
  const panel = new ThreeMeshUI.Block({
    width: 10,
    height: 5,
    padding: 0.03,
    borderRadius: 0.05,
    justifyContent: 'center',
    alignContent: 'center',
    fontSize: 1.5,
    backgroundColor: new THREE.Color(0x222222),
    backgroundOpacity: 0.85,
    fontFamily: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json',
    fontTexture: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png',
  })

  const titleText = new ThreeMeshUI.Text({ content: parameterName })
  const valueText = new ThreeMeshUI.Text({ content: parameterValue })

  panel.add(titleText)
  panel.add(valueText)

  panel.position.copy(position)
  scene.add(panel)

  return panel
}

// ----------------------------------------
// Update marker position
// ----------------------------------------
const updateMarkerPosition = value => {
  if (parameterMarker) {
    parameterMarker.position.set(
      positionX.value,
      positionY.value,
      positionZ.value,
    )

    parameterMarker.rotation.set(
      rotationX.value,
      rotationY.value,
      rotationZ.value,
    )
  }
}

// ----------------------------------------
// Update marker rotation
// ----------------------------------------
const updateMarkerRotation = () => {
  if (parameterMarker) {
    parameterMarker.rotation.set(
      THREE.MathUtils.degToRad(rotationX.value),
      THREE.MathUtils.degToRad(rotationY.value),
      THREE.MathUtils.degToRad(rotationZ.value),
    )
  }
}

// ----------------------------------------
// Click on 3D model untuk set posisi
// ----------------------------------------
const setPositionFromClick = () => {
  if (!name.value || !code.value) {
    isAlertDialogVisible.value = true
    bodyAlert.value = 'Fill Name and Parameter First!'
    titleAlert.value = "Invalid Input"
    alertType.value = 'error'

    return
  }
  isModelClickable.value = !isModelClickable.value

  // Hapus marker lama jika ada
  if (parameterMarker) {
    removeMarker(parameterMarker)
    parameterMarker = null
  }

  // Tunggu user klik 3D model
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  const handleClick = event => {
    const rect = renderer.domElement.getBoundingClientRect()

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(scene.children, true)

    if (intersects.length > 0) {
      const point = intersects[0].point.clone()

      // Set nilai ke form
      positionX.value = point.x
      positionY.value = point.y
      positionZ.value = point.z

      const hit = intersects[0]

      const normal = hit.face.normal.clone()

      normal.transformDirection(hit.object.matrixWorld)  // convert ke world normal

      // Convert normal ke rotasi (Euler)
      const rotation = new THREE.Euler()

      rotation.setFromVector3(normal)

      // Set ke form (dalam radian)
      rotationX.value = rotation.x
      rotationY.value = rotation.y
      rotationZ.value = rotation.z

      // Buat marker
      parameterMarker = createMarker(name.value, unit.value, point)

      // Cleanup listener
      renderer.domElement.removeEventListener("click", handleClick)
      isAlertDialogVisible.value = true
      titleAlert.value = "Position successfully set"
      bodyAlert.value = "You can adjusted in Adjust Manual button"
    }
  }

  renderer.domElement.addEventListener("click", handleClick)
}

// ----------------------------------------
// Confirm & tampilkan popup untuk adjustment
// ----------------------------------------
const showAdjustment = () => {
  if (!name.value || !code.value) {
    isAlertDialogVisible.value = true
    bodyAlert.value = 'Fill Name and Parameter First!'
    alertType.value = 'error'

    return
  }

  // Buat marker jika belum ada
  if (!parameterMarker) {
    parameterMarker = createMarker(
      name.value,
      unit.value,
      new THREE.Vector3(positionX.value, positionY.value, positionZ.value),
    )
  }

  // Update marker sesuai nilai form terbaru
  updateMarkerPosition()
  updateMarkerRotation()

  showAdjustPopup.value = true
}

const confirmAdjustment = () => {
  updateMarkerPosition()
  updateMarkerRotation()
  showAdjustPopup.value = false
}

const cancelAdjustment = () => {
  showAdjustPopup.value = false
}


const initialModel = async () => {

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)

  const width = wrapperRef.value.clientWidth
  const height = wrapperRef.value.clientHeight

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(180, 70, -40)

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  })

  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  scene.add(new THREE.AmbientLight(0xffffff, 0.8))

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.4)

  dirLight.position.set(50, 100, 50)
  scene.add(dirLight)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.screenSpacePanning = true

  // ----------------------------------------
  // LOAD MODEL
  // ----------------------------------------
  const loader = new GLTFLoader()

  if (modelPath.value) {
    loadDynamicModel()
  }


  // ----------------------------------------
  // ANIMATE
  // ----------------------------------------
  const animate = () => {
    requestAnimationFrame(animate)

    controls.update()

    // Marker selalu hadap kamera kecuali ada custom rotation
    if (parameterMarker && parameterMarker.parent) {
      const hasCustomRotation = (rotationX.value !== 0 || rotationY.value !== 0 || rotationZ.value !== 0)

      if (!hasCustomRotation) {
        parameterMarker.quaternion.copy(camera.quaternion)
      } else {
        parameterMarker.rotation.set(
          THREE.MathUtils.degToRad(rotationX.value),
          THREE.MathUtils.degToRad(rotationY.value),
          THREE.MathUtils.degToRad(rotationZ.value),
        )
      }
    }

    try {
      ThreeMeshUI.update()
    } catch (e) {
      console.warn('ThreeMeshUI update warning:', e.message)
    }
    renderer.render(scene, camera)
  }


  animate()

  // ----------------------------------------
  // RESIZE
  // ----------------------------------------
  window.addEventListener("resize", () => {
    const w = wrapperRef.value.clientWidth
    const h = wrapperRef.value.clientHeight

    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  })

}

const id = ref('')
const route = useRoute()
const router = useRouter()

id.value = route.params.id

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
      bodyAlert.value = "You will be redirect to parameter page"
      alertType.value = 'info'
      titleAlert.value = "Success manage Parameter"

      setTimeout(() => {
        router.push('/parameters')
      }, 2000)
    } else {
      currentStep.value = 0
      console.error('Failed to save parameter:', result.error || result.errors)
    }
  })
}

watch(currentStep, async value => {
  if (value === 1) {
    await nextTick()

    if (!wrapperRef.value) return

    initialModel()
  }
})

watch(machineId, async value => {
  if (!value) return

  await fetchMachine(value)
  await nextTick()
  modelPath.value = machine.value.entry.model_path

  // Reload 3D model
  loadDynamicModel()
})

const loadDynamicModel = () => {
  if (!scene) {
    console.warn("Scene belum siap untuk load model")

    return
  }

  if (!modelPath.value) return

  const loader = new GLTFLoader()

  // Hapus model lama
  if (model) {
    scene.remove(model)
    model.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
    })
    model = null
  }

  loader.load(useStaticFile(modelPath.value), gltf => {
    model = gltf.scene
    model.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())

    model.position.sub(center)

    scene.add(model)
  })
}

watch([modelPath, () => scene], async () => {
  if (scene && modelPath.value) {
    loadDynamicModel()
  }
})

watch(parameters, () => {
  const list = parameters.value['entries']

  if (!Array.isArray(list)) return []
  processedParameters.value = list.map((parameter) => {
    return {
      title: parameter.code,
      value: parameter.id
    }
  })
})

const availableOps = [
  { title: 'Add (+)', value: 'ADDITION' },
  { title: 'Subtract (-)', value: 'SUBTRACTION' },
  { title: 'Multiply (×)', value: 'MULTIPLICATION' },
  { title: 'Divide (÷)', value: 'DIVISION' },
]

// Add new operation
function addOperation() {
  processedParameterSequences.value.push({
    type: 'ADDITION',
    parameter_id: null,
  })

}

// Remove operation
function removeOperation(index) {
  const op = processedParameterSequences.value[index]

  // jika punya id, masuk list deleted
  if (op && op.id) {
  }

  processedParameterSequences.value.splice(index, 1)
}
</script>

<template>
  <VCol cols="6">
    <h4 class="text-h4 mb-1 mt-1">
      Create New Parameter
    </h4>
    <p class="text-body-1 mb-2">
      Setup parameter location and rotation on your 3D model.
    </p>
  </VCol>
  <div class="mb-6 d-flex justify-center">
    <AppStepper v-model:current-step="currentStep" :items="numberedSteps" align="start" />
  </div>

  <VRow>
    <!-- 3D MODEL - 7 cols -->

    <!-- FORM - 5 cols -->
    <VCol cols="12">
      <VCard>
        <VCardText>
          <VForm ref="refForm" lazy-validation @submit.prevent="onSubmit">
            <VWindow v-model="currentStep" class="disable-tab-transition">
              <VWindowItem>
                <VCol>
                  <VCol cols="12">
                    <GeneralAlert v-if="formErrors.value" color="error"
                      description="There are error for some input, please fix it first!" icon="tabler-bug" />
                    <AppSelect v-model="machineId" :error="!!formErrors.machine_id"
                      :error-messages="formErrors.machine_id" :items="processedMachines" class="mt-3" label="Machine"
                      placeholder="Select a Machine" />
                  </VCol>
                  <VCol v-if="isAutomatic" cols="12">
                    <AppSelect v-model="mqttTopicId" :error="!!formErrors.mqtt_topic_id"
                      :error-messages="formErrors.mqtt_topic_id" :items="processedMqttTopic" label="MQTT Topic"
                      placeholder="Select a MQTT Topic" />
                  </VCol>


                  <VCol cols="12">
                    <AppTextField v-model="name" :error="!!formErrors.name" :error-messages="formErrors.name"
                      label="Parameter Name" placeholder="e.g., Temperature" required />
                  </VCol>

                  <VCol cols="12">
                    <AppTextField v-model="code" :error="!!formErrors.code" :error-messages="formErrors.code"
                      label="Code" placeholder="e.g., TEMP_01" required />
                  </VCol>
                  <VCol cols="12">
                    <AppSelect v-model="category" :error="!!formErrors.category"
                      :error-messages="formErrors.category" :items="[{
                        title: 'Data',
                        value: 'Data',
                      }, {
                        title: 'Status',
                        value: 'Status',
                      }, {
                        title: 'Time',
                        value: 'Time',
                      }]" label="Category" placeholder="Select a Category" />
                  </VCol>

                  <VCol cols="12">
                    <AppTextField v-model="unit" :error="!!formErrors.unit" :error-messages="formErrors.unit"
                      label="Unit" placeholder="e.g., °C" required />
                  </VCol>

                  <VCol cols="12">
                    <VRow>
                      <VCol cols="6">
                        <AppTextField v-model.number="minValue" :error="!!formErrors.min_value"
                          :error-messages="formErrors.min_value" label="Min Value" placeholder="0" type="number" />
                      </VCol>

                      <VCol cols="6">
                        <AppTextField v-model.number="maxValue" :error="!!formErrors.max_value"
                          :error-messages="formErrors.max_value" label="Max Value" placeholder="100" type="number" />
                      </VCol>
                    </VRow>
                  </VCol>
                  <VCol cols="12">
                    <AppTextField v-model="description" :error="!!formErrors.description"
                      :error-messages="formErrors.description" label="Description"
                      placeholder="Describe this parameter" />
                  </VCol>
                  <VCol cols="12" class="pa-0">
                    <VRow>
                      <VCol cols="6" md="6">
                        <VCol cols="6" md="6">
                          <VLabel class="mb-1 text-body-2 text-wrap" style="line-height: 15px;"
                            text="Is Running Time" />
                          <VSwitch v-model="isRunningTime" :label="isRunningTime ? `Yes` : `No`" />
                        </VCol>
                        <VCol cols="6" md="6">
                          <VLabel class="mb-1 text-body-2 text-wrap" style="line-height: 15px;" text="Is Processed" />
                          <VSwitch v-model="isProcessed"
                            :label="isProcessed ? `Processed Parmaeter` : `Regular Parameter`" />
                        </VCol>
                        <VBtn v-if="isProcessed" block color="primary" variant="tonal" @click="addOperation">
                          Add Operation
                        </VBtn>
                      </VCol>
                      <VCol cols="6" class="mt-4">
                        <VRow v-if="isProcessed" v-for="(op, i) in processedParameterSequences" :key="i"
                          class="align-center mb-4">
                          <VCol cols="5">
                            <VSelect v-model="op.type" :items="availableOps" label="Operation Type"
                              density="comfortable" />
                          </VCol>

                          <VCol cols="5">
                            <VSelect v-model.number="op.parameter_id" :items="processedParameters" density="comfortable"
                              :rules="[requiredValidator]" label="Parameter" />
                          </VCol>

                          <VCol cols="2" class="text-center">
                            <VBtn icon size="small" color="error" @click="removeOperation(i)">
                              <VIcon icon="tabler-trash" size="20" />
                            </VBtn>
                          </VCol>
                        </VRow>
                      </VCol>
                    </VRow>
                  </VCol>

                  <VCol cols="12">
                    <VRow>
                      <VCol cols="6" md="6">
                        <VLabel class="mb-1 text-body-2 text-wrap" style="line-height: 15px;" text="Is Display" />
                        <VSwitch v-model="isDisplay" :label="isDisplay ? `Active` : `Inactive`" />
                      </VCol>
                      <VCol cols="6" md="6">
                        <VLabel class="mb-1 text-body-2 text-wrap" style="line-height: 15px;" text="Is Automatic" />
                        <VSwitch v-model="isAutomatic" :label="isAutomatic ? `Automatic` : `Manual`" />
                      </VCol>
                    </VRow>
                  </VCol>
                  <VCol cols="12">
                    <VRow>
                      <VCol cols="12" md="6">
                        <VLabel class="mb-1 text-body-2 text-wrap" style="line-height: 15px;" text="Is Watch" />
                        <VSwitch v-model="isWatch" :label="isWatch ? `Watch` : `Ignore`" />
                      </VCol>
                      <VCol cols="12" md="6">
                        <VLabel class="mb-1 text-body-2 text-wrap" style="line-height: 15px;" text="Is Featured" />
                        <VSwitch v-model="isFeatured" :label="isFeatured ? `Yes` : `No`" />
                      </VCol>
                    </VRow>
                  </VCol>
                </VCol>
              </VWindowItem>
              <VWindowItem>
                <VRow>
                  <VCol class="h-100" cols="8">
                    <div ref="wrapperRef" class="three-wrapper rounded-lg grow">
                      <canvas ref="canvasRef" class="rounded-lg" />
                    </div>
                  </VCol>
                  <VCol cols="4">
                    <!-- Position -->
                    <VCol cols="12">
                      <VBtn :color="buttonModelColor" class="w-full" @click="setPositionFromClick">
                        {{ buttonModelText }}
                      </VBtn>
                    </VCol>
                    <VCol cols="12">
                      <h4 class="mt-1 mb-1">
                        Position
                      </h4>
                    </VCol>


                    <VCol cols="12">
                      <AppTextField v-model.number="positionX" label="Position X" type="number"
                        @update:model-value="val => updateMarkerPosition(Number(val))" />
                    </VCol>
                    <VCol cols="12">
                      <AppTextField v-model.number="positionY" label="Position Y" type="number"
                        @update:model-value="val => updateMarkerPosition(Number(val))" />
                    </VCol>
                    <VCol cols="12">
                      <AppTextField v-model.number="positionZ" label="Position Z" type="number"
                        @update:model-value="val => updateMarkerPosition(Number(val))" />
                    </VCol>
                    <VDivider class="my-2" />
                    <!-- Rotation -->
                    <VCol cols="12">
                      <h4 class="mt-1 mb-1">
                        Rotation
                      </h4>
                    </VCol>
                    <VCol cols="12">
                      <AppTextField v-model.number="rotationX" label="Rotation X" type="number" />
                    </VCol>
                    <VCol cols="12">
                      <AppTextField v-model.number="rotationY" label="Rotation Y" type="number" />
                    </VCol>
                    <VCol cols="12">
                      <AppTextField v-model.number="rotationZ" label="Rotation Z" type="number" />
                    </VCol>
                  </VCol>
                </VRow>
              </VWindowItem>
              <VWindowItem>
                <VRow>
                  <VCol cols="12">
                    <h4 class="text-h5 mb-4">
                      Summary
                    </h4>
                  </VCol>
                  <VCol cols="12">
                    <VAlert type="info" variant="tonal" class="mb-4">
                      Please review all information carefully before submitting.
                    </VAlert>
                  </VCol>

                  <!-- Machine & MQTT -->
                  <VCol cols="6">
                    <AppTextField :model-value="processedMachines?.find(m => m.value === machineId)?.title"
                      label="Machine" disabled />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField :model-value="processedMqttTopic?.find(t => t.value === mqttTopicId)?.title"
                      label="MQTT Topic" disabled />
                  </VCol>

                  <!-- Basic Info -->
                  <VCol cols="6">
                    <AppTextField v-model="name" label="Parameter Name" disabled />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField v-model="code" label="Code" disabled />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField v-model="unit" label="Unit" disabled />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField v-model="category" label="Category" disabled />
                  </VCol>

                  <!-- Value Range -->
                  <VCol cols="6">
                    <AppTextField v-model="minValue" label="Min Value" disabled />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField v-model="maxValue" label="Max Value" disabled />
                  </VCol>

                  <!-- Flags -->
                  <VCol cols="6">
                    <AppTextField :model-value="isDisplay ? 'Active' : 'Inactive'" label="Is Display" disabled />
                  </VCol>

                  <VCol cols="6">
                    <AppTextField :model-value="isAutomatic ? 'Automatic' : 'Manual'" label="Is Automatic" disabled />
                  </VCol>

                  <!-- Position -->
                  <VCol cols="12">
                    <VDivider class="my-3" />
                    <h4 class="text-h6 mb-2">
                      Position
                    </h4>
                  </VCol>

                  <VCol cols="4">
                    <AppTextField v-model="positionX" label="Position X" disabled />
                  </VCol>
                  <VCol cols="4">
                    <AppTextField v-model="positionY" label="Position Y" disabled />
                  </VCol>
                  <VCol cols="4">
                    <AppTextField v-model="positionZ" label="Position Z" disabled />
                  </VCol>

                  <!-- Rotation -->
                  <VCol cols="12">
                    <h4 class="text-h6 mt-4 mb-2">
                      Rotation
                    </h4>
                  </VCol>

                  <VCol cols="4">
                    <AppTextField v-model="rotationX" label="Rotation X" disabled />
                  </VCol>
                  <VCol cols="4">
                    <AppTextField v-model="rotationY" label="Rotation Y" disabled />
                  </VCol>
                  <VCol cols="4">
                    <AppTextField v-model="rotationZ" label="Rotation Z" disabled />
                  </VCol>
                </VRow>
              </VWindowItem>
            </VWindow>
            <div class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center mt-8">
              <VBtn :disabled="currentStep === 0" color="secondary" variant="tonal" @click="currentStep--">
                <VIcon class="flip-in-rtl" icon="tabler-arrow-left" start />
                Previous
              </VBtn>
              <VBtn v-if="numberedSteps.length - 1 === currentStep" color="success" @click="onSubmit">
                Submit
              </VBtn>
              <VBtn v-else @click="currentStep++">
                Next
                <VIcon class="flip-in-rtl" end icon="tabler-arrow-right" />
              </VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
  <AlertDialog :body-alert="bodyAlert" :is-dialog-visible="isAlertDialogVisible" :title-alert="titleAlert"
    :type="alertType" @update:is-dialog-visible="isAlertDialogVisible = $event" />
</template>

<style scoped>
.three-wrapper {
  width: 100%;
  height: 90vh;
  min-height: 100px;
  position: relative;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
