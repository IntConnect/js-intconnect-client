<script setup>
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppStepper from "@core/components/AppStepper.vue"
import Vue3Dropzone from '@jaxtheprime/vue3-dropzone'
import "@jaxtheprime/vue3-dropzone/dist/style.css"
import { computed, onMounted, reactive, ref } from 'vue'

import { useManageFacility } from "@/composables/useManageFacility"
import { useManageMachine } from "@/composables/useManageMachine"
import { useManageParameter } from "@/composables/useManageParameter"
import { extractFilename } from "@core/utils/helpers"

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
const isEditMode = computed(() => route.name === 'machine-edit')
const { facilities, fetchFacilities } = useManageFacility()

// Use composable for machines
const {
  saveMachine,
  formErrors,
  actionLoading,
  clearFormErrors,
  errorMessage,

  // (optional) machines etc if needed
} = useManageMachine()

const {
  parameters,
  fetchParameters,
} = useManageParameter()


const {
  machine,
  fetchMachine,

  // (optional) machines etc if needed
} = useManageMachine()


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
  modelFile: null,
  facility_id: null,
  parameter_id: null,
  camera_x: 0,
  camera_y: 0,
  camera_z: 0,
  documents: [],
})

// load facilities once
onMounted(async () => {
  await fetchFacilities({ isMinimal: false })
  await fetchParameters({})
  if (isEditMode.value) {
    const machineResult = await fetchMachine(id)

    await nextTick()
    if (machineResult.success) {
      const processedMachine = machine.value.entry

      existingThumbnail.value = [useStaticFile(processedMachine['thumbnail_path'])]
      Object.assign(localForm, {
        id: processedMachine.id,
        name: processedMachine.name,
        code: processedMachine.code,
        description: processedMachine.description,
        mode: processedMachine['model_path'],
        facility_id: processedMachine['facility_id'],
        camera_x: processedMachine['camera_x'],
        camera_y: processedMachine.camera_y,
        camera_z: processedMachine.camera_z,
      })


      // ADD THIS
      localForm.documents = processedMachine['machine_documents']?.map(doc => ({
        id: doc.id,
        name: doc.name,
        description: doc.description,
        original_filename: extractFilename(doc['file_path']),
        preview_url: useStaticFile(doc['file_path']),
        files: [],
        isExisting: true,
      })) ?? []

    }
  }


})


// helpers: documents
const addDocument = () => {
  localForm.documents.push({ name: '', description: '', files: [] })
}

const removeDocument = idx => {
  localForm.documents.splice(idx, 1)
}




const route = useRoute()
const router = useRouter()
const id = route.params.id
const existingThumbnail = ref([])    // array of URLs
const deletedDocumentIds = ref([])
const viewerRef = ref(null)


const modelFile = computed(() => localForm.model?.[0]?.file || null)
const thumbnailFile = computed(() => localForm.thumbnail?.[0]?.file || null)
const isAlertDialogVisible = ref(false)
const bodyAlert = ref('')
const titleAlert = ref('')
const alertType = ref('info')

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
    parameter_id: localForm.parameter_id,
    model: modelFile.value || null,
    thumbnail: thumbnailFile.value,
    machine_documents: localForm.documents
      .filter(doc => !doc.isExisting)
      .map(document => ({
        name: document.name,
        description: document.description,
        document_file: document.files[0].file,
      })),
    camera_x: localForm.camera_x,
    camera_y: localForm.camera_y,
    camera_z: localForm.camera_z,
  }

  const result = await saveMachine(payload)

  if (result.success) {

    isAlertDialogVisible.value = true
    bodyAlert.value = "You will be redirected to machines page"
    titleAlert.value = SuccessManage("machines")

    setTimeout(() => {
      router.push('/machines')
    }, 2000)
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
    }
  },
  { deep: true },
)



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
    } else {
    }
  },
)


function removeExistingDocument(docId, index) {
  if (!docId) return

  deletedDocumentIds.value.push(docId)

  // Remove from visual list
  localForm.documents.splice(index, 1)
}

const processedFacilities = computed(() => {
  const facilityList = facilities.value['entries']
  if (!Array.isArray(facilityList)) return []

  return facilities.value.entries.map(facility => ({
    title: facility.code,
    value: facility.id,
  }))
})

