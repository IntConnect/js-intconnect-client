<script setup>
import { ref, reactive, watch, onMounted, nextTick } from 'vue'
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
let transformControls = null
let pinnedObject = null

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
  () => systemSetting.value,
  val => {
    console.log(val)
    initThreePreview(val.entry.value)
  },
  { deep: true },
)

const thumbnailFile = computed(() => thumbnail.value[0]?.file || null)
const uploadedModelFile = computed(() => uploadedModel.value[0]?.file || null)

/* =========================
   THREE.JS FUNCTIONS
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

  // Camera (restore saved state)
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
  controls.addEventListener('end', syncCameraState)
  transformControls = new TransformControls(camera, renderer.domElement)
  transformControls.setMode('translate') // move only
  transformControls.setSpace('world')
  scene.add(transformControls.getHelper())

// disable orbit saat drag
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

    // center model
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())

    model.position.x -= center.x
    model.position.y -= 0.2
    model.position.z -= center.z
    model.position.x -= 0.3
    scene.add(model)

    pinnedObject = model.getObjectByName(pinObjectName)
    console.log(pinnedObject)
    if (pinnedObject) {
      transformControls.attach(pinnedObject)

      // restore saved position (jika ada)
      pinnedObject.position.copy(
        pinnedObject.parent.worldToLocal(
          new THREE.Vector3(positionX.value, positionY.value, positionZ.value),
        ),
      )
    }
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

  camera.x = Number(camera.position.x.toFixed(4))
  camera.y = Number(camera.position.y.toFixed(4))
  camera.z = Number(camera.position.z.toFixed(4))
  camera.zoom = Number(camera.zoom.toFixed(4))
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
  }


  const result = await saveFacility(payload)
  if (result.success) {
    isAlertDialogVisible.value = true
    bodyAlert.value = "You will be redirect to facilities page"
    alertType.value = 'info'
    titleAlert.value = "Success manage Facilities"

    setTimeout(() => {
      router.push('/facilities')
    }, 2000)
  } else {
    // errors are already populated into formErrors by composable
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
    positionX.value = processedFacility.position_x
    positionY.value = processedFacility.position_y
    positionZ.value = processedFacility.position_z
    existingThumbnail.value = [useStaticFile(processedFacility.thumbnail_path)]
  } else {
    id = null
  }

})
</script>

<template>
  <VCol cols="12">
    <h4 class="text-h4 mb-1">
      {{ isEditMode ? 'Edit' : 'Create' }} Facility
    </h4>
    <p class="text-body-1 mb-4">
      Configure dashboard model and camera position
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
                placeholder="0, 0, 0"
              />
            </VCol>
          </VRow>


          <VRow>
            <VCol cols="6">
              <p class="text-body-2">
                Thumbnail
              </p>
              <Vue3Dropzone
                v-model="thumbnail"
                v-model:previews="existingThumbnail"
                :max-file-size="1"
                accept="image/png, image/jpeg"
                mode="edit"
              />
              <p
                v-if="formErrors.thumbnail"
                class="text-body-2 mt-2 text-red"
              >
                {{ formErrors.thumbnail }}
              </p>
            </VCol>

            <VCol
              cols="6"
            >
              <p class="text-body-2 mb-2">
                Facility Position
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
                :rules="[requiredValidator]"
                disabled
                label="Position X"
                placeholder="Drier"
              />

            </VCol>
            <VCol cols="4">
              <AppTextField
                v-model="positionY"
                :rules="[requiredValidator]"
                disabled
                label="Position Y"
                placeholder="Drier"

              />

            </VCol>
            <VCol cols="4">
              <AppTextField
                v-model="positionZ"
                :rules="[requiredValidator]"
                disabled
                label="Position Z"
                placeholder="Drier"

              />
            </VCol>
          </VRow>
          <VRow>
            <VCol
              cols="12"
              md="12"
            >
              <p class="text-body-2">
                3D Model {{ isEditMode ? '(Optional)' : '' }}
              </p>
              <Vue3Dropzone
                v-model="uploadedModel"
                :max-file-size="500"
                :multiple="false"
              />
              <p
                v-if="formErrors.model"
                class="text-body-2 mt-2 text-red"
              >
                {{ props.formErrors.model }}
              </p>
            </VCol>

          </VRow>

          <!-- Actions -->
          <VCol cols="12">
            <div class="d-flex justify-end">
              <VBtn
                :loading="actionLoading"
                class="me-3"
                type="submit"
              >
                {{ isEditMode ? 'Update' : 'Create' }}
              </VBtn>
              <VBtn
                color="error"
                variant="tonal"
              >
                Cancel
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
