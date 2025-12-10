<script setup>
import { ref, reactive, onMounted, computed, toRaw } from 'vue'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import Vue3Dropzone from '@jaxtheprime/vue3-dropzone'
import "@jaxtheprime/vue3-dropzone/dist/style.css"
import AppStepper from "@core/components/AppStepper.vue"

import { useManageFacility } from "@/composables/useManageFacility.js"
import { useManageMachine } from "@/composables/useManageMachine.js"


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
const { facilities, fetchFacilities } = useManageFacility()
const processedFacilities = ref([])

// Use composable for machines
const {
  saveMachine,
  formErrors,
  actionLoading,
  clearFormErrors,
  fetchMachines,

  // (optional) machines etc if needed
} = useManageMachine()

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
  facility_id: null,
  documents: [],
})

// load facilities once
onMounted(async () => {
  await fetchFacilities()

  const result = await fetchMachine(id)

  await nextTick()
  processedFacilities.value = facilities.value?.entries?.map(facility => ({
    title: facility.name,
    value: facility.id,
  })) || []
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
  console.log(result)
  if (result.success) {

    const processedMachine = machine.value.entry

    console.log(processedMachine.name)

    Object.assign(localForm, {
      id: processedMachine.id,
      name: processedMachine.name,
      code: processedMachine.code,
      description: processedMachine.description,
      facility_id: processedMachine.facility_id,
    })
  }


})

// helpers: documents
const addDocument = () => {
  localForm.documents.push({ title: '', description: '', files: [] })
}

const removeDocument = idx => {
  localForm.documents.splice(idx, 1)
}


const route = useRoute()
const id = route.params.id


const modelFile = computed(() => localForm.model[0]?.file || null)
const thumbnailFile = computed(() => localForm.thumbnail[0]?.file || null)


// prepare payload and submit
const submit = async () => {
  clearFormErrors()

  // build payload in the shape expected by composable's jsonToFormData:
  const payload = {
    id: localForm.id,
    name: localForm.name,
    code: localForm.code,
    description: localForm.description,
    facility_id: localForm.facility_id,
    model: modelFile.value, // File or null
    thumbnail: thumbnailFile.value,
    documents: localForm.documents.map(document => ({
      title: document.title,
      description: document.description,
      files: document.files, // array of File
    })),
  }


  const result = await saveMachine(payload)

  if (result.success) {
    router.push('/machines')
  } else {
    // errors are already populated into formErrors by composable
    console.error('submit failed', result)
  }
}
</script>

<template>
  <VCol cols="12">
    <h4 class="text-h4 mb-1 mt-1">
      Create / Edit Machine
    </h4>
    <p class="text-body-1 mb-2">
      Find all of your company’s administrator accounts and their associate roles.
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

      <VDivider/>

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
                  <p class="text-body-2">
                    3D Model
                  </p>
                  <Vue3Dropzone
                    v-model="localForm.model"
                    :max-file-size="500"
                    :multiple="false"
                  />
                  <small
                    v-if="formErrors.model"
                    class="text-error"
                  >{{ formErrors.model.join(', ') }}</small>
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
                    Thumbnail
                  </p>
                  <Vue3Dropzone
                    v-model="localForm.thumbnail"
                    :max-file-size="10"
                    :multiple="false"
                  />
                  <small
                    v-if="formErrors.thumbnail"
                    class="text-error"
                  >{{ formErrors.thumbnail.join(', ') }}</small>
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

                <div
                  v-for="(doc, index) in localForm.documents"
                  :key="index"
                  class="w-100"
                >
                  <VCard class="mb-4 pa-4">
                    <VRow>
                      <VCol
                        class="d-flex justify-space-between align-center"
                        cols="12"
                      >
                        <h6 class="text-h6">
                          Document {{ index + 1 }}
                        </h6>

                        <VBtn
                          v-if="localForm.documents.length > 1"
                          color="error"
                          size="small"
                          variant="tonal"
                          @click="removeDocument(index)"
                        >
                          Remove
                        </VBtn>
                      </VCol>

                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="doc.title"
                          label="Document Name"
                          placeholder="Operational Manual"
                        />
                      </VCol>

                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="doc.description"
                          label="Description"
                          placeholder="Manual book for machine operation"
                        />
                      </VCol>

                      <VCol
                        cols="12"
                        md="6"
                      >
                        <Vue3Dropzone
                          v-model="doc.files"
                          :max-file-size="10"
                          :multiple="true"
                        />
                      </VCol>
                    </VRow>
                  </VCard>
                </div>

                <VCol
                  class="flex justify-end"
                  cols="12"
                >
                  <VBtn
                    class="mb-4"
                    color="primary"
                    @click="addDocument"
                  >
                    Add Document
                  </VBtn>
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
</template>

