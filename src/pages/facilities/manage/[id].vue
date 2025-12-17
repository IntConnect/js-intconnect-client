<script setup>
import { ref, reactive, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import AppTextField from '@core/components/app-form-elements/AppTextField.vue'
import Vue3Dropzone from '@jaxtheprime/vue3-dropzone'
import '@jaxtheprime/vue3-dropzone/dist/style.css'

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'


const route = useRoute()
const router = useRouter()
let id = route.params.id

const {
  errors: dropzoneError,
  handleFileRejected,
  clearError,
  clearAllErrors,
} = useDropzoneValidation()

const {
  facility,
  fetchFacility,
  saveFacility,
  actionLoading,
} = useManageFacility()

const {
  systemSetting,
  fetchSystemSetting,
} = useManageSystemSetting()

const isEditMode = ref(false)


// ==========================================
// Form State
// ==========================================
const isFormValid = ref(false)
const refForm = ref()

// Form fields
const name = ref('')
const code = ref('')
const description = ref('')
const location = ref('')
const thumbnail = ref([])
const existingThumbnail = ref([])
const uploadedModel = ref([])
const positionX = ref(0)
const positionY = ref(0)
const positionZ = ref(0)
const cameraX = ref(0)
const cameraY = ref(0)
const cameraZ = ref(0)
let transformControls = null
let pinnedObject = null

// Preview state
let previewRenderer = null
let previewScene = null
let previewCamera = null
let previewControls = null
let previewModel = null

const formErrors = reactive({})
const isAlertDialogVisible = ref(false)
const bodyAlert = ref('')
const titleAlert = ref('')
const alertType = ref('info')

/* =========================
   THREE.JS STATE (RUNTIME)
========================= */
const threeContainer = ref(null)
const threePreviewContainer = ref(null)

let renderer = null
let scene = null
let camera = null
let controls = null
let model = null

const thumbnailFile = computed(() => thumbnail.value[0]?.file || null)
const uploadedModelFile = computed(() => uploadedModel.value[0]?.file || null)

/* =========================
   WATCH MODEL UPLOAD
========================= */
watch(
  () => systemSetting.value,
  val => {
    if (val?.entry?.value) {
      initThreePreview(val.entry.value)
    }
  },
  { deep: true },
)

watch(
  () => uploadedModel.value,
  val => {
    if (val?.[0]?.file) {
      const url = URL.createObjectURL(val[0].file)


      // false = don't restore camera, use auto-fit for new uploads
      initModelPreview(url, false)
    } else {
      destroyModelPreview()
    }
  },
  { deep: true },
)

/* =========================
   POSITION PREVIEW (Main)
========================= */
function initThreePreview(config) {
  const pinObjectName = config.pin_object_name
  if (!threeContainer.value || !config.model_path) return

  destroyPreview()

  const width = threeContainer.value.clientWidth
  const height = 300

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  threeContainer.value.appendChild(renderer.domElement)

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)

  // Camera
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(
    config.camera_x,
    config.camera_y,
    config.camera_z,
  )
  camera.updateProjectionMatrix()

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  // Transform Controls
  transformControls = new TransformControls(camera, renderer.domElement)
  transformControls.setMode('translate')
  transformControls.setSpace('world')
  scene.add(transformControls.getHelper()) // Add transformControls itself, not getHelper()

  // Disable orbit saat drag
  transformControls.addEventListener('dragging-changed', e => {
    controls.enabled = !e.value
  })

  transformControls.addEventListener('objectChange', () => {
    if (!pinnedObject) return

    const worldPos = new THREE.Vector3()

    pinnedObject.getWorldPosition(worldPos)

    positionX.value = Number(worldPos.x.toFixed(4))
    positionY.value = Number(worldPos.y.toFixed(4))
    positionZ.value = Number(worldPos.z.toFixed(4))
  })

  // Light
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1))

  // Load Model
  const loader = new GLTFLoader()

  loader.load(useStaticFile(config.model_path), gltf => {
    model = gltf.scene
    model.updateMatrixWorld(true)

    // Center model
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())

    model.position.x -= center.x
    model.position.y -= 0.2
    model.position.z -= center.z
    model.position.x -= 0.3
    scene.add(model)

    // Find and attach pinned object
    pinnedObject = model.getObjectByName(pinObjectName)
    if (pinnedObject) {
      transformControls.attach(pinnedObject)

      // Restore saved position
      if (positionX.value !== 0 || positionY.value !== 0 || positionZ.value !== 0) {
        const worldPos = new THREE.Vector3(positionX.value, positionY.value, positionZ.value)
        const localPos = pinnedObject.parent.worldToLocal(worldPos)

        pinnedObject.position.copy(localPos)
      }
    }
  })

  animateMain()
}

