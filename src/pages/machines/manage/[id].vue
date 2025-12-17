<script setup>
import { ref, reactive, onMounted, computed, toRaw } from 'vue'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import Vue3Dropzone from '@jaxtheprime/vue3-dropzone'
import "@jaxtheprime/vue3-dropzone/dist/style.css"
import AppStepper from "@core/components/AppStepper.vue"
import * as THREE from 'three'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useManageFacility } from "@/composables/useManageFacility.js"
import { useManageMachine } from "@/composables/useManageMachine.js"
import { extractFilename } from "@core/utils/helpers.js"
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'

const numberedSteps = [
  {
    title: 'Machines Details',
    subtitle: 'Enter machine details',
  },
  {
    title: 'Machines Documents',
    subtitle: 'Add supporting documents',
  },
  {
    title: 'Summary',
    subtitle: 'Check your information',
  },
]

const currentStep = ref(0)
const isEditMode = ref(false)
const { facilities, fetchFacilities } = useManageFacility()
const processedFacilities = ref([])

// Use composable for machines
const {
  saveMachine,
  formErrors,
  actionLoading,
  clearFormErrors,
  fetchMachines,
  errorMessage,

  // (optional) machines etc if needed
} = useManageMachine()


// Preview state
let previewRenderer = null
let previewScene = null
let previewCamera = null
let previewControls = null
let previewModel = null

const {
  machine,
  fetchMachine,

  // (optional) machines etc if needed
} = useManageMachine()

const threePreviewContainer = ref(null)

// localForm: reactive copy to avoid two-way bind issues during editing
const localForm = reactive({
  id: null,
  name: '',
  code: '',
  description: '',
  model: null, // File or null
  thumbnail: null, // File or null
  thumbnailUrl: null, // File or null
  modelUrl: null, // File or null
  facility_id: null,
  camera_x: 0,
  camera_y: 0,
  camera_z: 0,
  documents: [],
})

// load facilities once
onMounted(async () => {
  await fetchFacilities()

  const result = await fetchMachine(id)

  await nextTick()

  if (processedFacilities.value.length > 0) {
    localForm.facility_id = processedFacilities.value[0].id
  }
  processedFacilities.value = facilities.value?.entries?.map(facility => ({
    title: facility.name,
    value: facility.id,
  })) || []
  if (processedFacilities.value.length > 0) {
    localForm.facility_id = processedFacilities.value[0].id
  }
  if (result.success) {
    isEditMode.value = true

    const processedMachine = machine.value.entry


    existingThumbnail.value = [useStaticFile(processedMachine.thumbnail_path)]
    Object.assign(localForm, {
      id: processedMachine.id,
      name: processedMachine.name,
      code: processedMachine.code,
      description: processedMachine.description,
      facility_id: processedMachine.facility_id,
      camera_x: processedMachine.camera_x,
      camera_y: processedMachine.camera_y,
      camera_z: processedMachine.camera_z,
    })

    initModelPreview(processedMachine.model_path, true)

    // ADD THIS
    localForm.documents = processedMachine.machine_documents.map(doc => ({
      id: doc.id,
      title: doc.name,
      description: doc.description,
      original_filename: extractFilename(doc.file_path),
      preview_url: useStaticFile(doc.file_path), // full URL
      files: [], // keep empty, user may upload new files
      isExisting: true,
    }))
  }
})

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

// helpers: documents
const addDocument = () => {
  localForm.documents.push({ title: '', description: '', files: [] })
}

