<script setup>
import { reactive, ref } from 'vue'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import Vue3Dropzone from '@jaxtheprime/vue3-dropzone'
import "@jaxtheprime/vue3-dropzone/dist/style.css"
import { useManageBreakdown } from '@/composables/useManageBreakdown'
import { useRouter } from 'vue-router'

const router = useRouter()

const numberedSteps = [
  {
    title: 'Breakdown Details',
    subtitle: 'Enter breakdown information',
  },
  {
    title: 'Breakdown Actions',
    subtitle: 'Fill actions to be performed',
  },
  {
    title: 'Supporting Documents',
    subtitle: 'Attach image and video files',
  },
  {
    title: 'Summary',
    subtitle: 'Review before submitting',
  },
]


// =========================
// USE COMPOSABLE
// =========================
const {
  formErrors,
  actionLoading,
  clearFormErrors,
  createBreakdown,
} = useManageBreakdown()

const {
  machines,
  fetchMachines,
} = useManageMachine()

// =========================
// MOCK MACHINES
// =========================
const processedMachines = ref([])

// =========================
// FORM STATE
// =========================
const localForm = reactive({
  machine_id: null,
  problem_identification: '',
  people_issue: '',
  inspection_issue: '',
  condition_issue: '',
  action_taken: '',
  parts_issue: '',
  analysis_notes: '',
  corrective_action: '',
  preventive_action: '',
  problem_at: '',

  breakdown_resources_requests: [
    { image_file: null, video_file: null },
  ],
})

const currentStep = ref(0)


// =========================
// HANDLERS
// =========================
const addResource = () => {
  localForm.breakdown_resources_requests.push({
    image_file: null,
    video_file: null,
  })
}

const removeResource = index => {
  localForm.breakdown_resources_requests.splice(index, 1)
}

// =========================
// SUBMIT HANDLER
// =========================
const onSubmit = async () => {
  clearFormErrors()

  const payload = {
    ...localForm,
    breakdown_resources_requests: localForm.breakdown_resources_requests.map(r => ({
      image_file: r.image_file ? r.image_file[0]?.file : null,
      video_file: r.video_file ? r.video_file[0]?.file : null,
    })),
  }

  const result = await createBreakdown(payload)

  if (result.success) {
    router.push('/breakdowns')
  }
}

onMounted(async () => {
  await fetchMachines()
  await nextTick()
  console.log(machines)
  processedMachines.value = machines.value.entries.map(machine => {
    return {
      title: machine.name,
      value: machine.id,
    }
  })
})
</script>

