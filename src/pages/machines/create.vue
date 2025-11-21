<script setup>
import customWizardAccount from '@images/svg/wizard-account.svg'
import customWizardAddress from '@images/svg/wizard-address.svg'
import customWizardPersonal from '@images/svg/wizard-personal.svg'
import customWizardSubmit from '@images/svg/wizard-submit.svg'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import Vue3Dropzone from '@jaxtheprime/vue3-dropzone'
import "@jaxtheprime/vue3-dropzone/dist/style.css"
import { ref } from "vue"
import AppStepper from "@core/components/AppStepper.vue"

const iconsSteps = [
  {
    title: 'Machine Identity',
    icon: customWizardAccount,
  },
  {
    title: 'Machine Documents',
    icon: customWizardPersonal,
  },
]

const currentStep = ref(0)
const facilities = ref([])

const files = ref([])

const formData = ref({
  name: '',
  code: '',
  description: '',
  documents: [
    {
      title: '',
      description: '',
      files: [],
    },
  ],
})

const onSubmit = () => {
  console.log(formData.value)
}

async function fetchFacilities() {
  try {
    const { data: response } = await useApi(`/facilities`).get().json()

    console.log(response)
    facilities.value = response.value.data.map(facility => ({
      title: facility.name, // ditampilkan
      value: facility.id,     // jadi value
    }))
    console.log(facilities)
  } catch (err) {
    console.error('Failed to fetch roles:', err)
  }
}

onMounted(() => {
  fetchFacilities()
})

const addDocument = () => {
  formData.value.documents.push({
    title: '',
    description: '',
    files: [],
  })
}

const removeDocument = index => {
  formData.value.documents.splice(index, 1)
}
</script>

<template>
  <VCol cols="12">
    <h4 class="text-h4 mb-1 mt-1">
      Create New Machine
    </h4>
    <p class="text-body-1 mb-2">
      Find all of your company’s administrator accounts and their associate roles.
    </p>
  </VCol>
  <VCard>
    <VCardText>
      <!-- 👉 Stepper -->
      <AppStepper
        v-model:current-step="currentStep"
        :items="iconsSteps"
        align="center"
      />
    </VCardText>

    <VDivider />

    <VCardText>
      <!-- 👉 stepper content -->
      <VForm>
        <VWindow
          v-model="currentStep"
          class="disable-tab-transition"
        >
          <VWindowItem>
            <VRow>
              <VCol cols="12">
                <h6 class="text-h6 font-weight-medium">
                  Machine Identity
                </h6>
                <p class="mb-0">
                  Enter your Account Details
                </p>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="formData.name"
                  label="Name"
                  placeholder="Chiller"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="formData.code"
                  label="Code"
                  placeholder="chiller-hvac"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <Vue3Dropzone
                  v-model="doc.files"
                  :max-file-size="1"
                />
              </VCol>
            </VRow>
          </VWindowItem>

          <VWindowItem>
            <VRow>
              <!-- Loop Documents -->
              <VCol cols="12">
                <h6 class="text-h6 font-weight-medium">
                  Machine Documents
                </h6>
                <p class="mb-2">
                  Add machine-related documents.
                </p>
              </VCol>
              <div
                v-for="(doc, index) in formData.documents"
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
                        v-if="formData.documents.length > 1"
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
                        :max-file-size="1"
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
            v-if="iconsSteps.length - 1 === currentStep"
            color="success"
            @click="onSubmit"
          >
            submit
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
</template>
