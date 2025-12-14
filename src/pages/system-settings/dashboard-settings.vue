<script setup>
import { ref, reactive, watch, onMounted, nextTick } from 'vue'
import AppTextField from '@core/components/app-form-elements/AppTextField.vue'
import Vue3Dropzone from '@jaxtheprime/vue3-dropzone'
import '@jaxtheprime/vue3-dropzone/dist/style.css'

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'


const {
  systemSetting,
  saveSystemSetting,
} = useManageSystemSetting()

/* =========================
   FORM STATE (PERSISTED)
========================= */
const localForm = reactive({
  id: null,
  key: 'DASHBOARD_SETTINGS',
  description: '',
  model: null,
  modelUrl: null,

  camera: {
    x: 2,
    y: 1.5,
    z: 3,
    zoom: 1,
  },
})

const formErrors = reactive({})
const isAlertDialogVisible = ref(false)
const bodyAlert = ref('')
const titleAlert = ref('')
const alertType = ref('info')

/* =========================
   THREE.JS STATE (RUNTIME)
========================= */
const threeContainer = ref(null)

let renderer = null
let scene = null
let camera = null
let controls = null
let model = null

/* =========================
   WATCH MODEL UPLOAD
========================= */
watch(
  () => localForm.model,
  val => {
    if (val?.[0]?.file) {
      localForm.modelUrl = URL.createObjectURL(val[0].file)
      nextTick(initThreePreview)
    } else {
      destroyPreview()
    }
  },
  { deep: true },
)

/* =========================
   THREE.JS FUNCTIONS
========================= */
function initThreePreview() {
  if (!threeContainer.value || !localForm.modelUrl) return

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

  // Camera (restore saved state)
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(
    localForm.camera.x,
    localForm.camera.y,
    localForm.camera.z,
  )
  camera.zoom = localForm.camera.zoom
  camera.updateProjectionMatrix()

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.addEventListener('end', syncCameraState)

  // Light
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1))

  // Load Model
  const loader = new GLTFLoader()

  loader.load(localForm.modelUrl, gltf => {
    model = gltf.scene
    model.updateMatrixWorld(true)

    // center model
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())

    model.position.x -= center.x
    model.position.y -= 0.2
    model.position.z -= center.z
    model.position.x -= 0.3
    scene.add(model)
  })

  animate()
}

function animate() {
  if (!renderer) return
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

function syncCameraState() {
  if (!camera) return

  localForm.camera.x = Number(camera.position.x.toFixed(4))
  localForm.camera.y = Number(camera.position.y.toFixed(4))
  localForm.camera.z = Number(camera.position.z.toFixed(4))
  localForm.camera.zoom = Number(camera.zoom.toFixed(4))
}

function destroyPreview() {
  if (renderer) {
    renderer.dispose()
    renderer = null
  }
  if (threeContainer.value) {
    threeContainer.value.innerHTML = ''
  }
}

const router = useRouter()

/* =========================
   SUBMIT / PAYLOAD
========================= */
const onSubmit = async () => {
  formErrors.value = {}

  const payload = {
    key: localForm.key,
    description: localForm.description,
    value: {
      camera_x: localForm.camera.x,
      camera_y: localForm.camera.y,
      camera_z: localForm.camera.z,
      model: localForm.model?.[0]?.file || null,
    },
  }


  const result = await saveSystemSetting(payload)
  if (result.success) {
    isAlertDialogVisible.value = true
    bodyAlert.value = "You will be redirect to parameter page"
    alertType.value = 'info'
    titleAlert.value = "Success manage Parameter"

    setTimeout(() => {
      router.push('/system-settings')
    }, 2000)
  } else {
    // errors are already populated into formErrors by composable
    console.error('submit failed', result)
  }
}
</script>

<template>
  <VCol cols="12">
    <h4 class="text-h4 mb-1">
      Manage Dashboard Settings
    </h4>
    <p class="text-body-1 mb-4">
      Configure dashboard model and camera position
    </p>

    <VCard>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="localForm.key"
              disabled
              label="Key"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="localForm.description"
              label="Description"
              placeholder="Dashboard configuration description"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <p class="text-body-2 mb-2">
              3D Model
            </p>
            <Vue3Dropzone
              v-model="localForm.model"
              :max-file-size="500"
              :multiple="false"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <p class="text-body-2 mb-2">
              3D Preview
            </p>
            <div
              ref="threeContainer"
              class="rounded-lg overflow-hidden"
              style="width: 100%; height: 300px; border: 1px solid #e0e0e0;"
            />
          </VCol>

          <!-- Camera Info (readonly preview) -->
          <VCol cols="12">
            <VRow>
              <VCol cols="3">
                <AppTextField
                  :model-value="localForm.camera.x"
                  disabled
                  label="Camera X"
                />
              </VCol>
              <VCol cols="3">
                <AppTextField
                  :model-value="localForm.camera.y"
                  disabled
                  label="Camera Y"
                />
              </VCol>
              <VCol cols="3">
                <AppTextField
                  :model-value="localForm.camera.z"
                  disabled
                  label="Camera Z"
                />
              </VCol>
              <VCol cols="3">
                <AppTextField
                  :model-value="localForm.camera.zoom"
                  disabled
                  label="Zoom"
                />
              </VCol>
            </VRow>
          </VCol>
        </VRow>

        <div class="d-flex justify-end mt-6">
          <VBtn
            color="success"
            @click="onSubmit"
          >
            Save Settings
          </VBtn>
        </div>
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