const processedParameters = computed(() => {
  const parameterList = parameters.value['entries']
  if (!Array.isArray(parameterList)) return []

  return parameters.value.entries.map(parameter => ({
    title: parameter.code,
    value: parameter.id,
  }))
})

// Handler untuk update camera position
const handleCameraUpdate = position => {
  localForm.camera_x = position.x
  localForm.camera_y = position.y
  localForm.camera_z = position.z
}

// Watch model upload
watch(
  () => localForm.model,
  val => {
    if (val && val[0]?.file) {
      localForm.modelUrl = URL.createObjectURL(val[0].file)
    }
  },
  { deep: true },
)

// Saat edit mode, load existing model
if (isEditMode.value) {
  const machineResult = await fetchMachine(id)
  if (machineResult.success) {
    const processedMachine = machine.value.entry

    Object.assign(localForm, {
      camera_x: processedMachine.camera_x || 0,
      camera_y: processedMachine.camera_y || 0,
      camera_z: processedMachine.camera_z || 0,
      modelUrl: processedMachine.model_path,
    })
  }
}

const onFileRemoved = () => {
  localForm.model = null
  destroyViewer()
}

const destroyViewer = () => {
  if (viewerRef.value?.destroyViewer) {
    viewerRef.value.destroyViewer()
  }
}
</script>

<template>
  <VCol cols="12">
    <h4 class="text-h4 mb-1 mt-1">
      Manage Machine
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
                    :max-file-size="250"
                    :multiple="false"
                    accept="model/gltf-binary"
                    @error="e => handleFileRejected('model', e)"
                    @file-uploaded="clearError('model')"
                    @file-removed="() => {
                      onFileRemoved()
                      console.log('aaaa')
                    }"
                  />
                  <p
                    v-if="formErrors.model || dropzoneError.model"
                    class="text-body-2 mt-2 text-error"
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
                    :max-file-size="3"
                    :multiple="false"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    mode="edit"
                    @error="e => handleFileRejected('thumbnail', e)"
                    @file-uploaded="clearError('thumbnail')"
                  />
                  <p
                    v-if="formErrors.thumbnail || dropzoneError.thumbnail"
                    class="text-body-2 mt-2 text-error"
                  >
                    {{ formErrors.thumbnail || dropzoneError.thumbnail.message }}
                  </p>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <p class="text-body-2 mb-2">
                    3D Preview (Rotate to set camera)
                  </p>
                  <ThreeDimensionModelRenderer
                  ref="viewerRef"
                    v-if="localForm.modelUrl"
                    :model-path="localForm.modelUrl"
                    :camera-position="{
                      x: localForm.camera_x,
                      y: localForm.camera_y,
                      z: localForm.camera_z
                    }"
                    :editable="true"
                    container-height="300px"
                    @camera-update="handleCameraUpdate"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VRow>
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
                  </VRow>
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
                            :model-value="doc.name"
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
                            v-model="doc.name"
                            :error-messages="formErrors[`documents.${index}.name`] || []"
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
                            accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                            mode="edit"
                            @error="e => handleFileRejected(`thumbnail${index}`, e)"
                            @file-uploaded="clearError(`thumbnail${index}`)"
                          />
                          <p
                            v-if="formErrors.thumbnail || dropzoneError.thumbnail"
                            class="text-body-2 mt-2 text-error"
                          >
                            {{ formErrors.thumbnail || dropzoneError.thumbnail[index].message }}
                          </p>
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


                <!-- Documents Summary -->
                <VCol cols="12">
                  <h4 class="text-h5 mb-1">
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
                    md="3"
                  >
                    <AppTextField
                      :model-value="doc.name"
                      disabled
                      label="Document Name"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="3"
                  >
                    <AppTextField
                      :model-value="doc.description"
                      disabled
                      label="Document Type"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="6"
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
  <AlertDialog
    :body-alert="bodyAlert"
    :is-dialog-visible="isAlertDialogVisible"
    :title-alert="titleAlert"
    :type="alertType"
    @update:is-dialog-visible="isAlertDialogVisible = $event"
  />
</template>

<style>
.helper-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.helper-title {
  margin: 0;
  font-weight: 500;
  font-size: 16px;
}

.helper-text {
  margin: 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
}
</style>
