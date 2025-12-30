<script setup>
import LoadChillerWidget from "@/components/dashboard/LoadChillerWidget.vue"
import StateCards from "@/components/dashboard/operation/StateCards.vue"
import mqtt from 'mqtt'



const {
  machine,
  fetchMachine,
} = useManageMachine()

const coefficientWithChilledWater = ref([{
  name: 'Coefficient of Performance (COP)',
  data: [],
}, {
  name: 'Δ Chilled Water',
  data: [],
}])

const coefficientWithEnergy = ref([
  {
    name: 'Coefficient of Performance (COP)',
    data: [],
  }, {
    name: 'Energy',
    data: [],
  },
])

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
    }
  })

  lastUpdate.value = timestamp || new Date().toISOString()
  console.log(`✅ Updated ${updatedCount}/${parameters.length} parameters`)
}

const MAX_POINTS = 20

const xCategories = ref([])

watch(mqttData, () => {
  const now = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  // Tambah label waktu
  xCategories.value.push(now)
  if (xCategories.value.length > MAX_POINTS) {
    xCategories.value.splice(0, xCategories.value.length - MAX_POINTS)
  }

  // === SERIES 0 : COP ===
  const copData = coefficientWithChilledWater.value[0].data
  const secondCopData = coefficientWithEnergy.value[0].data

  copData.push(getValue('1_Chiller_COP'))
  secondCopData.push(getValue('1_Chiller_COP'))
  if (copData.length > MAX_POINTS) {
    copData.splice(0, copData.length - MAX_POINTS)
  }
  if (secondCopData.length > MAX_POINTS) {
    secondCopData.splice(0, secondCopData.length - MAX_POINTS)
  }

  // === SERIES 1 : Delta T Chilled Water ===
  const deltaT =
    getValue('1_Entering_Chilled_Water_Temp') -
    getValue('1_Leaving_Chilled_Water_Temp')

  const deltaData = coefficientWithChilledWater.value[1].data
  const energyData = coefficientWithEnergy.value[1].data

  deltaData.push(deltaT)
  energyData.push(getValue("1_Chiller1 Load KW"))

  if (energyData.length > MAX_POINTS) {
    energyData.splice(0, energyData.length - MAX_POINTS)
  }
  if (deltaData.length > MAX_POINTS) {
    deltaData.splice(0, deltaData.length - MAX_POINTS)
  }

})


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