const removeDocument = idx => {
  localForm.documents.splice(idx, 1)
}

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
  previewCamera.position.set(localForm.camera_x, localForm.camera_y, localForm.camera_z)
  previewCamera.updateProjectionMatrix()

  // Controls
  previewControls = new OrbitControls(previewCamera, previewRenderer.domElement)
  previewControls.enableDamping = true
  previewControls.dampingFactor = 0.05
  previewControls.addEventListener('end', syncPreviewCameraState)

  const pmrem = new THREE.PMREMGenerator(previewRenderer)

  previewScene.environment = pmrem.fromScene(
    new RoomEnvironment(),
    0.04,
  ).texture

  // Light
  previewScene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1))

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)

  directionalLight.position.set(5, 10, 7.5)
  previewScene.add(directionalLight)

  // Load uploaded model
  const loader = new GLTFLoader()

  loader.load(
    shouldRestoreCamera ? useStaticFile(modelUrl) : modelUrl,
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
        localForm.camera_x !== 0 ||
        localForm.camera_y !== 0 ||
        localForm.camera_z !== 0
      )

      if (hasSavedCamera) {
        // Restore saved camera position
        previewCamera.position.set(
          localForm.camera_x,
          localForm.camera_y,
          localForm.camera_z,
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

  localForm.camera_x = Number(previewCamera.position.x.toFixed(4))
  localForm.camera_y = Number(previewCamera.position.y.toFixed(4))
  localForm.camera_z = Number(previewCamera.position.z.toFixed(4))
}

const route = useRoute()
const router = useRouter()
const id = route.params.id
const existingThumbnail = ref([])    // array of URLs
const deletedDocumentIds = ref([])


const modelFile = computed(() => localForm.model?.[0]?.file || null)
const thumbnailFile = computed(() => localForm.thumbnail?.[0]?.file || null)


// prepare payload and submit
const onSubmit = async () => {
  clearFormErrors()

  // build payload in the shape expected by composable's jsonToFormData:
  const payload = {
    id: localForm.id,
    name: localForm.name,
    code: localForm.code,
    description: localForm.description,
    facility_id: localForm.facility_id,
    model: modelFile.value || null, // File or null
    thumbnail: thumbnailFile.value,
    documents: localForm.documents.map(document => ({
      title: document.title,
      description: document.description,
      files: document.files, // array of File
    })),
    camera_x: localForm.camera_x,
    camera_y: localForm.camera_y,
    camera_z: localForm.camera_z,
  }

  console.log(payload)

  const result = await saveMachine(payload)

  if (result.success) {
    router.push('/machines')
  } else {
    currentStep.value = 0

    // errors are already populated into formErrors by composable
    console.error('submit failed', result)
  }
}

watch(
  () => localForm.thumbnail,
  val => {
    if (val && val[0]?.file) {
      localForm.thumbnailUrl = URL.createObjectURL(val[0].file)
    }
  },
  { deep: true },
)

watch(
  () => localForm.model,
  val => {
    if (val && val[0]?.file) {
      localForm.modelUrl = URL.createObjectURL(val[0].file)
      initModelPreview(localForm.modelUrl, false)
    }
  },
  { deep: true },
)

const threeContainer = ref(null)

// Three.js instances
let renderer = null
let scene = null
let camera = null
let controls = null
let model = null

const {
  errors: dropzoneError,
  handleFileRejected,
  clearError,
  clearAllErrors,
} = useDropzoneValidation()


// Watch step: initialize preview when going to summary (step index 2)
watch(
  () => currentStep.value,
  async step => {
    if (step === 2) {
      await nextTick()
      initThreePreview()
    } else {
      destroyPreview()
    }
  },
)

// Destroy the preview (important)
function destroyPreview() {
  if (renderer) {
    renderer.dispose()
    renderer = null
  }
  if (threeContainer.value) {
    threeContainer.value.innerHTML = ''
  }
}

// Initialize Three.js preview
function initThreePreview() {
  if (!threeContainer.value || !localForm.modelUrl) return

  destroyPreview()

  const width = threeContainer.value.clientWidth
  const height = threeContainer.value.clientHeight

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  threeContainer.value.appendChild(renderer.domElement)

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)

  const pmrem = new THREE.PMREMGenerator(renderer)

  scene.environment = pmrem.fromScene(
    new RoomEnvironment(),
    0.04,
  ).texture

  // Camera
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(2, 1.5, 3)

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  // Light
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1)

  scene.add(hemiLight)

  // Load 3D model
  const loader = new GLTFLoader()

  loader.load(localForm.modelUrl, gltf => {
    model = gltf.scene
    model.scale.set(1, 1, 1)
    scene.add(model)
  })
  animate()
}

