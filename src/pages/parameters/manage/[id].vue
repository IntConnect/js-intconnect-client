<script setup>
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import * as ThreeMeshUI from "three-mesh-ui"
import * as THREE from 'three'
import { onMounted, ref, reactive, nextTick } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import AdjustParameterLocationDrawer from "@/components/drawer/AdjustParameterLocationDrawer.vue"
import AlertDialog from "@/components/general/AlertDialog.vue"
import { useManageParameter } from "@/composables/useManageParameter.js"


// ==========================================
// Composable
// ==========================================
const {
  parameters,
  parameterDependency,
  loading,
  actionLoading,
  fetchParameterDependency,
  totalItems,
  saveParameter,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
} = useManageParameter()


// ==========================================
// State
// ==========================================
const name = ref('')
const machineId = ref('')
const mqttTopicId = ref('')
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
const modelLoaded = ref(false)
const processedMachines = ref([])
const processedMqttTopic = ref([])
const isAlertDialogVisible = ref(false)
const isModelClickable = ref(false)
const refForm = ref()

const buttonModelColor = computed(() => {
  return isModelClickable.value ? "warning" : "info"
})
const buttonModelText = computed(() => {
  return isModelClickable.value ? "Click Again to Off Set Position" : "Click on 3D Model to Set Position"
})


const form = ref()
const wrapperRef = ref(null)
const canvasRef = ref(null)

let scene, camera, renderer, controls
let model = null

// marker untuk parameter ini
let parameterMarker = null
const showAdjustPopup = ref(false)
const titleAlert = ref('')


onMounted(async () => {
  await fetchParameterDependency()
  await nextTick()
  processedMachines.value = parameterDependency.value.entry.machines?.map(machine => ({
    title: machine.name,
    value: machine.id,
  }))
  processedMqttTopic.value = parameterDependency.value.entry.mqtt_topics?.map(mqtt_topic => ({
    title: mqtt_topic.name,
    value: mqtt_topic.id,
  }))
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
const updateMarkerPosition = (value) => {
  if (parameterMarker) {
    parameterMarker.position.set(
      positionX.value,
      positionY.value,
      positionZ.value,
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
    titleAlert.value = 'Fill Name and Parameter First!'
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

      // Buat marker
      parameterMarker = createMarker(name.value, unit.value, point)

      // Cleanup listener
      renderer.domElement.removeEventListener("click", handleClick)
      isAlertDialogVisible.value = true
      titleAlert.value = 'Position successfully set! you can adjusted in Adjust Manual button '
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
    titleAlert.value = 'Fill Name and Parameter First!'
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

// ----------------------------------------
// INIT 3D
// ----------------------------------------
onMounted(async () => {
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 100))

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

  loader.load("/models/schema-5.glb", gltf => {
    model = gltf.scene
    modelLoaded.value = true

    model.updateMatrixWorld(true)

    model.traverse(child => {
      if (child.isMesh) {
        child.castShadow = false
        child.receiveShadow = false
        if (child.material) {
          child.material.needsUpdate = false
        }
      }
    })

    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())

    model.position.x -= center.x
    model.position.y -= center.y
    model.position.z -= center.z
    model.position.x -= 0.3

    scene.add(model)
  })

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
})


const onSubmit = () => {
  refForm.value.validate().then(async ({ valid }) => {
    if (!valid) return

    const parameterData = {
      name: name.value,
      code: code.value,
      unit: unit.value,
      min_value: minValue.value,
      max_value: maxValue.value,
      description: description.value,
      machine_id: machineId.value,
      mqtt_topic_id: mqttTopicId.value,
      position_x: positionX.value,
      position_y: positionY.value,
      position_z: positionZ.value,
      rotation_x: rotationX.value,
      rotation_y: rotationY.value,
      rotation_z: rotationZ.value,
    }

    const result = await saveParameter(parameterData)

    if (result.success) {
      await nextTick()

      isAlertDialogVisible.value = true
      titleAlert.value = 'Success manage Parameter'
    } else {
      console.error('Failed to save parameter:', result.error || result.errors)
    }
  })
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
  <VRow>
    <!-- 3D MODEL - 7 cols -->
    <VCol cols="7">
      <div
        ref="wrapperRef"
        class="three-wrapper rounded-lg grow"
      >
        <canvas
          ref="canvasRef"
          class="rounded-lg"
        />
      </div>


      <AdjustParameterLocationDrawer
        v-model:is-drawer-open="showAdjustPopup"
        v-model:position-x="positionX"
        v-model:position-y="positionY"
        v-model:position-z="positionZ"
        v-model:rotation-x="rotationX"
        v-model:rotation-y="rotationY"
        v-model:rotation-z="rotationZ"
        @submit="($event) => { updateMarkerPosition($event); showAdjustPopup = false }"

        @update:is-position-changed="updateMarkerPosition"
      />


    </VCol>

    <!-- FORM - 5 cols -->
    <VCol cols="5">
      <VCard>
        <VCardText>
          <VForm
            ref="refForm"
            lazy-validation
            @submit.prevent="onSubmit"
          >
            <VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="machineId"
                  :error="!!formErrors.machine_id"
                  :error-messages="formErrors.machine_id"
                  :items="processedMachines"
                  label="Machine"
                  placeholder="Select a Machine"
                />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="mqttTopicId"
                  :error="!!formErrors.mqtt_topic_id"
                  :error-messages="formErrors.mqtt_topic_id"
                  :items="processedMqttTopic"
                  label="MQTT Topic"
                  placeholder="Select a MQTT Topic"
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

              <VCol cols="12">
                <VBtn
                  :color="buttonModelColor"
                  class="w-full"
                  @click="setPositionFromClick"
                >
                  {{ buttonModelText }}
                </VBtn>
              </VCol>
              <VCol
                class="d-flex flex-wrap gap-3"
                cols="12"
              >
                <VBtn
                  class="flex-1"
                  color="primary"
                  @click="showAdjustment"
                >
                  Adjust Manual
                </VBtn>

                <VBtn
                  class="flex-1"
                  color="success"
                  type="submit"
                >
                  Save Parameter
                </VBtn>
              </VCol>
            </VCol>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
  <AlertDialog :is-dialog-visible="isAlertDialogVisible"
               :title-alert="titleAlert"
               @update:isDialogVisible="isAlertDialogVisible = $event"

  />
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
