<script setup>
import ThreeViewer from "@/components/ThreeViewer.vue"
import CoefficientOfPerformance from "@/components/dashboard/CoefficientOfPerformance.vue"
import LoadChillerWidget from "@/components/dashboard/LoadChillerWidget.vue"
import PowerChart from "@/components/dashboard/PowerChart.vue"
import ProductionChart from "@/components/dashboard/ProductionChart.vue"
import SystemEfficiencyChart from "@/components/dashboard/SystemEfficiencyChart.vue"
import StateCards from "@/components/dashboard/operation/StateCards.vue"
import mqtt from 'mqtt'

const {
  systemSetting,
  fetchSystemSetting,
} = useManageSystemSetting()

const {
  facilities,
  fetchFacilities,
} = useManageFacility()


const selectedMachineIds = ref([])
const selectedParameterIds = ref([])
const parameterId = ref([])
const interval = ref(0)
const formErrors = ref({})


const {
  machine,
  fetchMachine,
} = useManageMachine()

// ==========================================
// MQTT STATE
// ==========================================
const mqttData = reactive({})
const lastUpdate = ref(null)
const mqttClient = ref(null)
const mqttStatus = ref('disconnected')


// ==========================================
// MQTT FUNCTIONS
// ==========================================

function connectMQTT() {
  if (!processedMachine.value?.mqtt_topic?.mqtt_broker) {
    console.warn('No MQTT broker configuration found')
    
    return
  }

  const broker = processedMachine.value.mqtt_topic.mqtt_broker
  const topic = processedMachine.value.mqtt_topic.name

  if (!broker.host_name || !broker.ws_port) {
    console.error('Invalid broker configuration')
    
    return
  }

  const url = `ws://${broker.host_name}:${broker.ws_port}/ws`

  console.log(`🔌 Connecting to MQTT broker: ${url}`)
  console.log(`📡 Topic: ${topic}`)

  try {
    mqttClient.value = mqtt.connect(url, {
      username: broker.username || undefined,
      password: broker.password || undefined,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clean: true,
      clientId: `machine__${Math.random().toString(16).slice(2, 10)}`,
    })

    mqttStatus.value = 'connecting'

    mqttClient.value.on('connect', () => {
      console.log(`✅ MQTT Connected`)
      mqttStatus.value = 'connected'

      // Subscribe to topic
      mqttClient.value.subscribe(topic, { qos: 0 }, err => {
        if (err) {
          console.error(`Failed to subscribe to ${topic}:`, err)
          mqttStatus.value = 'error'
        } else {
          console.log(`📡 Subscribed to: ${topic}`)
        }
      })
    })

    mqttClient.value.on('message', (receivedTopic, payload) => {
      if (receivedTopic !== topic) return

      const message = payload.toString()

      try {
        const data = JSON.parse(message)

        handleMqttMessage(data)
      } catch (err) {
        console.error('❌ Failed to parse JSON:', err)
        console.error('Raw payload:', message)
      }
    })

    mqttClient.value.on('error', err => {
      console.error(`❌ MQTT error:`, err.message)
      mqttStatus.value = 'error'
    })

    mqttClient.value.on('offline', () => {
      console.warn(`⚠️ MQTT offline`)
      mqttStatus.value = 'offline'
    })

    mqttClient.value.on('reconnect', () => {
      console.log(`🔄 MQTT reconnecting`)
      mqttStatus.value = 'reconnecting'
    })

  } catch (err) {
    console.error('Failed to create MQTT client:', err)
    mqttStatus.value = 'failed'
  }
}

function handleMqttMessage(data) {
  console.log('📩 Received MQTT message:', data)

  if (!data || typeof data !== 'object') {
    console.warn('Invalid data structure')
    
    return
  }

  const { d: dataValues, ts: timestamp } = data

  if (!dataValues || typeof dataValues !== 'object') {
    console.warn('Missing "d" field in data')
    
    return
  }

  console.log('Processing MQTT data...')

  const parameters = processedMachine.value?.mqtt_topic?.parameters || []
  let updatedCount = 0

  parameters.forEach(parameter => {
    const paramCode = parameter.code

    if (paramCode in dataValues) {
      const rawValue = dataValues[paramCode]
      const value = Array.isArray(rawValue) ? rawValue[0] : rawValue

      mqttData[paramCode] = {
        name: parameter.name,
        code: paramCode,
        value: value,
        unit: parameter.unit || '',
        timestamp: timestamp || new Date().toISOString(),
        type: typeof value,
      }

      updatedCount++
      console.log(`  ✓ ${parameter.name}: ${value}`)
    }
  })

  lastUpdate.value = timestamp || new Date().toISOString()
  console.log(`✅ Updated ${updatedCount}/${parameters.length} parameters`)
}

function getFormattedValue(paramCode) {
  const param = mqttData[paramCode]
  if (!param) return '-'

  const { value, unit, type } = param

  if (type === 'boolean') {
    return value ? 'ON' : 'OFF'
  }

  if (type === 'number') {
    const rounded = Math.round(value * 100) / 100
    
    return unit ? `${rounded} ${unit}` : rounded.toString()
  }

  return value?.toString() || '-'
}

