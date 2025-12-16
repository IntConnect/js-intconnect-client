<script setup>
import { ref, reactive, watch, onMounted, nextTick } from 'vue'
import '@jaxtheprime/vue3-dropzone/dist/style.css'

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import pages3 from '@images/pages/3.png'


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

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)

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

const processedMachines = computed(() => {
  console.log(machines)

  const entries = machines.value?.entries

  if (!Array.isArray(entries)) return []
  console.log(entries)

  return entries.map(machine => {
    let parameters = machine.parameters.map(parameter => {
      return {
        name: parameter?.name ?? '-',
        code: parameter?.code ?? '-',
      }
    })

    return {
      name: machine.name,
      parameters: parameters,
    }
  })
})
</script>

<template>
  <VRow>
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
              <VCard class="country-order-card d-flex flex-column" height="500">
                <VTabs
                  v-model="currentTab"
                  class="flex-shrink-0"
                >
                  <VTab
                    v-for="(machine, index) in processedMachines"
                    :key="index"
                    :value="index"
                  >
                    {{ machine.name }}
                  </VTab>
                </VTabs>

                <VCardText class="flex-grow-1 pa-0 overflow-hidden">
                  <VWindow
                    v-model="currentTab"
                    class="h-100"
                  >
                    <VWindowItem
                      v-for="(machine, index) in processedMachines"
                      :key="index"
                      :value="index"
                      class="h-100"
                    >
                      <div class="parameter-vertical-scroll">
                        <VList lines="two">
                          <VListItem
                            v-for="(parameter, i) in machine.parameters"
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
  <VRow>
    <VCol
      v-for="machine in machines.entries"
      cols="12"
      md="4"
      sm="6"
    >
      <VCard
      >
        <VImg :src="useStaticFile(machine.thumbnail_path)"/>

        <VCardItem>
          <VCardTitle>{{ machine.name }}</VCardTitle>
        </VCardItem>

        <VCardText>
          {{ machine.description }}
        </VCardText>

        <VCardActions>
          <RouterLink :to="{ name: 'machines-show-id', params: { id: machine.id } }">
            <VBtn>
              Details
            </VBtn>
          </RouterLink>
          <VSpacer/>

        </VCardActions>


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
