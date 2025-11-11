<script setup>
// Headers
import AppCardActions from "@core/components/cards/AppCardActions.vue"
import modbusLogo from '@images/protocol-logo/modbus-logo.png'
import mqttLogo from '@images/protocol-logo/mqtt-logo.png'
import opcUaLogo from '@images/protocol-logo/opc-ua-logo.png'
import AppStepper from "@core/components/AppStepper.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import { toast } from "vue3-toastify"
import TablePagination from "@core/components/TablePagination.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"

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
    title: 'PROTOCOL',
    key: 'protocol',
  },
  {
    title: 'Description',
    key: 'description',
  },
  {
    title: 'Is Active',
    key: 'is_active',
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

const loadingProtocolConfigurations = ref(false)
const protocolConfigurations = ref([])

const numberedSteps = computed(() => {
  const baseSteps = [
    {
      title: 'Protocol Type',
      icon: 'tabler-network',
      subtitle: 'Choose type of protocol',
    },
    {
      title: 'Protocol Identity',
      icon: 'tabler-id-badge-2',
      subtitle: 'Manage identity of protocol',
    },
  ]

  // Tambah step sesuai protocol yang dipilih
  if (selectedProtocol.value === 'mqtt') {
    baseSteps.push({
      title: 'Connection Configuration',
      icon: 'tabler-settings-bolt',
      subtitle: 'Configure MQTT broker connection',
    })
    baseSteps.push({
      title: 'Security',
      icon: 'tabler-cloud-lock',
      subtitle: 'Configure MQTT security',
    })
    baseSteps.push({
      title: 'Messages',
      icon: 'tabler-mail-bolt',
      subtitle: 'Configure MQTT messages behaviour',
    })
  } else if (selectedProtocol.value === 'modbus') {
    baseSteps.push({
      title: 'Modbus Connection',
      icon: 'tabler-settings-bolt',
      subtitle: 'Configure Modbus connection',
    })
  } else {
    baseSteps.push({
      title: 'Connection Configuration',
      icon: 'tabler-settings-bolt',
      subtitle: 'Manage configuration of connection',
    })
  }

  return baseSteps
})

const protocols = [
  {
    name: 'modbus',
    label: 'Modbus',
    logo: modbusLogo,
    description:
      'Modbus adalah protokol komunikasi serial industri yang umum digunakan untuk menghubungkan perangkat elektronik. Biasanya digunakan antara PLC dan sensor.',
  },
  {
    name: 'mqtt',
    label: 'MQTT',
    logo: mqttLogo,
    description:
      'MQTT adalah protokol berbasis publish-subscribe yang ringan dan efisien, sering digunakan dalam sistem IoT untuk komunikasi antar perangkat.',
  },
  {
    name: 'opc_ua',
    label: 'OPC UA',
    logo: opcUaLogo,
    description:
      'OPC UA (Open Platform Communications Unified Architecture) adalah protokol komunikasi industri yang berorientasi objek dan aman untuk integrasi data IT/OT.',
  },
]

// Reactive object untuk menyimpan status expand setiap card
const expanded = ref({})

const toggleDetails = name => {
  expanded.value[name] = !expanded.value[name]
}

const isVisible = name => !!expanded.value[name]

// State terpilih
const selectedProtocol = ref('')

// Fungsi memilih
function selectProtocol(name) {
  selectedProtocol.value = name
  console.log(selectedProtocol.value)
}

const currentStep = ref(0)
const page = ref(1)
const totalData = computed(() => {
  return protocolConfigurations.value.length
})
const itemsPerPage = ref(10)


// MQTT Form State
const mqttForm = ref({
  hostname: '',
  port: 1883,
  protocol: 'v3.1.1',
  clientId: '',
  keepAlive: 60,
  cleanSession: true,
  name: '',
  is_active: true,
})

// Modbus Form State
const modbusForm = ref({
  connectionType: 'TCP',
  ipAddress: '',
  port: 502,
  serialPort: '',
  baudRate: 9600,
  parity: 'None',
  unitId: 1,
})

// MQTT Security Form State
const mqttSecurity = ref({
  username: '',
  password: '',
})

// MQTT Messages Form State
const mqttMessages = ref({
  birth: {
    topic: '',
    payload: '',
    retain: false,
    qos: 0,
  },
  close: {
    topic: '',
    payload: '',
    retain: false,
    qos: 0,
  },
  will: {
    topic: '',
    payload: '',
    retain: false,
    qos: 0,
  },
})

const fetchProtocolConfigurations = async () => {
  loadingProtocolConfigurations.value = true
  try {
    const res = await $api('/protocol-configurations')

    protocolConfigurations.value = res.data ?? []
    console.log(protocolConfigurations)
  } catch (err) {
    toast.error(err.message || 'Failed to fetch nodes')
  } finally {
    loadingProtocolConfigurations.value = false
  }
}

const onSubmit = async () => {
  try {
    let config = {}

    // Gabungkan sesuai protokol
    if (selectedProtocol.value === 'mqtt') {
      config = {
        ...mqttForm.value,
        security: mqttSecurity.value,
        messages: mqttMessages.value,
      }
    } else if (selectedProtocol.value === 'modbus') {
      config = modbusForm.value
    } else if (selectedProtocol.value === 'opc_ua') {
      config = { name: mqttForm.value.name } // isi sesuai kebutuhan OPC UA
    }

    console.log(config)

    // Payload sesuai DTO backend
    const payload = {
      name: mqttForm.value.name || modbusForm.value.ipAddress || 'Unnamed Config',
      protocol: selectedProtocol.value,
      description: `Configuration for ${selectedProtocol.value.toUpperCase()} protocol`,
      config: config,
      is_active: true,
    }

    // Kirim data ke API
    const res = await $api('/protocol-configurations', {
      method: 'POST',
      body: payload,
    })

    console.log('✅ Configuration saved successfully:', res)
  } catch (error) {
    console.error('❌ Failed to submit configuration:', error)
  }
}

onMounted(() => {
  fetchProtocolConfigurations()
})
</script>

<template>
  <AppCardActions
    action-collapsed
    title="Setup & Manage Protocol"
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
                          Protocol Type
                        </h6>
                        <p class="mb-0">
                          Choose your preferred protocol
                        </p>
                      </VCol>
                      <VRow>
                        <VCol
                          v-for="protocol in protocols"
                          :key="protocol.name"
                          cols="12"
                          md="6"
                          sm="6"
                        >
                          <VCard
                            class="hover:shadow-lg transition-all duration-200 "
                            :class="selectedProtocol === protocol.name ? 'bg-primary-darken-1 opacity-100' : 'opacity-80'"
                            @click="selectProtocol(protocol.name)"
                          >
                            <!-- Logo -->
                            <VImg
                              :src="protocol.logo"
                              class="h-40 object-contain"
                              cover
                            />

                            <!-- Title -->
                            <VCardItem>
                              <VCardTitle>{{ protocol.label }}</VCardTitle>
                            </VCardItem>

                            <!-- Actions -->
                            <VCardActions>
                              <VBtn @click="toggleDetails(protocol.name)">
                                <span :class="selectedProtocol === protocol.name ? 'text-white': 'text-primary'">
                                  Details
                                </span>
                              </VBtn>

                              <VSpacer/>

                              <VBtn
                                icon
                                size="small"
                                @click="toggleDetails(protocol.name)"
                              >
                                <VIcon :icon="isVisible(protocol.name) ? 'tabler-chevron-up' : 'tabler-chevron-down'"
                                       :class="selectedProtocol === protocol.name ? 'text-white': 'text-primary'"
                                />
                              </VBtn>
                            </VCardActions>

                            <!-- Expandable Details -->
                            <VExpandTransition>
                              <div v-show="isVisible(protocol.name)">
                                <VDivider/>
                                <VCardText class="text-body-2 text-gray-600">
                                  {{ protocol.description }}
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
                          Configure connection settings for your selected protocol
                        </p>
                      </VCol>

                      <!-- Jika belum memilih protokol -->
                      <VCol
                        v-if="!selectedProtocol"
                        cols="12"
                      >
                        <VAlert
                          type="warning"
                          variant="tonal"
                          class="mt-3"
                          border="start"
                          icon="tabler-alert-triangle"
                        >
                          Please select a protocol first in the previous step.
                        </VAlert>
                      </VCol>
                      <VCol
                        v-if="selectedProtocol"
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="mqttForm.name"
                          label="Name"
                          placeholder="MQTT Area Chiller"
                        />
                      </VCol>
                    </VRow>
                  </VWindowItem>

                  <VWindowItem>
                    <VRow>
                      <VCol cols="12">
                        <h6 class="text-h6 font-weight-medium">
                          Connection Configuration
                        </h6>
                        <p class="mb-0">
                          Configure connection settings for your selected protocol
                        </p>
                      </VCol>

                      <!-- Jika belum memilih protokol -->
                      <VCol
                        v-if="!selectedProtocol"
                        cols="12"
                      >
                        <VAlert
                          type="warning"
                          variant="tonal"
                          class="mt-3"
                          border="start"
                          icon="tabler-alert-triangle"
                        >
                          Please select a protocol first in the previous step.
                        </VAlert>
                      </VCol>

                      <!-- Form untuk MQTT -->
                      <template v-if="selectedProtocol === 'mqtt'">
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="mqttForm.hostname"
                            label="Hostname"
                            placeholder="mqtt.example.com"
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="mqttForm.port"
                            label="Port"
                            placeholder="1883"
                            type="number"
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppSelect
                            v-model="mqttForm.protocol"
                            label="MQTT Protocol Version"
                            :items="['v3.1', 'v3.1.1', 'v5.0']"
                            placeholder="Select protocol version"
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="mqttForm.clientId"
                            label="Client ID"
                            placeholder="sensor-node-01"
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="mqttForm.keepAlive"
                            label="Keep Alive (s)"
                            type="number"
                            placeholder="60"
                          />
                        </VCol>
                        <VCol cols="12">
                          <VCheckbox
                            v-model="mqttForm.cleanSession"
                            label="Use clean session"
                          />
                        </VCol>
                      </template>

                      <!-- Form untuk Modbus -->
                      <template v-if="selectedProtocol === 'modbus'">
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppSelect
                            v-model="modbusForm.connectionType"
                            label="Connection Type"
                            :items="['TCP', 'RTU']"
                            placeholder="Select Modbus Type"
                          />
                        </VCol>
                        <VCol
                          v-if="modbusForm.connectionType === 'TCP'"
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="modbusForm.ipAddress"
                            label="IP Address"
                            placeholder="192.168.1.10"
                          />
                        </VCol>
                        <VCol
                          v-if="modbusForm.connectionType === 'TCP'"
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="modbusForm.port"
                            label="Port"
                            placeholder="502"
                            type="number"
                          />
                        </VCol>
                        <VCol
                          v-if="modbusForm.connectionType === 'RTU'"
                          cols="12"
                          md="6"
                        >
                          <AppSelect
                            v-model="modbusForm.serialPort"
                            label="Serial Port"
                            :items="['/dev/ttyUSB0', '/dev/ttyS1', '/dev/ttyS2']"
                          />
                        </VCol>
                        <VCol
                          v-if="modbusForm.connectionType === 'RTU'"
                          cols="12"
                          md="6"
                        >
                          <AppSelect
                            v-model="modbusForm.baudRate"
                            label="Baud Rate"
                            :items="[9600, 19200, 38400, 57600, 115200]"
                          />
                        </VCol>
                        <VCol
                          v-if="modbusForm.connectionType === 'RTU'"
                          cols="12"
                          md="6"
                        >
                          <AppSelect
                            v-model="modbusForm.parity"
                            label="Parity"
                            :items="['None', 'Even', 'Odd']"
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <AppTextField
                            v-model="modbusForm.unitId"
                            label="Unit ID"
                            placeholder="1"
                            type="number"
                          />
                        </VCol>
                      </template>
                    </VRow>
                  </VWindowItem>
                  <!-- ✅ Step 3: Security -->
                  <VWindowItem v-if="selectedProtocol === 'mqtt'">
                    <VRow>
                      <VCol cols="12">
                        <h6 class="text-h6 font-weight-medium">
                          Security
                        </h6>
                        <p class="mb-0">
                          Configure MQTT authentication credentials
                        </p>
                      </VCol>

                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="mqttSecurity.username"
                          label="Username"
                          placeholder="mqtt_user"
                        />
                      </VCol>

                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="mqttSecurity.password"
                          label="Password"
                          type="password"
                          placeholder="••••••••"
                        />
                      </VCol>
                    </VRow>
                  </VWindowItem>

                  <!-- ✅ Step 4: Messages -->
                  <VWindowItem v-if="selectedProtocol === 'mqtt'">
                    <VRow>
                      <VCol cols="12">
                        <h6 class="text-h6 font-weight-medium">
                          Messages
                        </h6>
                        <p class="mb-0">
                          Configure MQTT lifecycle messages
                        </p>
                      </VCol>

                      <!-- Birth Message -->
                      <VCol cols="12">
                        <h6 class="text-subtitle-1 mt-4">
                          Messages sent on connection (Birth Message)
                        </h6>
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="mqttMessages.birth.topic"
                          label="Topic"
                          placeholder="devices/status/birth"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="mqttMessages.birth.payload"
                          label="Payload"
                          placeholder="{ 'status': 'online' }"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="8"
                        class="flex flex-row gap-4"
                      >
                        <AppSelect
                          v-model="mqttMessages.birth.qos"
                          label="QoS"
                          :items="[0,1,2]"
                          placeholder="Select QoS"
                          class="flex-1"
                        />
                        <div class="flex items-center">
                          <VCheckbox
                            v-model="mqttMessages.birth.retain"
                            label="Retain"
                            class="mt-5"
                          />
                        </div>
                      </VCol>

                      <!-- Close Message -->
                      <VCol cols="12">
                        <h6 class="text-subtitle-1 mt-4">
                          Messages sent on disconnection (Close Message)
                        </h6>
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="mqttMessages.close.topic"
                          label="Topic"
                          placeholder="devices/status/close"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="mqttMessages.close.payload"
                          label="Payload"
                          placeholder="{ 'status': 'offline' }"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="8"
                        class="flex flex-row gap-4"
                      >
                        <AppSelect
                          v-model="mqttMessages.close.qos"
                          label="QoS"
                          :items="[0,1,2]"
                          placeholder="Select QoS"
                          class="flex-1"
                        />
                        <div class="flex items-center">
                          <VCheckbox
                            v-model="mqttMessages.close.retain"
                            label="Retain"
                            class="mt-5"
                          />
                        </div>
                      </VCol>

                      <!-- Will Message -->
                      <VCol cols="12">
                        <h6 class="text-subtitle-1 mt-4">
                          Messages sent on unexpected disconnection (Will Message)
                        </h6>
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="mqttMessages.will.topic"
                          label="Topic"
                          placeholder="devices/status/will"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="mqttMessages.will.payload"
                          label="Payload"
                          placeholder="{ 'status': 'disconnected' }"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="8"
                        class="flex flex-row gap-4"
                      >
                        <AppSelect
                          v-model="mqttMessages.will.qos"
                          label="QoS"
                          :items="[0,1,2]"
                          placeholder="Select QoS"
                          class="flex-1"
                        />
                        <div class="flex items-center">
                          <VCheckbox
                            v-model="mqttMessages.will.retain"
                            label="Retain"
                            class="mt-5"
                          />
                        </div>
                      </VCol>
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
      <VCardTitle>All Protocol Configuration</VCardTitle>
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
        :items="protocolConfigurations"
        :items-per-page="itemsPerPage"
        :loading="loadingProtocolConfigurations"
        loading-text="Loading data, please wait..."
        expand-on-click
      >
        <template #item.no="{ index }">
          <div class="d-flex align-center gap-x-4">
            {{ (page - 1) * itemsPerPage + index + 1 }}
          </div>
        </template>


        <template #expanded-row="{ item }">
          <tr class="v-data-table__tr">
            <td :colspan="headers.length" class="bg-gray-50">
              <div class="p-4 space-y-2">
                <table class="min-w-full border border-gray-200 rounded-lg mt-5">
                  <thead class="bg-gray-100">
                  <tr>
                    <th class="text-left px-3 py-2 w-1/3">Property</th>
                    <th class="text-left px-3 py-2">Value</th>
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

