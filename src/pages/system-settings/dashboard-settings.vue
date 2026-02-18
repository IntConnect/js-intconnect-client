<script setup>
import AppTextField from '@core/components/app-form-elements/AppTextField.vue'
import Vue3Dropzone from '@jaxtheprime/vue3-dropzone'
import '@jaxtheprime/vue3-dropzone/dist/style.css'
import { nextTick, onMounted, reactive, ref, watch } from 'vue'

import { useManageMachine } from '@/composables/useManageMachine'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'


const {
  systemSetting,
  saveSystemSetting,
  fetchSystemSetting,
  formErrors,
} = useManageSystemSetting()

const {
  machines,
  fetchMachines,
} = useManageMachine()

const processedMachines = computed(() => {
  const machineList = machines.value['entries']

  if (!Array.isArray(machineList)) return []

  return machineList.map(machine => ({
    title: machine.code,
    value: machine.id,
  }))
})

const {
  errors: dropzoneError,
  handleFileRejected,
  clearError,
  clearAllErrors,
} = useDropzoneValidation()


const pinMode = ref(false)
const selectedPinObject = ref(null)
let lastPinnedObject = null


/* =========================
   FORM STATE (PERSISTED)
========================= */
const localForm = reactive({
  id: null,
  showing: 'Executive',
  machineId: null,
  key: 'DASHBOARD_SETTINGS',
  description: '',
  model: null,
  modelUrl: null,
  existingModelUrl: null,
  pinObjectName: "",
  camera: {
    x: 2,
    y: 1.5,
    z: 3,
  },
})

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
      localForm.existingModelUrl = null
      nextTick(initThreePreview)
    } else {
      destroyPreview()
    }
  },
  { deep: true },
)

watch(
  () => localForm.existingModelUrl,
  val => {
    if (val) {
      localForm.modelUrl = val
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
  camera.updateProjectionMatrix()

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.addEventListener('end', syncCameraState)

  // Light
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1))

  // Load Model
  const loader = new GLTFLoader()

  loader.load(localForm.existingModelUrl ? useStaticFile(localForm.modelUrl) : localForm.modelUrl, gltf => {
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

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  function onCanvasClick(event) {
    if (!pinMode.value || !scene || !camera) return

    const rect = renderer.domElement.getBoundingClientRect()

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(scene.children, true)
    if (!intersects.length) return

    const object = intersects[0].object

    markAsPin(object)
  }

  renderer.domElement.addEventListener('click', onCanvasClick)


  animate()
}

function restoreObjectMaterial(object) {
  const original = object.userData.__originalEmissive
  if (object.material?.emissive && original) {
    object.material.emissive.copy(original)
  }
}

function markAsPin(object) {
  // === RESTORE PIN SEBELUMNYA ===
  if (lastPinnedObject) {
    restoreObjectMaterial(lastPinnedObject)
    lastPinnedObject.userData.isPin = false
  }

  // === SIMPAN STATE MATERIAL AWAL (sekali saja) ===
  if (!object.userData.__originalEmissive) {
    object.userData.__originalEmissive = object.material?.emissive
      ? object.material.emissive.clone()
      : null
  }

  // === SET PIN BARU ===
  object.userData.isPin = true
  selectedPinObject.value = object
  localForm.pinObjectName = object.name
  pinMode.value = false

  if (object.material?.emissive) {
    object.material.emissive.setHex(0xff0000)
  }

  lastPinnedObject = object
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
      showing: localForm.showing,
      machine_id: localForm.machineId,
      camera_x: localForm.camera.x,
      camera_y: localForm.camera.y,
      camera_z: localForm.camera.z,
      model: localForm.model?.[0]?.file || null,
      pin_object_name: localForm.pinObjectName,
    },
  }

  const result = await saveSystemSetting(payload)
  if (result.success) {
    isAlertDialogVisible.value = true
    bodyAlert.value = "You will be redirect to system settings page"
    alertType.value = 'info'
    titleAlert.value = "Success manage Dashboard settings"

    setTimeout(() => {
      router.push('/system-settings')
    }, 2000)
  } else {
    // errors are already populated into formErrors by composable
    console.error('submit failed', result)
  }
}

onMounted(async () => {
  await fetchSystemSetting({ isMinimal: false, key: "DASHBOARD_SETTINGS" })
  await nextTick()
  await fetchMachines()
  let systemSettingData = systemSetting.value.entry
  if (systemSettingData) {
    Object.assign(localForm, {
      showing: systemSettingData.value.showing,
      machineId:  isNaN (Number(systemSettingData.value.machine_id)) ? null  : systemSettingData.value.machine_id,
      description: systemSettingData.description,
      existingModelUrl: systemSettingData.value.model_path,
      pinObjectName: systemSettingData.value.pin_object_name,
      camera: {
        x: systemSettingData.value.camera_x,
        y: systemSettingData.value.camera_y,
        z: systemSettingData.value.camera_z,
      },
    })
  }
})
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
            <AppSelect
              v-model="localForm.showing"
              :error="!!formErrors.showing"
              :error-messages="formErrors.showing || []"
              :items="[{title: 'Machine',value: 'Machine'},{title: 'Executive',value: 'Executive'}]"
              :rules="[requiredValidator]"
              label="Showing"
              placeholder="Select Showing"
              data-testid="showing-dropdown"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppSelect
              v-if="localForm.showing === 'Machine' "
              v-model="localForm.machineId"
              :error="!!formErrors.machineId"
              :error-messages="formErrors.machineId || []"
              :items="processedMachines"
              :rules="[requiredValidator]"
              label="Machine"
              placeholder="Select Machine"
              data-testid="machine-dropdown"
            />
          </VCol>
          
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
          <template 
          v-if="localForm.showing == 'Executive'"
          >

          <VCol
            cols="12"
            md="6"
          >
            <p class="text-body-2 mb-2">
              3D Model
            </p>
            <Vue3Dropzone
              v-model="localForm.model"
              :max-file-size="250"
              accept=".glb"
              mode="edit"
              @error="e => handleFileRejected('model_file' , e)"
              @file-uploaded="clearError('model_file')"
            />
            <p
              v-if="formErrors.model_file || dropzoneError.model_file"
              class="text-body-2 mt-2 text-error"
            >
              {{ formErrors.model_file || dropzoneError.model_file.message }}
            </p>
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
                  :model-value="localForm.pinObjectName"
                  :error="!!formErrors.pin_object_name"
                  :error-messages="formErrors.pin_object_name || []"
                  readonly
                  label="Selected Pin Object"
                />
              </VCol>
            </VRow>
          </VCol>
        </template>

        </VRow>

        <div class="d-flex justify-space-between mt-6 gap-4">
          <div class="d-flex flex-row gap-2">
            <p class="text-overline my-auto">
              Mode: {{ pinMode ? 'SELECTION' : 'VIEWING' }}
            </p>
            <VBtn
              color="primary"
              variant="outlined"
              @click="pinMode = !pinMode"
              v-if="localForm.showing == 'Executive'"
            >
              {{ pinMode ? 'Cancel Pin Selection' : 'Select Pin Object' }}
            </VBtn>
          </div>
          <div class="d-flex flex-row gap-2">
            <VBtn
              color="error"
              variant="tonal"
              to="/system-settings"
              data-testid="back-button"
            >
              <VIcon
                start
                icon="tabler-arrow-left"
              />
              Back
            </VBtn>


            <VBtn
              color="success"
              @click="onSubmit"
            >
              Save Settings
            </VBtn>
          </div>
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