function getParameterStatus(paramCode) {
  const param = mqttData[paramCode]
  if (!param) return 'unknown'

  const { value, type } = param

  if (type === 'boolean') {
    return value ? 'active' : 'inactive'
  }

  // Custom thresholds
  if (paramCode === '1_Chiller_COP' && value < 5) {
    return 'warning'
  }

  return 'normal'
}

// Computed parameters dengan real-time data
const parametersWithData = computed(() => {
  if (!processedMachine.value?.mqtt_topic?.parameters) return []

  return processedMachine.value.mqtt_topic.parameters.map(parameter => {
    const realtimeData = mqttData[parameter.code]

    return {
      id: parameter.id,
      name: parameter.name,
      code: parameter.code,
      value: realtimeData?.value,
      unit: parameter.unit || '',
      status: getParameterStatus(parameter.code),
      formattedValue: getFormattedValue(parameter.code),
      timestamp: realtimeData?.timestamp,
      hasData: !!realtimeData,
      description: parameter.description,
    }
  })
})

const processedMachine = computed(() => {
  if (!machine?.value?.entry) return null
  
  return machine.value.entry
})

onMounted(async () => {
  await fetchMachine(1)
  await nextTick()

  if (processedMachine.value) {

    // Connect to MQTT
    connectMQTT()
  }
})

const modelConfigurationReady = computed(() => {
  return Boolean(systemSetting.value) && Boolean(facilities.value)
})

onMounted(async () => {
  fetchSystemSetting({ isMinimal: true, key: "DASHBOARD_SETTINGS" })
  await fetchFacilities({ isMinimal: true })
  await nextTick()
})
</script>

<template>
  <div>
    <VRow class="match-height">
      <!-- 3D Viewer -->
      <VCol
        class="d-flex"
        cols="8"
        lg="8"
        md="8"
      >
        <ThreeViewer
          v-if="modelConfigurationReady"
          :facilities="facilities"
          :model-configuration="systemSetting"
          class="flex-grow-1"
        />
      </VCol>

      <!-- Widgets -->
      <VCol
        cols="4"
        lg="4"
        md="4"
      >
        <VRow class="match-height">
          <VCol
            cols="6"
            md="6"
            sm="12"
          >
            <StateCards />
          </VCol>

          <VCol
            cols="6"
            md="6"
            sm="12"
          >
            <CoefficientOfPerformance
              :height="400"
              :value="9"
            />
          </VCol>
        </VRow>
        <VRow class="match-height">
          <VCol
            cols="6"
            md="6"
            sm="12"
          >
            <LoadChillerWidget />
          </VCol>

          <VCol
            cols="6"
            md="6"
            sm="12"
          >
            <EnergyConsumptionWidget />
          </VCol>
        </VRow>
        <VRow class="match-height">
          <VCol
            cols="6"
            md="6"
            sm="12"
          >
            <LoadChillerWidget />
          </VCol>

          <VCol
            cols="6"
            md="6"
            sm="12"
          >
            <EnergyConsumptionWidget />
          </VCol>
        </VRow>
      </VCol>
    </VRow>
    <VRow class="match-height">
      <VCol
        cols="12"
        lg="6"
        md="6"
      >
        <VCard>
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>Power (kW/hr)</VCardTitle>
          </VCardItem>

          <VCardText>
            <PowerChart />
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        lg="6"
        md="6"
      >
        <VCard>
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>Production (kW/hr)</VCardTitle>
          </VCardItem>

          <VCardText>
            <ProductionChart />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="match-height">
      <VCol
        class="d-flex"
        cols="4"
        lg="4"
        md="4"
      >
        <VCard class="flex-grow-1">
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>System Efficiency (kW/hr)</VCardTitle>
            <VCardSubtitle>Hourly efficiency metrics for system performance analysis</VCardSubtitle>

            <template #append>
              <div class="d-flex align-center">
                <VChip
                  color="success"
                  label
                >
                  <VIcon
                    icon="tabler-arrow-up"
                    size="15"
                    start
                  />
                  <span>22</span>
                </VChip>
              </div>
            </template>
          </VCardItem>

          <VCardText>
            <SystemEfficiencyChart />
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        lg="8"
        md="8"
      >
        <VCard class="fill-height">
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>COP vs ENERGY</VCardTitle>
            <VCardSubtitle>Performance insights based on COP and energy usage</VCardSubtitle>
          </VCardItem>

          <VCardText>
            <VRow class="h-100">
              <VCol
                cols="12"
                lg="8"
                md="8"
              >
                <EnergyLineChart />
              </VCol>

              <VCol
                class="d-flex align-center justify-center h-100 mt-15"
                cols="12"
                lg="4"
                md="4"
              />
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>


<style lang="scss">
@use "@core/scss/template/libs/apex-chart.scss";

.first-section {
  display: grid;
  grid-auto-flow: column;
  min-height: 600px; /* sesuaikan */
}

.first-section > .v-col {
  display: flex;
}
</style>

