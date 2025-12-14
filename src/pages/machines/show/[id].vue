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
  fetchMachines,
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
  camera.position.set(
    config.camera_x,
    config.camera_y,
    config.camera_z,
  )
  camera.updateProjectionMatrix()

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.addEventListener('end', syncCameraState)

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
  await fetchMachines()
  await nextTick()
  console.log(machines)
  let processedFacility = facility.value.entry
  console.log(processedFacility)
  name.value = processedFacility.name
  code.value = processedFacility.code
  description.value = processedFacility.description
  location.value = processedFacility.location
  positionX.value = processedFacility.position_x
  positionY.value = processedFacility.position_y
  positionZ.value = processedFacility.position_z
  existingThumbnail.value = [useStaticFile(processedFacility.thumbnail_path)]

})

const sourceVisits = [
  {
    avatarIcon: 'tabler-gauge',
    title: 'Energy Efficiency',
    subtitle: 'kW per TR',
    stats: '0.456 kW/TR',
    profitLoss: -0.344, // improvement from baseline
  },
  {
    avatarIcon: 'tabler-bolt',
    title: 'Energy Consumption',
    subtitle: 'Total Power Usage',
    stats: '233,344 kWh',
    profitLoss: -30234,
  },
  {
    avatarIcon: 'tabler-snowflake',
    title: 'Cooling Load',
    subtitle: 'Total TR-Hours',
    stats: '520,610 TR-hr',
    profitLoss: 175922, // increased load
  },
  {
    avatarIcon: 'tabler-currency-dollar',
    title: 'Cost Savings',
    subtitle: 'Operational Savings',
    stats: '$25,668',
    profitLoss: 3312,
  },
  {
    avatarIcon: 'tabler-leaf',
    title: 'CO₂ Reduction',
    subtitle: 'Carbon Emission Saved',
    stats: '24 tons',
    profitLoss: 0,
  },
  {
    avatarIcon: 'tabler-currency-dollar',
    title: 'Cost Savings',
    subtitle: 'Operational Savings',
    stats: '$25,668',
    profitLoss: 3312,
  },
  {
    avatarIcon: 'tabler-leaf',
    title: 'CO₂ Reduction',
    subtitle: 'Carbon Emission Saved',
    stats: '24 tons',
    profitLoss: 0,
  },
  {
    avatarIcon: 'tabler-currency-dollar',
    title: 'Cost Savings',
    subtitle: 'Operational Savings',
    stats: '$25,668',
    profitLoss: 3312,
  },
  {
    avatarIcon: 'tabler-leaf',
    title: 'CO₂ Reduction',
    subtitle: 'Carbon Emission Saved',
    stats: '24 tons',
    profitLoss: 0,
  },
]

const columnGroups = computed(() => {
  const size = 8
  const result = []

  for (let i = 0; i < sourceVisits.length; i += size) {
    result.push(sourceVisits.slice(i, i + size))
  }

  return result
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
            <!--            <VCol class="d-flex" cols="7">-->

            <!--              <div-->
            <!--                ref="threeContainer"-->
            <!--                class="rounded-lg overflow-hidden"-->
            <!--                style="width: 100%; border: 1px solid #e0e0e0;"-->
            <!--              />-->
            <!--            </VCol>-->
            <VCol cols="5">
              <div class="horizontal-scroll">
                <VRow class="flex-nowrap" no-gutters>
                  <VCol
                    v-for="(group, i) in columnGroups"
                    :key="i"
                    class="scroll-item"
                    cols="6"
                  >
                    <VList>
                      <VListItem
                        v-for="visit in group"
                        :key="visit.title"
                      >
                        <VListItemTitle>
                          {{ visit.title }}
                        </VListItemTitle>
                        <VListItemSubtitle>
                          {{ visit.subtitle }}
                        </VListItemSubtitle>
                        <template #append>
                          <div class="d-flex align-center gap-x-4">
                            <div class="text-body-1"> {{ visit.stats }}</div>

                          </div>
                        </template>
                      </VListItem>
                    </VList>
                  </VCol>
                </VRow>
              </div>
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
        <VImg :src="pages3"/>

        <VCardItem>
          <VCardTitle>{{ machine.name }}</VCardTitle>
        </VCardItem>

        <VCardText>
          {{ machine.description }}
        </VCardText>

        <VCardActions>
          <RouterLink :to="{ name: 'breakdowns-manage-id', params: { id: 'new' } }">
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
.horizontal-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
}

.scroll-item {
  flex: 0 0 auto;
}

.horizontal-scroll {
  scroll-behavior: smooth;
}
</style>