function animateMain() {
  if (!renderer) return
  requestAnimationFrame(animateMain)
  controls.update()
  renderer.render(scene, camera)
}

function destroyPreview() {
  if (transformControls) {
    transformControls.detach()
    transformControls.dispose()
    transformControls = null
  }

  if (controls) {
    controls.dispose()
    controls = null
  }

  if (renderer) {
    renderer.dispose()
    renderer = null
  }

  if (threeContainer.value) {
    threeContainer.value.innerHTML = ''
  }

  scene = null
  camera = null
  model = null
  pinnedObject = null
}

/* =========================
   MODEL PREVIEW (Uploaded)
========================= */
function initModelPreview(modelUrl, shouldRestoreCamera = false) {
  if (!threePreviewContainer.value || !modelUrl) return

  destroyModelPreview()

  const width = threePreviewContainer.value.clientWidth
  const height = 300

  // Renderer
  previewRenderer = new THREE.WebGLRenderer({ antialias: true })
  previewRenderer.domElement.style.width = '100%'
  previewRenderer.domElement.style.height = '100%'
  previewRenderer.domElement.style.display = 'block'
  previewRenderer.setSize(width, height)
  previewRenderer.setPixelRatio(window.devicePixelRatio)
  threePreviewContainer.value.appendChild(previewRenderer.domElement)

  // Scene
  previewScene = new THREE.Scene()
  previewScene.background = new THREE.Color(0xf5f5f5)

  // Camera - set default position first
  previewCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  previewCamera.position.set(0, 2, 5)
  previewCamera.updateProjectionMatrix()

  // Controls
  previewControls = new OrbitControls(previewCamera, previewRenderer.domElement)
  previewControls.enableDamping = true
  previewControls.dampingFactor = 0.05
  previewControls.addEventListener('end', syncPreviewCameraState)

  // Light
  previewScene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1))

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)

  directionalLight.position.set(5, 10, 7.5)
  previewScene.add(directionalLight)

  // Load uploaded model
  const loader = new GLTFLoader()

  loader.load(
    isEditMode.value ? useStaticFile(modelUrl) : modelUrl,
    gltf => {
      previewModel = gltf.scene
      previewModel.updateMatrixWorld(true)

      // Center model
      const box = new THREE.Box3().setFromObject(previewModel)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      previewModel.position.x -= center.x
      previewModel.position.y -= center.y
      previewModel.position.z -= center.z

      previewScene.add(previewModel)

      // Check if we should restore saved camera position or auto-fit
      const hasSavedCamera = shouldRestoreCamera && (
        cameraX.value !== 0 ||
        cameraY.value !== 0 ||
        cameraZ.value !== 0
      )

      if (hasSavedCamera) {
        console.log(cameraX.value)

        // Restore saved camera position
        previewCamera.position.set(
          cameraX.value,
          cameraY.value,
          cameraZ.value,
        )
        previewCamera.updateProjectionMatrix()
        previewControls.update()
      } else {
        // Auto-fit camera for new uploads
        const maxDim = Math.max(size.x, size.y, size.z)
        const fov = previewCamera.fov * (Math.PI / 180)
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
        cameraZ *= 1.5

        previewCamera.position.z = cameraZ
        previewControls.update()

        // Sync camera state after auto-fit
        syncPreviewCameraState()
      }
    },
    undefined,
    error => {
      console.error('Error loading preview model:', error)
    },
  )

  animatePreview()
}