// Animation loop
function animate() {
  if (!renderer) return
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

function removeExistingDocument(docId, index) {
  if (!docId) return

  deletedDocumentIds.value.push(docId)

  // Remove from visual list
  localForm.documents.splice(index, 1)
}
</script>

<template>
  <VCol cols="12">
    <h4 class="text-h4 mb-1 mt-1">
      {{ isEditMode ? 'Edit' : 'Create' }} Machine
    </h4>
    <p class="text-body-1 mb-2">
      Configure machine settings and maintain essential machine information
    </p>

    <VCard>
      <VCardText>
        <div class="mb-6 mt-5 d-flex justify-center">
          <AppStepper
            v-model:current-step="currentStep"
            :items="numberedSteps"
            align="start"
          />
        </div>
      </VCardText>
    </VCard>
    <VCard class="mt-5">
      <VCardText>
        <VForm
          ref="vform"
          lazy-validation
        >
          <VWindow
            v-model="currentStep"
            class="disable-tab-transition"
          >
            <!-- STEP 1: Identity -->
            <VWindowItem>
              <VRow>
                <VCol cols="12">
                  <h6 class="text-h6 font-weight-medium">
                    Machine Identity
                  </h6>
                  <p class="mb-0">
                    Enter machine details
                  </p>
                </VCol>
                <VCol cols="12">
                  <GeneralAlert
                    v-if="errorMessage"
                    :description="errorMessage"
                    color="error"
                    icon="tabler-bug"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="localForm.name"
                    :error-messages="formErrors.name || []"
                    label="Name"
                    placeholder="Chiller"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="localForm.code"
                    :error-messages="formErrors.code || []"
                    label="Code"
                    placeholder="chiller-hvac"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppSelect
                    v-model="localForm.facility_id"
                    :error-messages="formErrors.facility_id || []"
                    :items="processedFacilities"
                    label="Facility"
                    placeholder="Select facility"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="localForm.description"
                    :error-messages="formErrors.description || []"
                    :rows="3"
                    label="Description"
                    placeholder="Describe the machine"
                    textarea
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <p class="text-body-2">
                    3D Model {{ isEditMode ? '(Optional)' : '' }}
                  </p>
                  <Vue3Dropzone
                    v-model="localForm.model"
                    :max-file-size="500"
                    :multiple="false"
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


                <VCol
                  cols="12"
                  md="6"
                >
                  <p class="text-body-2">
                    Thumbnail
                  </p>
                  <Vue3Dropzone
                    v-model="localForm.thumbnail"
                    v-model:previews="existingThumbnail"
                    :max-file-size="1"
                    :multiple="false"
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
                    3D Preview (Rotate to set camera)
                  </p>
                  <div
                    ref="threePreviewContainer"
                    class="rounded-lg overflow-hidden"
                    style="width: 100%; height: 300px; border: 1px solid #e0e0e0; background: #f5f5f5;"
                  />
                </VCol>
                <VCol cols="6">
                  <VCol>
                    <VCol cols="12">
                      <AppTextField
                        v-model="localForm.camera_x"
                        disabled
                        label="Camera X"
                      />
                    </VCol>
                    <VCol cols="12">
                      <AppTextField
                        v-model="localForm.camera_y"
                        disabled
                        label="Camera Y"
                      />
                    </VCol>
                    <VCol cols="12">
                      <AppTextField
                        v-model="localForm.camera_z"
                        disabled
                        label="Camera Z"
                      />
                    </VCol>
                  </VCol>
                </VCol>
              </VRow>
            </VWindowItem>


            <!-- STEP 2: Documents -->
            <VWindowItem>
              <VRow>
                <VCol cols="12">
                  <h6 class="text-h6 font-weight-medium">
                    Machine Documents
                  </h6>
                  <p class="mb-2">
                    Add machine-related documents.
                  </p>
                </VCol>

                <!-- LOOP DOCUMENTS -->
                <VCol
                  v-for="(doc, index) in localForm.documents"
                  :key="index"
                  cols="12"
                >
                  <VCard class="mb-4 pa-4">
                    <VRow>
                      <VCol
                        class="d-flex justify-space-between align-center mb-2"
                        cols="12"
                      >
                        <h6 class="text-h6">
                          Document {{ index + 1 }}
                        </h6>

                        <!-- REMOVE BUTTON -->
                        <VBtn
                          v-if="doc.isExisting"
                          color="error"
                          size="small"
                          variant="tonal"
                          @click="removeExistingDocument(doc.id, index)"
                        >
                          Remove
                        </VBtn>

                        <VBtn
                          v-else
                          color="error"
                          size="small"
                          variant="tonal"
                          @click="removeDocument(index)"
                        >
                          Remove
                        </VBtn>
                      </VCol>

                      <!-- EXISTING DOCUMENT: name + description (disabled) -->
                      <template v-if="doc.isExisting">
                        <VCol
                          cols="12"
                          md="4"
                        >
                          <AppTextField
                            :model-value="doc.title"
                            disabled
                            label="Document Name"
                          />
                        </VCol>

                        <VCol
                          cols="12"
                          md="4"
                        >
                          <AppTextField
                            :model-value="doc.description"
                            disabled
                            label="Description"
                          />
                        </VCol>

                        <VCol
                          cols="12"
                          md="4"
                        >
                          <AppTextField
                            :model-value="doc.original_filename"
                            disabled
                            label="Filename"
                          />
                        </VCol>

                        <VCol
                          class="mt-2"
                          cols="12"
                        >
                          <div class="text-body-2 mb-1">
                            Preview
                          </div>
                          <img
                            :src="doc.preview_url"
                            style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px;"
                          >
                        </VCol>
                      </template>

                      <!-- NEW DOCUMENT -->
                      <template v-else>
                        <VCol
                          cols="12"
                          md="4"
                        >
                          <AppTextField
                            v-model="doc.title"
                            :error-messages="formErrors[`documents.${index}.title`] || []"
                            label="Document Name"
                          />
                        </VCol>

                        <VCol
                          cols="12"
                          md="4"
                        >
                          <AppTextField
                            v-model="doc.description"
                            :error-messages="formErrors[`documents.${index}.description`] || []"
                            label="Description"
                          />
                        </VCol>

                        <VCol
                          cols="12"
                          md="4"
                        >
                          <div class="text-body-2 mb-1">
                            Upload File
                          </div>
                          <Vue3Dropzone
                            v-model="doc.files"
                            :max-file-size="5"
                            :multiple="false"
                          />
                        </VCol>
                      </template>
                    </VRow>
                  </VCard>
                </VCol>

                <!-- ADD DOCUMENT BUTTON OUTSIDE LOOP -->
                <VCol
                  class="d-flex justify-end"
                  cols="12"
                >
                  <VBtn
                    color="primary"
                    @click="addDocument"
                  >
                    Add Document
                  </VBtn>
                </VCol>
              </VRow>
            </VWindowItem>

            <VWindowItem>
              <VRow>
                <!-- Machine Name -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppTextField
                    v-model="localForm.name"
                    disabled
                    label="Name"
                  />
                </VCol>

                <!-- Machine Code -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppTextField
                    v-model="localForm.code"
                    disabled
                    label="Code"
                  />
                </VCol>

                <!-- Machine Type -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppTextField
                    v-model="localForm.description"
                    disabled
                    label="Description"
                  />
                </VCol>

                <!-- Thumbnail Preview -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <div class="text-body-2 mb-1">
                    Thumbnail Preview
                  </div>

                  <div
                    v-if="localForm.thumbnailUrl || existingThumbnail[0]"
                    style="width: 200px; height: 200px; border-radius: 8px; overflow: hidden;"
                  >
                    <img
                      :src="localForm.thumbnailUrl || existingThumbnail[0]"
                      style="width: 100%; height: 100%; object-fit: cover;"
                    >
                  </div>

                  <div
                    v-else
                    class="text-grey"
                  >
                    No thumbnail uploaded
                  </div>
                </VCol>

                <VCol cols="12">
                  <h4 class="text-h5 mb-3">
                    3D Model Preview
                  </h4>

                  <div
                    v-if="localForm.modelUrl"
                    ref="threeContainer"
                    style="width: 100%; height: 300px; border-radius: 8px; background: #000;"
                  />

                  <div
                    v-if="!localForm.modelUrl"
                    class="text-grey mt-1"
                  >
                    No 3D model uploaded
                  </div>
                </VCol>
                <!-- Documents Summary -->
                <VCol cols="12">
                  <h4 class="text-h5 mb-3">
                    Documents
                  </h4>
                  <div
                    v-if="localForm.documents.length == 0"
                    class="text-grey mt-1"
                  >
                    No Document uploaded
                  </div>
                </VCol>

                <template
                  v-for="(doc, index) in localForm.documents"
                  :key="index"
                >
                  <VCol
                    class="mt-4"
                    cols="12"
                  >
                    <strong>Document {{ index + 1 }}</strong>
                  </VCol>

                  <VCol
                    cols="12"
                    md="4"
                  >
                    <AppTextField
                      :model-value="doc.title"
                      disabled
                      label="Document Name"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="4"
                  >
                    <AppTextField
                      :model-value="doc.description"
                      disabled
                      label="Document Type"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="4"
                  >
                    <AppTextField
                      :model-value="doc.files[0]?.name || doc.original_filename"
                      disabled
                      label="Original Filename"
                    />
                  </VCol>
                </template>
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
</template>

