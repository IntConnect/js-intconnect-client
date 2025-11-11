<script setup>
// Headers
import AppCardActions from "@core/components/cards/AppCardActions.vue"
import AppStepper from "@core/components/AppStepper.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import { toast } from "vue3-toastify"
import TablePagination from "@core/components/TablePagination.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import mysqlLogo from '@images/database-connection-logo/mysql-logo.png'
import postgresqlLogo from '@images/database-connection-logo/postgresql-logo.png'

const headers = [
  {
    title: '',
    key: 'data-table-expand',
  },
  {
    title: 'No',
    key: 'no',
  },
  {
    title: 'NAME',
    key: 'name',
  },
  {
    title: 'Database Type',
    key: 'database_type',
  },
  {
    title: 'Description',
    key: 'description',
  },
  {
    title: 'Action',
    key: 'action',
  },
]

function formatKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')     // pisahkan camelCase → camel Case
    .replace(/^./, str => str.toUpperCase()) // kapitalisasi huruf awal
    .split('_')                     // pisahkan snake_case → snake case
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const loadingDatabaseConnectionConfigurations = ref(false)
const databaseConnections = ref([])

const numberedSteps = computed(() => {
  return [
    {
      title: 'Database Type',
      icon: 'tabler-database-plus',
      subtitle: 'Choose type of database',
    },
    {
      title: 'Database Connection Identity & Credentials',
      icon: 'tabler-id-badge-2',
      subtitle: 'Manage identity of database connection',
    },
    {
      title: 'Database Connection Detail',
      icon: 'tabler-id-badge-2',
      subtitle: 'Manage identity of database connection',
    },
  ]
})

const databaseConnectionsOptions = [
  {
    name: 'mysql',
    label: 'MySQL',
    logo: mysqlLogo,
    description:
      'Modbus adalah protokol komunikasi serial industri yang umum digunakan untuk menghubungkan perangkat elektronik. Biasanya digunakan antara PLC dan sensor.',
  },
  {
    name: 'postgresql',
    label: 'PostgreSQL',
    logo: postgresqlLogo,
    description:
      'MQTT adalah protokol berbasis publish-subscribe yang ringan dan efisien, sering digunakan dalam sistem IoT untuk komunikasi antar perangkat.',
  },
]

// Reactive object untuk menyimpan status expand setiap card
const expanded = ref({})

const toggleDetails = name => {
  expanded.value[name] = !expanded.value[name]
}

const isVisible = name => !!expanded.value[name]

// State terpilih
const selectedDatabaseConnection = ref('')

// Fungsi memilih
function selectDatabaseConnection(name) {
  selectedDatabaseConnection.value = name
  payload.value.protocol = name
  console.log(selectedDatabaseConnection.value)
}

const currentStep = ref(0)
const page = ref(1)

const totalData = computed(() => {
  return databaseConnections.value.length
})

const itemsPerPage = ref(10)

const payload = ref({})
const config = ref({})

const fetchDatabaseConnectionConfigurations = async () => {
  loadingDatabaseConnectionConfigurations.value = true
  try {
    const res = await $api('/database-connections')

    databaseConnections.value = res.data ?? []
    console.log(databaseConnections)
  } catch (err) {
    toast.error(err.message || 'Failed to fetch nodes')
  } finally {
    loadingDatabaseConnectionConfigurations.value = false
  }
}

const onSubmit = async () => {
  try {

    // Payload sesuai DTO backend
    const finalPayload = {
      ...payload.value,
      database_type: selectedDatabaseConnection.value,
      config: config.value,
    }

    console.log(finalPayload)

    // Kirim data ke API
    const res = await $api('/database-connections', {
      method: 'POST',
      body: finalPayload,
    })

    console.log('✅ Configuration saved successfully:', res)
  } catch (error) {
    console.error('❌ Failed to submit configuration:', error)
  }
}

onMounted(() => {
  fetchDatabaseConnectionConfigurations()
})
</script>