function animatePreview() {
  if (!previewRenderer) return
  requestAnimationFrame(animatePreview)
  previewControls.update()
  previewRenderer.render(previewScene, previewCamera)
}

function syncPreviewCameraState() {
  if (!previewCamera) return

  cameraX.value = Number(previewCamera.position.x.toFixed(4))
  cameraY.value = Number(previewCamera.position.y.toFixed(4))
  cameraZ.value = Number(previewCamera.position.z.toFixed(4))
}

function destroyModelPreview() {
  if (previewControls) {
    previewControls.removeEventListener('end', syncPreviewCameraState)
    previewControls.dispose()
    previewControls = null
  }

  if (previewRenderer) {
    previewRenderer.dispose()
    previewRenderer = null
  }

  if (threePreviewContainer.value) {
    threePreviewContainer.value.innerHTML = ''
  }

  previewScene = null
  previewCamera = null
  previewModel = null
}

/* =========================
   SUBMIT / PAYLOAD
========================= */
const onSubmit = async () => {
  formErrors.value = {}

  const payload = {
    id: id,
    name: name.value,
    code: code.value,
    description: description.value,
    location: location.value,
    thumbnail: thumbnailFile.value,
    model: uploadedModelFile.value,
    position_x: positionX.value,
    position_y: positionY.value,
    position_z: positionZ.value,
    camera_x: cameraX.value,
    camera_y: cameraY.value,
    camera_z: cameraZ.value,
  }

  const result = await saveFacility(payload)
  if (result.success) {
    isAlertDialogVisible.value = true
    bodyAlert.value = "You will be redirected to facilities page"
    alertType.value = 'info'
    titleAlert.value = "Success manage Facilities"

    setTimeout(() => {
      router.push('/facilities')
    }, 2000)
  } else {
    console.error('submit failed', result)
  }
}

onMounted(async () => {
  let facilityResult = await fetchFacility(id)
  await fetchSystemSetting("DASHBOARD_SETTINGS")
  await nextTick()

  if (facilityResult.success) {
    isEditMode.value = true
    let processedFacility = facility.value.entry
    name.value = processedFacility.name
    code.value = processedFacility.code
    description.value = processedFacility.description
    location.value = processedFacility.location
    positionX.value = processedFacility.position_x || 0
    positionY.value = processedFacility.position_y || 0
    positionZ.value = processedFacility.position_z || 0
    cameraX.value = processedFacility.camera_x || 0
    cameraY.value = processedFacility.camera_y || 2
    cameraZ.value = processedFacility.camera_z || 5
    existingThumbnail.value = [useStaticFile(processedFacility.thumbnail_path)]
    initModelPreview(processedFacility.model_path, true)
  } else {
    id = null
  }
})

onBeforeUnmount(() => {
  destroyPreview()
  destroyModelPreview()
})
</script>