<template>
  <VCol cols="12">
    <h4 class="text-h4 mb-1 mt-1">
      Create Breakdown
    </h4>
    <p class="text-body-1 mb-4">
      Fill out the breakdown details and attach supporting documentation.
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
        <VForm>
          <!-- ========================= -->
          <!-- STEP 1 — BREAKDOWN DETAILS -->
          <!-- ========================= -->
          <div v-if="currentStep === 0">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  v-model="localForm.machine_id"
                  :error-messages="formErrors.machine_id || []"
                  :items="processedMachines"
                  label="Machine"
                  placeholder="Select machine"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppDateTimePicker
                  id="problemAt"
                  v-model="localForm.problem_at"
                  :config="{ enableTime: true, dateFormat: 'd M Y H:i', time_24hr: true }"
                  :error-messages="formErrors.problem_at || []"
                  label="Problem At"
                  placeholder="Select date and time"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VLabel
                  class="mb-1 text-body-2"
                  style="line-height: 15px;"
                  text="Problem Identification"
                />
                <TipTapEditor
                  v-model:content="localForm.problem_identification"
                  v-model:form-error="formErrors.problem_identification"
                  :error-messages="formErrors.problem_identification || []"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VLabel
                  class="mb-1 text-body-2"
                  style="line-height: 15px;"
                  text="People Issue"
                />
                <TipTapEditor
                  v-model:content="localForm.people_issue"
                  v-model:form-error="formErrors.people_issue"
                  :error-messages="formErrors.people_issue || []"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VLabel
                  class="mb-1 text-body-2"
                  style="line-height: 15px;"
                  text="Inspection Issue"
                />
                <TipTapEditor
                  v-model:content="localForm.inspection_issue"
                  v-model:form-error="formErrors.inspection_issue"
                  :error-messages="formErrors.inspection_issue || []"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VLabel
                  class="mb-1 text-body-2"
                  style="line-height: 15px;"
                  text="Condition Issue"
                />
                <TipTapEditor
                  v-model:content="localForm.condition_issue"
                  v-model:form-error="formErrors.condition_issue"
                  :error-messages="formErrors.condition_issue || []"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VLabel
                  class="mb-1 text-body-2"
                  style="line-height: 15px;"
                  text="Parts Issue"
                />
                <TipTapEditor
                  v-model:content="localForm.parts_issue"
                  v-model:form-error="formErrors.parts_issue"
                  :error-messages="formErrors.parts_issue || []"
                />
              </VCol>
            </VRow>
          </div>
          <div v-if="currentStep === 1">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VLabel
                  class="mb-1 text-body-2"
                  style="line-height: 15px;"
                  text="Action Taken"
                />
                <TipTapEditor
                  v-model:content="localForm.action_taken"
                  v-model:form-error="formErrors.action_taken"
                  :error-messages="formErrors.action_taken || []"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VLabel
                  class="mb-1 text-body-2"
                  style="line-height: 15px;"
                  text="Analysis Notes"
                />
                <TipTapEditor
                  v-model:content="localForm.analysis_notes"
                  v-model:form-error="formErrors.analysis_notes"
                  :error-messages="formErrors.analysis_notes || []"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VLabel
                  class="mb-1 text-body-2"
                  style="line-height: 15px;"
                  text="Corrective Action"
                />
                <TipTapEditor
                  v-model:content="localForm.corrective_action"
                  v-model:form-error="formErrors.corrective_action"
                  :error-messages="formErrors.corrective_action || []"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VLabel
                  class="mb-1 text-body-2"
                  style="line-height: 15px;"
                  text="Preventive Action"
                />
                <TipTapEditor
                  v-model:content="localForm.preventive_action"
                  v-model:form-error="formErrors.preventive_action"
                  :error-messages="formErrors.preventive_action || []"
                />
              </VCol>
            </VRow>
          </div>
          <!-- ============================ -->
          <!-- STEP 2 — SUPPORTING DOCUMENTS -->
          <!-- ============================ -->
          <div v-if="currentStep === 2">
            <VRow>
              <VCol cols="12">
                <h6 class="text-h6 mt-4 mb-2">
                  Supporting Files
                </h6>
              </VCol>

              <div
                v-for="(resource, index) in localForm.breakdown_resources_requests"
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
                        Resource {{ index + 1 }}
                      </h6>

                      <VBtn
                        v-if="localForm.breakdown_resources_requests.length > 1"
                        color="error"
                        size="small"
                        variant="tonal"
                        @click="removeResource(index)"
                      >
                        Remove
                      </VBtn>
                    </VCol>

                    <VCol
                      cols="12"
                      md="6"
                    >
                      <p class="text-body-2">
                        Image File
                      </p>
                      <Vue3Dropzone
                        v-model="resource.image_file"
                        :multiple="false"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="6"
                    >
                      <p class="text-body-2">
                        Video File
                      </p>
                      <Vue3Dropzone
                        v-model="resource.video_file"
                        :multiple="false"
                      />
                    </VCol>
                  </VRow>
                </VCard>
              </div>

              <VCol
                class="d-flex justify-end"
                cols="12"
              >
                <VBtn
                  color="primary"
                  @click="addResource"
                >
                  Add Resource
                </VBtn>
              </VCol>
            </VRow>
          </div>


          <!-- ====================== -->
          <!-- STEP 3 — SUMMARY REVIEW -->
          <!-- ====================== -->
          <div v-if="currentStep === 3">
            <h5 class="text-h5 mb-4">
              Review Breakdown Information
            </h5>

            <VRow>
              <!-- MACHINE -->
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  :items="processedMachines"
                  :model-value="localForm.machine_id"
                  disabled
                  label="Machine"
                />
              </VCol>

              <!-- PROBLEM IDENTIFICATION -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="localForm.problem_identification"
                  disabled
                  label="Problem Identification"
                />
              </VCol>

              <!-- PEOPLE ISSUE -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="localForm.people_issue"
                  disabled
                  label="People Issue"
                />
              </VCol>

              <!-- INSPECTION ISSUE -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="localForm.inspection_issue"
                  disabled
                  label="Inspection Issue"
                />
              </VCol>

              <!-- CONDITION ISSUE -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="localForm.condition_issue"
                  disabled
                  label="Condition Issue"
                />
              </VCol>

              <!-- ACTION TAKEN -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="localForm.action_taken"
                  disabled
                  label="Action Taken"
                />
              </VCol>

              <!-- PARTS ISSUE -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="localForm.parts_issue"
                  disabled
                  label="Parts Issue"
                />
              </VCol>

              <!-- ANALYSIS NOTES -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="localForm.analysis_notes"
                  disabled
                  label="Analysis Notes"
                />
              </VCol>

              <!-- CORRECTIVE ACTION -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="localForm.corrective_action"
                  disabled
                  label="Corrective Action"
                />
              </VCol>

              <!-- PREVENTIVE ACTION -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="localForm.preventive_action"
                  disabled
                  label="Preventive Action"
                />
              </VCol>

              <!-- PROBLEM DATE -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="localForm.problem_at"
                  disabled
                  label="Problem At"
                />
              </VCol>

              <!-- RESOURCES -->
              <VCol
                class="mt-4"
                cols="12"
              >
                <h6 class="text-h6 mb-2">
                  Supporting Files
                </h6>

                <VCard
                  v-for="(resource, index) in localForm.breakdown_resources_requests"
                  :key="index"
                  class="pa-4 mb-3"
                >
                  <h6 class="text-subtitle-1 mb-2">
                    Resource {{ index + 1 }}
                  </h6>

                  <!-- IMAGE -->
                  <p class="text-caption">
                    Image File
                  </p>
                  <div v-if="resource.image_file && resource.image_file[0]">
                    {{ resource.image_file[0].file.name }}
                  </div>
                  <div
                    v-else
                    class="text-grey"
                  >
                    No image file
                  </div>

                  <div class="mt-3" />

                  <!-- VIDEO -->
                  <p class="text-caption">
                    Video File
                  </p>
                  <div v-if="resource.video_file && resource.video_file[0]">
                    {{ resource.video_file[0].file.name }}
                  </div>
                  <div
                    v-else
                    class="text-grey"
                  >
                    No video file
                  </div>
                </VCard>
              </VCol>
            </VRow>
          </div>


          <!-- ====================== -->
          <!-- NAVIGATION BUTTONS -->
          <!-- ====================== -->
          <VCol
            class="d-flex justify-space-between mt-4"
            cols="12"
          >
            <VBtn
              v-if="currentStep > 0"
              color="secondary"
              variant="tonal"
              @click="currentStep--"
            >
              Back
            </VBtn>

            <div class="ml-auto d-flex gap-2">
              <VBtn
                v-if="currentStep < 2"
                color="primary"
                @click="currentStep++"
              >
                Next
              </VBtn>

              <VBtn
                v-if="currentStep === 2"
                :loading="actionLoading"
                color="success"
                @click="onSubmit"
              >
                Submit Breakdown
              </VBtn>
            </div>
          </VCol>
        </VForm>
      </VCardText>
    </VCard>
  </VCol>
</template>
