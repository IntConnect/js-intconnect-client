<script setup>
import { ref, reactive, watch, onMounted, nextTick } from 'vue'
import '@jaxtheprime/vue3-dropzone/dist/style.css'

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'


const route = useRoute()
const router = useRouter()
const id = route.params.id

const {
  machine,
  fetchMachine,
} = useManageMachine()
const processedMachine = computed(() => {
  if (!machine?.value) return {}
  return machine?.value.entry
})


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

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(
    new RoomEnvironment(),
    0.04,
  ).texture
  // Camera (restore saved state)
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(0, 2, 5)

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
  controls.addEventListener('end', syncCameraState)

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

function syncCameraState() {
  if (!camera) return

  camera.x = Number(camera.position.x.toFixed(4))
  camera.y = Number(camera.position.y.toFixed(4))
  camera.z = Number(camera.position.z.toFixed(4))
  camera.zoom = Number(camera.zoom.toFixed(4))
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
  await fetchMachine(id)
  await nextTick()
  console.log(processedMachine.value)
  name.value = processedMachine.value.name
  code.value = processedMachine.value.code
  description.value = processedMachine.value.description
  location.value = processedMachine.value.location
  positionX.value = processedMachine.value.position_x
  positionY.value = processedMachine.value.position_y
  positionZ.value = processedMachine.value.position_z
  initThreePreview(processedMachine.value)
})

const currentTab = ref(0)

</script>

<template>
  <VRow>
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

                <VCardText class="flex-grow-1 pa-0 overflow-hidden">
                  <div class="parameter-vertical-scroll">
                    <VList lines="two">
                      <VListItem
                        v-for="(parameter, i) in processedMachine?.parameters"
                        :key="i"
                      >
                        <VListItemTitle>
                          {{ parameter.name }}
                        </VListItemTitle>
                        <VListItemSubtitle>
                          {{ parameter.code }}
                        </VListItemSubtitle>
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
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>Machine Performance</VCardTitle>
          <VCardSubtitle>Performance insights based on COP and energy usage</VCardSubtitle>
        </VCardItem>
        <VCardText>
          <VRow class="h-100">
            <VCol
              cols="12"
              lg="6"
              md="6"
            >
              <EnergyLineChart/>
            </VCol>
            <VCol
              cols="12"
              lg="6"
              md="6"
            >
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