<template>
  <VCol cols="12">
    <h4 class="text-h4 mb-1">
      {{ isEditMode ? 'Edit' : 'Create' }} Facility
    </h4>
    <p class="text-body-1 mb-4">
      Configure facility details and position in the dashboard model
    </p>

    <VCard>
      <VCardText>
        <VForm
          ref="refForm"
          v-model="isFormValid"
          @submit.prevent="onSubmit"
        >
          <VRow>
            <VCol cols="6">
              <AppTextField
                v-model="name"
                :error-messages="formErrors.name || []"
                :rules="[requiredValidator]"
                label="Name"
                placeholder="HVAC"
              />
            </VCol>
            <VCol cols="6">
              <AppTextField
                v-model="code"
                :error-messages="formErrors.code || []"
                :rules="[requiredValidator]"
                label="Code"
                placeholder="HVAC-01"
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol cols="6">
              <AppTextField
                v-model="description"
                :error-messages="formErrors.description || []"
                :rules="[requiredValidator]"
                label="Description"
                placeholder="Area for chiller"
              />
            </VCol>
            <VCol cols="6">
              <AppTextField
                v-model="location"
                :error-messages="formErrors.location || []"
                :rules="[requiredValidator]"
                label="Location"
                placeholder="Building A, Floor 1"
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol cols="6">
              <p class="text-body-2 mb-2">
                Thumbnail
              </p>
              <Vue3Dropzone
                v-model="thumbnail"
                v-model:previews="existingThumbnail"
                :max-file-size="1"
                accept="image/png, image/jpeg"
                mode="edit"
                @error="e => handleFileRejected('thumbnail' , e)"
                @file-uploaded="clearError('thumbnail')"
              />
              <p
                v-if="formErrors.thumbnail || dropzoneError.thumbnail"
                class="text-body-2 mt-2 text-danger"
              >
                {{ formErrors.thumbnail || dropzoneError.thumbnail.message }}
              </p>
            </VCol>

            <VCol cols="6">
              <p class="text-body-2 mb-2">
                Facility Position (Drag the object)
              </p>
              <div
                ref="threeContainer"
                class="rounded-lg overflow-hidden"
                style="width: 100%; height: 300px; border: 1px solid #e0e0e0;"
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol cols="4">
              <AppTextField
                v-model="positionX"
                disabled
                label="Position X"
              />
            </VCol>
            <VCol cols="4">
              <AppTextField
                v-model="positionY"
                disabled
                label="Position Y"
              />
            </VCol>
            <VCol cols="4">
              <AppTextField
                v-model="positionZ"
                disabled
                label="Position Z"
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol cols="6">
              <p class="text-body-2 mb-2">
                3D Model {{ isEditMode ? '(Optional)' : '' }}
              </p>
              <Vue3Dropzone
                v-model="uploadedModel"
                :max-file-size="500"
                :multiple="false"
                accept=".glb,.gltf"
                @error="e => handleFileRejected('model' , e)"
                @file-uploaded="clearError('model')"
              />
              <p
                v-if="formErrors.model || dropzoneError.model"
                class="text-body-2 mt-2 text-danger"
              >
                {{ formErrors.model || dropzoneError.model.message }}
              </p>
            </VCol>
            <VCol cols="6">
              <p class="text-body-2 mb-2">
                3D Preview (Rotate to set camera)
              </p>
              <div
                ref="threePreviewContainer"
                class="rounded-lg overflow-hidden"
                style="width: 100%; height: 300px; border: 1px solid #e0e0e0; background: #f5f5f5;"
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol cols="4">
              <AppTextField
                v-model="cameraX"
                disabled
                label="Camera X"
              />
            </VCol>
            <VCol cols="4">
              <AppTextField
                v-model="cameraY"
                disabled
                label="Camera Y"
              />
            </VCol>
            <VCol cols="4">
              <AppTextField
                v-model="cameraZ"
                disabled
                label="Camera Z"
              />
            </VCol>
          </VRow>

          <!-- Actions -->
          <VCol cols="12">
            <div class="d-flex justify-end gap-3">
              <VBtn
                color="error"
                variant="tonal"
                @click="router.push('/facilities')"
              >
                Cancel
              </VBtn>
              <VBtn
                :loading="actionLoading"
                color="primary"
                type="submit"
              >
                {{ isEditMode ? 'Update' : 'Create' }}
              </VBtn>
            </div>
          </VCol>
        </VForm>
      </VCardText>
    </VCard>
  </VCol>
  <AlertDialog
    :body-alert="bodyAlert"
    :is-dialog-visible="isAlertDialogVisible"
    :title-alert="titleAlert"
    :type="alertType"
    @update:is-dialog-visible="isAlertDialogVisible = $event"
  />
</template>
