<script setup>
import { ref, reactive, watch, onMounted, nextTick, computed, onBeforeUnmount } from 'vue'
import '@jaxtheprime/vue3-dropzone/dist/style.css'

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import mqtt from 'mqtt'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const {
  machine,
  fetchMachine,
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

// ==========================================
// MQTT STATE
// ==========================================
const mqttData = reactive({})
const lastUpdate = ref(null)
const mqttClient = ref(null)
const mqttStatus = ref('disconnected')

/* =========================
   THREE.JS STATE (RUNTIME)
========================= */
const threeContainer = ref(null)

let renderer = null
let scene = null
let camera = null
let controls = null
let model = null

const processedMachine = computed(() => {
  if (!machine?.value?.entry) return null
  return machine.value.entry
})

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
      clientId: `machine_${id}_${Math.random().toString(16).slice(2, 10)}`,
    })

    mqttStatus.value = 'connecting'

    mqttClient.value.on('connect', () => {
      console.log(`✅ MQTT Connected`)
      mqttStatus.value = 'connected'

      // Subscribe to topic
      mqttClient.value.subscribe(topic, { qos: 0 }, (err) => {
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

    mqttClient.value.on('error', (err) => {
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

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  // Camera
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(config.camera_x, config.camera_y, config.camera_z)
  camera.updateProjectionMatrix()

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enableRotate = true
  controls.enableZoom = true
  controls.enablePan = true
  controls.rotateSpeed = 0.6
  controls.zoomSpeed = 0.8
  controls.panSpeed = 0.6
  controls.screenSpacePanning = true
  controls.target.set(0, 0, 0)
  controls.update()

  // Light
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1))

  // Load Model
  const loader = new GLTFLoader()
  loader.load(useStaticFile(config.model_path), gltf => {
    model = gltf.scene
    model.updateMatrixWorld(true)

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

onMounted(async () => {
  await fetchMachine(id)
  await nextTick()

  if (processedMachine.value) {
    name.value = processedMachine.value.name
    code.value = processedMachine.value.code
    description.value = processedMachine.value.description

    initThreePreview(processedMachine.value)

    // Connect to MQTT
    connectMQTT()
  }
})

onBeforeUnmount(() => {
  console.log('🔌 Disconnecting MQTT client...')
  if (mqttClient.value?.connected) {
    mqttClient.value.end(true)
  }
  destroyPreview()
})

// Watch for machine data changes
watch(() => processedMachine.value?.mqtt_topic, (newTopic) => {
  if (newTopic && !mqttClient.value) {
    connectMQTT()
  }
})
</script>

<template>
  <VRow>
    <!-- MQTT Status -->
    <VCol v-if="processedMachine?.mqtt_topic" cols="12">
      <VCard>
        <VCardText>
          <div class="d-flex gap-2 flex-wrap align-center">
            <VChip
              :color="
                mqttStatus === 'connected' ? 'success' :
                mqttStatus === 'error' ? 'error' :
                mqttStatus === 'connecting' || mqttStatus === 'reconnecting' ? 'warning' :
                'default'
              "
              size="small"
            >
              <VIcon size="small" start>
                {{
                  mqttStatus === 'connected' ? 'tabler-plug-connected' :
                    mqttStatus === 'error' ? 'tabler-plug-x' :
                      'tabler-plug'
                }}
              </VIcon>
              MQTT: {{ mqttStatus }}
            </VChip>

            <VChip
              v-if="lastUpdate"
              color="info"
              size="small"
              variant="outlined"
            >
              Last update: {{ new Date(lastUpdate).toLocaleTimeString() }}
            </VChip>

            <VChip
              color="info"
              size="small"
              variant="outlined"
            >
              {{ Object.keys(mqttData).length }} / {{ processedMachine.mqtt_topic.parameters.length }} parameters
            </VChip>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Main Content -->
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        Machine {{ code }}-{{ name }}
      </h4>
      <p class="text-body-1 mb-4">
        {{ description }}
      </p>

      <VCard>
        <VCardText>
          <VRow class="match-height">
            <VCol class="d-flex" cols="7">
              <div
                ref="threeContainer"
                class="rounded-lg overflow-hidden"
                style="width: 100%; min-height:500px;border: 1px solid #e0e0e0;"
              />
            </VCol>

            <VCol class="scroll-item" cols="5">
              <VCard class="country-order-card d-flex flex-column" height="500">
                <VCardItem class="pb-2">
                  <VCardTitle>Real-time Parameters</VCardTitle>
                  <VCardSubtitle>
                    <VBadge
                      v-if="mqttStatus === 'connected'"
                      color="success"
                      dot
                      inline
                    >
                      Live Data
                    </VBadge>
                    <span v-else class="text-medium-emphasis">
                      Connecting...
                    </span>
                  </VCardSubtitle>
                </VCardItem>

                <VCardText class="flex-grow-1 pa-0 overflow-hidden">
                  <div class="parameter-vertical-scroll">
                    <VList lines="two">
                      <VListItem
                        v-for="(parameter, i) in parametersWithData"
                        :key="i"
                        :class="{ 'bg-surface-light': parameter.hasData }"
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

                        <VListItemTitle class="d-flex align-center gap-2">
                          {{ parameter.name }}
                          <VChip
                            v-if="parameter.hasData"
                            color="success"
                            size="x-small"
                          >
                            Live
                          </VChip>
                        </VListItemTitle>

                        <VListItemSubtitle>
                          <strong class="text-h6">{{ parameter.formattedValue }}</strong>
                          <br>
                          <span class="text-caption">({{ parameter.code }})</span>
                          <span v-if="parameter.timestamp" class="text-caption ml-2">
                            • {{ new Date(parameter.timestamp).toLocaleTimeString() }}
                          </span>
                        </VListItemSubtitle>
                      </VListItem>

                      <VListItem v-if="parametersWithData.length === 0">
                        <VAlert density="compact" type="info">
                          No parameters configured for this machine
                        </VAlert>
                      </VListItem>
                    </VList>
                  </div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Performance Charts -->
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>Machine Performance</VCardTitle>
          <VCardSubtitle>Performance insights based on COP and energy usage</VCardSubtitle>
        </VCardItem>
        <VCardText>
          <VRow class="h-100">
            <VCol cols="12" lg="6" md="6">
              <EnergyLineChart/>
            </VCol>
            <VCol cols="12" lg="6" md="6">
              <EnergyLineChart/>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <AlertDialog
    :body-alert="bodyAlert"
    :is-dialog-visible="isAlertDialogVisible"
    :title-alert="titleAlert"
    :type="alertType"
    @update:is-dialog-visible="isAlertDialogVisible = $event"
  />
</template>

<style scoped>
.country-order-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.country-order-card .v-card-text {
  flex: 1 1 auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.parameter-vertical-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
}

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

.bg-surface-light {
  background-color: rgba(var(--v-theme-success), 0.08);
}
</style>
