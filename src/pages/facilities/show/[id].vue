<script setup>
import '@jaxtheprime/vue3-dropzone/dist/style.css'
import { nextTick, onMounted, reactive, ref } from 'vue'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

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
   MQTT SETUP - USING COMPOSABLE
========================= */

// Create MQTT connection instances for each machine
const mqttConnections = reactive({})

// Initialize MQTT connections for each machine
function setupMqttConnections() {
  const entries = machines.value?.entries

  if (!Array.isArray(entries)) return

  entries.forEach(machine => {
    if (!machine.mqtt_topic?.mqtt_broker) return

    // Create unique connection instance for each machine
    const connection = useMqttConnection()
    
    // Store connection
    mqttConnections[machine.id] = connection

    // Connect to MQTT broker
    connection.connectMQTT(machine)
  })
}

// Cleanup MQTT connections
function cleanupMqttConnections() {
  Object.values(mqttConnections).forEach(connection => {
    connection.disconnectMQTT()
  })
}

/* =========================
   COMPUTED - PROCESSED MACHINES WITH DATA
========================= */

const processedMachinesWithData = computed(() => {
  const entries = machines.value?.entries

  if (!Array.isArray(entries)) return []

  return entries.map(machine => {
    const connection = mqttConnections[machine.id]
    const parameters = machine.mqtt_topic?.parameters || []

    if (!connection) {
      return {
        id: machine.id,
        name: machine.name,
        parameters: parameters.map(parameter => ({
          name: parameter.name,
          code: parameter.code,
          value: null,
          unit: parameter.unit || '',
          status: 'unknown',
          formattedValue: '-',
          timestamp: null,
          hasData: false,
        })),
        lastUpdate: null,
        isOnline: false,
        dataCount: 0,
        mqttStatus: 'disconnected',
      }
    }


    return {
      id: machine.id,
      name: machine.name,
      parameters: parameters.map(parameter => {
        const paramData = connection.getParameter(parameter.code)

        return {
          name: parameter.name,
          code: parameter.code,
          value: connection.getRawValue(parameter.code),
          unit: parameter.unit || '',
          status: connection.getParameterStatus(parameter.code),
          formattedValue: connection.getFormattedValue(parameter.code),
          timestamp: paramData?.timestamp,
          hasData: connection.hasParameter(parameter.code),
        }
      }),
      lastUpdate: connection.lastUpdate || null,
      isOnline: connection.isConnected || false,
      dataCount: Object.keys(connection.getAllParameters()).length,
      mqttStatus: connection.mqttStatus || 'disconnected',
    }
  })
})

// MQTT Status summary for all connections
const mqttStatusSummary = computed(() => {
  const summary = {}
  
  Object.entries(mqttConnections).forEach(([machineId, connection]) => {
    const machine = machines.value?.entries?.find(m => m.id === machineId)
    if (!machine) return

    const broker = machine.mqtt_topic?.mqtt_broker
    if (!broker) return

    const key = `${broker.host_name}:${broker.ws_port}`

    summary[key] = connection.mqttStatus?.value || 'disconnected'
  })

  return summary
})

/* =========================
   LIFECYCLE
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
  
  // Setup MQTT connections after machines are loaded
  setupMqttConnections()
})

onBeforeUnmount(() => {
  destroyPreview()
  cleanupMqttConnections()
})

const currentTab = ref(0)
</script>

<template>
  <VRow>
    <!-- MQTT Status Indicators -->
    <VCol
      v-if="Object.keys(mqttStatusSummary).length > 0"
      cols="12"
    >
      <VCard>
        <VCardText>
          <div class="d-flex gap-2 flex-wrap">
            <VChip
              v-for="(status, broker) in mqttStatusSummary"
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
                data-testid="canvas-3d"
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
                      <span class="mr-1">{{ machine.name }}</span>
                    </VBadge>
                    <span
                      v-else
                      class="ml-5"
                    >{{ machine.name }}</span>
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
                          Last update: {{ machine.lastUpdate.toLocaleString() }}
                        </div>

                        <!-- No Connection Warning -->
                        <div
                          v-if="!machine.isOnline"
                          class="pa-3"
                        >
                          <VAlert
                            type="warning"
                            variant="tonal"
                            density="compact"
                          >
                            MQTT {{ machine.mqttStatus }}
                          </VAlert>
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
            <VChip
              v-else
              color="default"
              size="x-small"
            >
              {{ machine.mqttStatus }}
            </VChip>
          </VCardTitle>
        </VCardItem>

        <VCardText>
          {{ machines.entries.find(m => m.id === machine.id)?.description }}
        </VCardText>

        <VCardText v-if="machine.isOnline">
          <div class="text-caption">
            <strong>{{ machine.dataCount }}</strong> parameters active
          </div>
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