<template>
  <AppCardActions
    action-collapsed
    title="Setup & Manage Database Connections"
    class="mb-5"
  >
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          md="4"
        >
          <!-- 👉 Stepper -->
          <div class="pa-6">
            <AppStepper
              v-model:current-step="currentStep"
              direction="vertical"
              :items="numberedSteps"
              icon-size="24"
              class="stepper-icon-step-bg"
            />
          </div>
        </VCol>

        <!-- 👉 stepper content -->
        <VCol
          cols="12"
          md="8"
        >
          <VCard>
            <VCardText>
              <VForm>
                <VWindow
                  v-model="currentStep"
                  class="disable-tab-transition"
                >
                  <VWindowItem>
                    <VRow>
                      <VCol cols="12">
                        <h6 class="text-h6 font-weight-medium">
                          Database Type
                        </h6>
                        <p class="mb-0">
                          Choose your preferred database
                        </p>
                      </VCol>
                      <VRow>
                        <VCol
                          v-for="databaseConnection in databaseConnectionsOptions"
                          :key="databaseConnection.name"
                          cols="12"
                          md="6"
                          sm="6"
                        >
                          <VCard
                            class="hover:shadow-lg transition-all duration-200 "
                            :class="selectedDatabaseConnection === databaseConnection.name ? 'bg-primary-darken-1 opacity-100' : 'opacity-80'"
                            @click="selectDatabaseConnection(databaseConnection.name)"
                          >
                            <!-- Logo -->
                            <VImg
                              :src="databaseConnection.logo"
                              class="h-40 object-contain"
                              cover
                            />

                            <!-- Title -->
                            <VCardItem>
                              <VCardTitle>{{ databaseConnection.label }}</VCardTitle>
                            </VCardItem>

                            <!-- Actions -->
                            <VCardActions>
                              <VBtn @click="toggleDetails(databaseConnection.name)">
                                <span
                                  :class="selectedDatabaseConnection === databaseConnection.name ? 'text-white': 'text-primary'"
                                >
                                  Details
                                </span>
                              </VBtn>

                              <VSpacer/>

                              <VBtn
                                icon
                                size="small"
                                @click="toggleDetails(databaseConnection.name)"
                              >
                                <VIcon
                                  :class="selectedDatabaseConnection === databaseConnection.name ? 'text-white': 'text-primary'"
                                  :icon="isVisible(databaseConnection.name) ? 'tabler-chevron-up' : 'tabler-chevron-down'"
                                />
                              </VBtn>
                            </VCardActions>

                            <!-- Expandable Details -->
                            <VExpandTransition>
                              <div v-show="isVisible(databaseConnection.name)">
                                <VDivider/>
                                <VCardText class="text-body-2 text-gray-600">
                                  {{ databaseConnection.description }}
                                </VCardText>
                              </div>
                            </VExpandTransition>
                          </VCard>
                        </VCol>
                      </VRow>
                    </VRow>
                  </VWindowItem>
                  <VWindowItem>
                    <VRow>
                      <VCol cols="12">
                        <h6 class="text-h6 font-weight-medium">
                          Connection Configuration
                        </h6>
                        <p class="mb-0">
                          Configure connection settings for your selected database type
                        </p>
                      </VCol>

                      <!-- Jika belum memilih protokol -->
                      <VCol
                        v-if="!selectedDatabaseConnection"
                        cols="12"
                      >
                        <VAlert
                          type="warning"
                          variant="tonal"
                          class="mt-3"
                          border="start"
                          icon="tabler-alert-triangle"
                        >
                          Please select a database type first in the previous step.
                        </VAlert>
                      </VCol>
                      <template v-if="selectedDatabaseConnection">
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="payload.name"
                            label="Name"
                            placeholder="MQTT Area Chiller"
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="payload.description"
                            label="Description"
                            placeholder="MQTT Area Chiller"
                          />
                        </VCol>
                      </template>
                    </VRow>
                  </VWindowItem>

                  <VWindowItem>
                    <VRow>
                      <VCol cols="12">
                        <h6 class="text-h6 font-weight-medium">
                          Connection Configuration
                        </h6>
                        <p class="mb-0">
                          Configure connection settings for your selected database type
                        </p>
                      </VCol>

                      <!-- Jika belum memilih protokol -->
                      <VCol
                        v-if="!selectedDatabaseConnection"
                        cols="12"
                      >
                        <VAlert
                          type="warning"
                          variant="tonal"
                          class="mt-3"
                          border="start"
                          icon="tabler-alert-triangle"
                        >
                          Please select a database type first in the previous step.
                        </VAlert>
                      </VCol>
                      <template v-if="selectedDatabaseConnection">
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="config.host"
                            label="Host"
                            placeholder="127.0.0.1"
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="config.port"
                            label="Port"
                            placeholder="3306"
                          />
                        </VCol>

                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="config.username"
                            label="Username"
                            placeholder="root"
                          />
                        </VCol>

                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="config.password"
                            label="Password"
                            placeholder=""
                          />
                        </VCol>

                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="config.database"
                            label="Database"
                            placeholder="sensors"
                          />
                        </VCol>
                      </template>

                    </VRow>
                  </VWindowItem>
                </VWindow>
                <div class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center mt-8">
                  <VBtn
                    color="secondary"
                    variant="tonal"
                    :disabled="currentStep === 0"
                    @click="currentStep--"
                  >
                    <VIcon
                      icon="tabler-arrow-left"
                      start
                      class="flip-in-rtl"
                    />
                    Previous
                  </VBtn>
                  <VBtn
                    v-if="numberedSteps.length - 1 === currentStep"
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
                      icon="tabler-arrow-right"
                      end
                      class="flip-in-rtl"
                    />
                  </VBtn>
                </div>
              </VForm>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VCardText>
  </AppCardActions>

  <VCard>
    <VCardItem>
      <VCardTitle>All Database Connections</VCardTitle>
    </VCardItem>
    <VCardText>
      <div class="d-flex gap-2 align-center">
        <p class="text-body-1 mb-0">
          Show
        </p>
        <AppSelect
          :model-value="itemsPerPage"
          :items="[
            { value: 10, title: '10' },
            { value: 25, title: '25' },
            { value: 50, title: '50' },
            { value: 100, title: '100' },
            { value: -1, title: 'All' },
          ]"
          style="inline-size: 5.5rem;"
          @update:model-value="itemsPerPage = parseInt($event, 10)"
        />
      </div>
      <VDataTable
        :headers="headers"
        :items="databaseConnections"
        :items-per-page="itemsPerPage"
        :loading="loadingDatabaseConnectionConfigurations"
        loading-text="Loading data, please wait..."
        expand-on-click
      >
        <template #item.no="{ index }">
          <div class="d-flex align-center gap-x-4">
            {{ (page - 1) * itemsPerPage + index + 1 }}
          </div>
        </template>
        <template #item.action="{ item }">
          <div class="d-flex align-center gap-x-4">
            <VBtn
              icon="tabler-briefcase"
              rounded
            >
              <VBtn
                icon="tabler-schema"
                rounded
                :href="`/database-schema/${item.id}`"
              />

              <VTooltip
                activator="parent"
                location="top"
              >
                Manage Schema
              </VTooltip>
            </VBtn>


          </div>
        </template>


        <template #expanded-row="{ item }">
          <tr class="v-data-table__tr">
            <td
              :colspan="headers.length"
              class="bg-gray-50"
            >
              <div class="p-4 space-y-2">
                <table class="min-w-full border border-gray-200 rounded-lg mt-5">
                  <thead class="bg-gray-100">
                  <tr>
                    <th class="text-left px-3 py-2 w-1/3">
                      Property
                    </th>
                    <th class="text-left px-3 py-2">
                      Value
                    </th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr
                    v-for="(value, key) in item.config"
                    :key="key"
                    class="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td class="px-3 py-2 font-medium text-gray-700">
                      {{ formatKey(key) }}
                    </td>
                    <td class="px-3 py-2 text-gray-800">
                      <template v-if="typeof value === 'object' && value !== null">
                        <pre class="text-xs bg-gray-100 p-2 rounded-md">{{ JSON.stringify(value, null, 2) }}</pre>
                      </template>
                      <template v-else>
                        {{ value }}
                      </template>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </template>

        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalData"
          />
        </template>
      </VDataTable>
    </VCardText>
  </VCard>
</template>