function getValue(paramCode) {
  const param = mqttData[paramCode]
  if (!param) return '-'

  const { value, unit, type } = param

  if (type === 'boolean') {
    return value ? 'ON' : 'OFF'
  }

  if (type === 'number') {
    return Math.round(value * 100) / 100
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

const modelConfigurationReady = computed(() => {
  return Boolean(processedMachine.value) 
})

const processedMachine = computed(() => {
  if (!machine?.value?.entry) return null
  
  return machine.value.entry
})

const machineState = computed(() => {
  if (!machine?.value?.entry) return null
 
  return {
    id: processedMachine.value.id, 
    name: processedMachine.value.name, 
    status: 'on',
    totalRuntime: '1,245h 30m',
  }
})

const runningTimes = computed(() => {

  const allowedKeys = [
    '1_Comp1RunningTime',
    '1_Comp2RunningTime',
    '1_Comp1OperatingState',
    '1_Comp2OperatingState',
    '1_Compressor1_Load',
    '1_Compressor2_Load',
  ]

  return  Object.entries(mqttData)
    .filter(([key]) => allowedKeys.includes(key))
    .map(([key, data]) => {
      return {
        code: data.code,
        name: data.name,
        status: Boolean(data.value),
        value: data.value,
        icon: 'tabler-temperature', color: '#10b981',
      }
    })

  
})

onMounted(async () => {
  await fetchMachine(1)
  await nextTick()

  if (processedMachine.value) {

    // Connect to MQTT
    connectMQTT()
  }
})

const deltaChilledWater = computed(mqttData => {
  return  String(getValue('1_Entering_Chilled_Water_Temp') - getValue('1_Leaving_Chilled_Water_Temp'))
})

const presRasioComp1 = computed(mqttData => {
  return  String(getValue('1_Comp1DischargePressure') - getValue('1_Comp1SuctionPressure'))
})

const presRasioComp2 = computed(mqttData => {
  return  String(getValue('1_Comp2DischargePressure') - getValue('1_Comp2SuctionPressure'))
})
</script>

<template>
  <div>
    <VRow
      class="match-height"
      style="min-height: 520px"
    >
      <!-- LEFT -->
      <VCol
        cols="12"
        lg="6"
        md="6"
        class="d-flex flex-column"
      >
        <ThreeModelViewer
          v-if="modelConfigurationReady"
          class="flex-grow-1"
          :model-path="processedMachine?.model_path"
        />
      </VCol>

      <!-- RIGHT -->
      <VCol
        cols="6"
        md="6"
        sm="6"
        class="d-flex flex-column"
      >
        <VRow class="match-height flex-grow-1">
          <VCol
            cols="12"
            class="py-3"
          >
            <StateCards
              v-if="machineState !== null"
              :machine="machineState"
              :running-times="runningTimes"
            />
          </VCol>

          <VCol
            cols="12"
            class="py-3"
          >
            <VRow>
              <VCol cols="6">
                <GaugeChartWidget :cop-value="isNaN(getValue('1_Chiller_COP')) ? 0 : getValue('1_Chiller_COP')" />
              </VCol>

              <VCol cols="6">
                <LoadChillerWidget
                  title="Load Chiller"
                  subtitle="Load chiller"
                  badge="Good"
                  :value="getValue('1_Chiller1 Load KW')"
                  icon="tabler-snowflake"
                  percentage="10"
                  unit="kW"
                />
              </VCol>
            </VRow>
          </VCol>
        </VRow>
      </VCol>
    </VRow>

    <VRow class="match-height">
      <VCol
        cols="3"
        md="3"
        sm="3"
      >
        <LoadChillerWidget 
          title="Leaving Chilled Water Temperature"
          subtitle="Leaving Chilled Water Temperature"
          badge="Good"
          :value="getValue('1_Leaving_Chilled_Water_Temp')"
          icon="tabler-snowflake"
          percentage="10"
          unit="kW"
        />
      </VCol>
      <VCol
        cols="3"
        md="3"
        sm="3"
      >
        <LoadChillerWidget 
          title="Delta T Chilled Water"
          subtitle="Delta T Chilled Water"
          badge="Good"
          :value="deltaChilledWater"
          icon="tabler-snowflake"
          percentage="10"
          unit="kW"
        />
      </VCol>
      <VCol
        cols="3"
        md="3"
        sm="3"
      >
        <LoadChillerWidget 
          title="Pres Rasio Comp 1"
          subtitle="Pres Rasio Comp 1"
          badge="Good"
          :value="presRasioComp1"
          icon="tabler-snowflake"
          percentage="10"
          unit="kW"
        />
      </VCol>
      <VCol
        cols="3"
        md="3"
        sm="3"
      >
        <LoadChillerWidget 
          title="Pres Rasio Comp 2"
          subtitle="Pres Rasio Comp 2"
          badge="Good"
          :value="presRasioComp2"
          icon="tabler-snowflake"
          percentage="10"
          unit="kW"
        />
      </VCol>
    </VRow>
   

    <VRow class="match-height">
      <VCol
        cols="12"
        lg="6"
        md="6"
      >
        <EnergyLineChart
          :realtime-data="coefficientWithChilledWater"
          :x-categories="xCategories"
          title="COP vs Chilled Water"
          subtitle="Performance insights based on COP and energy usage"
        />
      </VCol>
      <VCol
        cols="12"
        lg="6"
        md="6"
      >
        <EnergyLineChart
          :realtime-data="coefficientWithChilledWater"
          :x-categories="xCategories"
          title="COP vs Chilled Water"
          subtitle="Performance insights based on COP and energy usage"
        />
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

