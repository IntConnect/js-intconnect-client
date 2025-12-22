<script setup>
import '@jaxtheprime/vue3-dropzone/dist/style.css'
import { nextTick, onMounted, reactive, ref, watch } from 'vue'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import mqtt from 'mqtt'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const {
  facility,
  fetchFacility,
} = useManageFacility()

const {
  machines,
  fetchMachinesByFacilityId,
} = useManageMachine()


// Form fields
const name = ref('')
const code = ref('')
const description = ref('')
const location = ref('')
const thumbnail = ref([])
const existingThumbnail = ref([])
const positionX = ref(0)
const positionY = ref(0)
const positionZ = ref(0)

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
   THREE.JS FUNCTIONS
========================= */
function initThreePreview(config) {
  if (!threeContainer.value || !config.model_path) return

  destroyPreview()

  const width = threeContainer.value.clientWidth
  const height = threeContainer.value.clientHeight || 500

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  threeContainer.value.appendChild(renderer.domElement)

  const pmrem = new THREE.PMREMGenerator(renderer)

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)
  scene.environment = pmrem.fromScene(
    new RoomEnvironment(),
    0.04,
  ).texture

  // Camera (restore saved state)
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(config.camera_x, config.camera_y, config.camera_z)

  camera.updateProjectionMatrix()

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  controls.enableRotate = true
  controls.enableZoom = true
  controls.enablePan = true   // 🔴 INI PENTING

  // === KECEPATAN ===
  controls.rotateSpeed = 0.6
  controls.zoomSpeed = 0.8
  controls.panSpeed = 0.6

  // === PAN SCREEN SPACE (lebih natural) ===
  controls.screenSpacePanning = true

  // === TARGET AWAL ===
  controls.target.set(0, 0, 0)
  controls.update()

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


  })

  animate()
}

function animate() {
  if (!renderer) return
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
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

onMounted(async () => {
  await fetchFacility(id)
  await fetchMachinesByFacilityId(id)
  await nextTick()
  let processedFacility = facility.value.entry
  name.value = processedFacility.name
  code.value = processedFacility.code
  description.value = processedFacility.description
  location.value = processedFacility.location
  positionX.value = processedFacility.position_x
  positionY.value = processedFacility.position_y
  positionZ.value = processedFacility.position_z
  existingThumbnail.value = [useStaticFile(processedFacility.thumbnail_path)]
  initThreePreview(processedFacility)
})

const currentTab = ref(0)

// State untuk menyimpan real-time data dari MQTT
const mqttData = reactive({})
const lastUpdate = reactive({})

// MQTT clients dan status
const mqttClients = reactive({})
const mqttStatus = reactive({})

// Grouped brokers computation
const groupedBrokers = computed(() => {
  const map = {}
  const entries = machines.value?.entries

  if (!Array.isArray(entries)) {
    return map
  }

  entries.forEach(machine => {
    const topic = machine.mqtt_topic
    if (!topic || !topic.mqtt_broker) return

    const broker = topic.mqtt_broker
    const key = `${broker.host_name}:${broker.ws_port}`

    if (!map[key]) {
      map[key] = {
        broker,
        topics: new Set(),
      }
    }

    map[key].topics.add(topic.name)
  })

  return map
})

// ==========================================
// MQTT MESSAGE HANDLER
// ==========================================

/**
 * Parse MQTT message dengan struktur:
 * {
 *   "d": {
 *     "parameter_code": [value],
 *     ...
 *   },
 *   "ts": "2025-12-17T05:37:32.244815+07:00"
 * }
 */
function handleMqttMessage(topic, data) {
  console.log('📩 Received MQTT message:', { topic, data })

  // Validasi struktur data
  if (!data || typeof data !== 'object') {
    console.warn('Invalid data structure:', data)
    
    return
  }

  const { d: dataValues, ts: timestamp } = data

  if (!dataValues || typeof dataValues !== 'object') {
    console.warn('Missing "d" field in data:', data)
    
    return
  }

  // Find machine yang terkait dengan topic ini
  const entries = machines.value?.entries || []
  const machine = entries.find(m => m.mqtt_topic?.name === topic)

  if (!machine) {
    console.warn(`No machine found for topic: ${topic}`)
    
    return
  }

  console.log(`✅ Processing data for machine: ${machine.name}`)

  // Initialize storage untuk machine ini jika belum ada
  if (!mqttData[machine.id]) {
    mqttData[machine.id] = {}
  }

  // Process setiap parameter
  const parameters = machine.mqtt_topic?.parameters || []
  let updatedCount = 0

  parameters.forEach(parameter => {
    const paramCode = parameter.code

    // Check apakah parameter code ada di data
    if (paramCode in dataValues) {
      const rawValue = dataValues[paramCode]

      // Extract value dari array (struktur: [value])
      const value = Array.isArray(rawValue) ? rawValue[0] : rawValue

      // Store value
      mqttData[machine.id][paramCode] = {
        name: parameter.name,
        code: paramCode,
        value: value,
        unit: parameter.unit || '',
        timestamp: timestamp || new Date().toISOString(),
        type: typeof value,
      }

      updatedCount++

      console.log(`  ✓ ${parameter.name} (${paramCode}): ${value}`)
    }
  })

  // Update last update timestamp untuk machine
  lastUpdate[machine.id] = timestamp || new Date().toISOString()

  console.log(`✅ Updated ${updatedCount} parameters for ${machine.name}`)

  // Trigger reactive update jika perlu
  triggerUIUpdate(machine.id)
}

/**
 * Trigger UI update atau side effects
 */
function triggerUIUpdate(machineId) {
  // Optional: Trigger animations, notifications, atau updates lainnya
  // Contoh: update 3D model berdasarkan data

  const data = mqttData[machineId]
  if (!data) return

  // Example: Update 3D model berdasarkan operating state
  if (data['1_Chiller_Operating_State']?.value === true) {
    // Highlight atau animasi chiller dalam 3D scene
    console.log('🟢 Chiller is operating')
  } else if (data['1_Chiller_Operating_State']?.value === false) {
    console.log('🔴 Chiller is off')
  }

  // Example: Check threshold dan trigger alert
  const cop = data['1_Chiller_COP']?.value
  if (cop && cop < 5) {
    console.warn('⚠️ Low COP detected:', cop)
  }
}

/**
 * Get formatted value untuk display
 */
function getFormattedValue(machineId, paramCode) {
  const param = mqttData[machineId]?.[paramCode]
  if (!param) return '-'

  const { value, unit, type } = param

  // Format berdasarkan type
  if (type === 'boolean') {
    return value ? 'ON' : 'OFF'
  }

  if (type === 'number') {
    // Round to 2 decimal places
    const rounded = Math.round(value * 100) / 100
    
    return unit ? `${rounded} ${unit}` : rounded.toString()
  }

  return value?.toString() || '-'
}

/**
 * Get parameter status (for color coding)
 */
function getParameterStatus(machineId, paramCode) {
  const param = mqttData[machineId]?.[paramCode]
  if (!param) return 'unknown'

  const { value, type } = param

  if (type === 'boolean') {
    return value ? 'active' : 'inactive'
  }

  // Add custom logic untuk numeric thresholds
  if (paramCode === '1_Chiller_COP' && value < 5) {
    return 'warning'
  }

  return 'normal'
}

// ==========================================
// MQTT CONNECTION
// ==========================================

function connectBroker(brokerKey, brokerData) {
  if (mqttClients[brokerKey]?.connected) {
    console.log(`Already connected to ${brokerKey}`)
    
    return
  }

  const { broker, topics } = brokerData

  if (!broker.host_name || !broker.ws_port) {
    console.error('Invalid broker configuration:', broker)
    
    return
  }

  const url = `ws://${broker.host_name}:${broker.ws_port}/ws`

  console.log(`🔌 Attempting to connect to: ${url}`)

  try {
    const client = mqtt.connect(url, {
      username: broker.username || undefined,
      password: broker.password || undefined,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clean: true,
      clientId: `webapp_${Math.random().toString(16).slice(2, 10)}`,
    })

    mqttStatus[brokerKey] = 'connecting'

    client.on('connect', () => {
      console.log(`✅ MQTT connected: ${brokerKey}`)
      mqttStatus[brokerKey] = 'connected'

      topics.forEach(topic => {
        client.subscribe(topic, { qos: 0 }, err => {
          if (err) {
            console.error(`Failed to subscribe to ${topic}:`, err)
          } else {
            console.log(`📡 Subscribed to: ${topic}`)
          }
        })
      })
    })

    client.on('message', (topic, payload) => {
      const message = payload.toString()

      try {
        const data = JSON.parse(message)

        handleMqttMessage(topic, data)
      } catch (err) {
        console.error('❌ Failed to parse JSON:', err)
        console.error('Raw payload:', message)
      }
    })

    client.on('error', err => {
      console.error(`❌ MQTT error (${brokerKey}):`, err.message)
      mqttStatus[brokerKey] = 'error'
    })

    client.on('offline', () => {
      console.warn(`⚠️ MQTT offline: ${brokerKey}`)
      mqttStatus[brokerKey] = 'offline'
    })

    client.on('reconnect', () => {
      console.log(`🔄 MQTT reconnecting: ${brokerKey}`)
      mqttStatus[brokerKey] = 'reconnecting'
    })

    mqttClients[brokerKey] = client

  } catch (err) {
    console.error(`Failed to create MQTT client for ${brokerKey}:`, err)
    mqttStatus[brokerKey] = 'failed'
  }
}

// Watch and connect
watch(
  groupedBrokers,
  brokers => {
    Object.entries(brokers).forEach(([key, data]) => {
      connectBroker(key, data)
    })
  },
  { immediate: true },
)

// Cleanup
onBeforeUnmount(() => {
  console.log('🔌 Disconnecting all MQTT clients...')
  Object.entries(mqttClients).forEach(([key, client]) => {
    if (client?.connected) {
      client.end(true)
      console.log(`Disconnected from ${key}`)
    }
  })
})

// Computed untuk processed machines dengan real-time data
const processedMachinesWithData = computed(() => {
  const entries = machines.value?.entries

  if (!Array.isArray(entries)) return []

  return entries.map(machine => {
    const parameters = machine.mqtt_topic?.parameters || []
    const machineData = mqttData[machine.id] || {}

    return {
      id: machine.id,
      name: machine.name,
      parameters: parameters.map(parameter => {
        const realtimeData = machineData[parameter.code]

        return {
          name: parameter.name,
          code: parameter.code,
          value: realtimeData?.value,
          rawValue: realtimeData?.value, // For debugging
          unit: parameter.unit || '',
          status: getParameterStatus(machine.id, parameter.code),
          formattedValue: getFormattedValue(machine.id, parameter.code),
          timestamp: realtimeData?.timestamp,
          hasData: !!realtimeData, // Flag untuk check data tersedia
        }
      }),
      lastUpdate: lastUpdate[machine.id],
      isOnline: !!lastUpdate[machine.id],
      dataCount: Object.keys(machineData).length, // Jumlah parameter yang ada datanya
    }
  })
})
</script>

<template>
  <VRow>
    <!-- MQTT Status Indicators -->
    <VCol
      v-if="Object.keys(mqttStatus).length > 0"
      cols="12"
    >
      <VCard>
        <VCardText>
          <div class="d-flex gap-2 flex-wrap">
            <VChip
              v-for="(status, broker) in mqttStatus"
              :key="broker"
              :color="
                status === 'connected' ? 'success' :
                status === 'error' ? 'error' :
                status === 'connecting' || status === 'reconnecting' ? 'warning' :
                'default'
              "
              size="small"
            >
              {{ broker }}: {{ status }}
            </VChip>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Main Content -->
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        Facility {{ code }}-{{ name }}
      </h4>
      <p class="text-body-1 mb-4">
        {{ description }}
      </p>

      <VCard>
        <VCardText>
          <VRow class="match-height">
            <VCol
              class="d-flex"
              cols="7"
            >
              <div
                ref="threeContainer"
                class="rounded-lg overflow-hidden"
                style="width: 100%; min-height:500px;border: 1px solid #e0e0e0;"
              />
            </VCol>

            <VCol
              class="scroll-item"
              cols="5"
            >
              <VCard
                class="country-order-card d-flex flex-column"
                height="500"
              >
                <VTabs
                  v-model="currentTab"
                  class="flex-shrink-0"
                >
                  <VTab
                    v-for="(machine, index) in processedMachinesWithData"
                    :key="index"
                    :value="index"
                  >
                    <VBadge
                      v-if="machine.isOnline"
                      color="success"
                      dot
                      inline
                    >
                      {{ machine.name }}
                    </VBadge>
                    <span v-else>{{ machine.name }}</span>
                  </VTab>
                </VTabs>

                <VCardText class="flex-grow-1 pa-0 overflow-hidden">
                  <VWindow
                    v-model="currentTab"
                    class="h-100"
                  >
                    <VWindowItem
                      v-for="(machine, index) in processedMachinesWithData"
                      :key="index"
                      :value="index"
                      class="h-100"
                    >
                      <div class="parameter-vertical-scroll">
                        <!-- Last Update Info -->
                        <div
                          v-if="machine.lastUpdate"
                          class="pa-3 text-caption text-medium-emphasis"
                        >
                          Last update: {{ new Date(machine.lastUpdate).toLocaleString() }}
                        </div>

                        <VList lines="two">
                          <VListItem
                            v-for="(parameter, i) in machine.parameters"
                            :key="i"
                          >
                            <template #prepend>
                              <VIcon
                                :color="
                                  parameter.status === 'active' ? 'success' :
                                  parameter.status === 'warning' ? 'warning' :
                                  parameter.status === 'inactive' ? 'default' :
                                  'info'
                                "
                                size="small"
                              >
                                {{
                                  parameter.status === 'active' ? 'tabler-circle-check-filled' :
                                  parameter.status === 'warning' ? 'tabler-alert-circle' :
                                  parameter.status === 'inactive' ? 'tabler-circle-x' :
                                  'tabler-circle'
                                }}
                              </VIcon>
                            </template>

                            <VListItemTitle>
                              {{ parameter.name }}
                            </VListItemTitle>

                            <VListItemSubtitle>
                              <strong>{{ parameter.formattedValue }}</strong>
                              <span class="text-caption ml-2">({{ parameter.code }})</span>
                            </VListItemSubtitle>
                          </VListItem>
                        </VList>
                      </div>
                    </VWindowItem>
                  </VWindow>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Machine Cards -->
  <VRow>
    <VCol
      v-for="machine in processedMachinesWithData"
      :key="machine.id"
      cols="12"
      md="4"
      sm="6"
    >
      <VCard>
        <VImg :src="useStaticFile(machines.entries.find(m => m.id === machine.id)?.thumbnail_path)" />

        <VCardItem>
          <VCardTitle class="d-flex align-center gap-2">
            {{ machine.name }}
            <VChip
              v-if="machine.isOnline"
              color="success"
              size="x-small"
            >
              Live
            </VChip>
          </VCardTitle>
        </VCardItem>

        <VCardText>
          {{ machines.entries.find(m => m.id === machine.id)?.description }}
        </VCardText>

        <VCardActions>
          <RouterLink :to="{ name: 'machines-show-id', params: { id: machine.id } }">
            <VBtn>Details</VBtn>
          </RouterLink>
          <VSpacer />
        </VCardActions>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped>
/* Fix untuk VCard container */
.country-order-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* VTabs tidak boleh shrink */
.country-order-card .v-tabs {
  flex-shrink: 0;
}

/* VCardText harus bisa grow dan handle overflow */
.country-order-card .v-card-text {
  flex: 1 1 auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* VWindow harus full height */
.country-order-card .v-window {
  height: 100%;
  overflow: hidden;
}

/* VWindowItem harus full height */
.country-order-card .v-window-item {
  height: 100%;
}

/* Parameter scroll container */
.parameter-vertical-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
}

/* Custom scrollbar */
.parameter-vertical-scroll::-webkit-scrollbar {
  width: 6px;
}

.parameter-vertical-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.parameter-vertical-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.parameter-vertical-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.scroll-item {
  flex: 0 0 auto;
}
</style>
