<script setup>
import AlertDialog from "@/components/general/AlertDialog.vue"
import GeneralAlert from "@/components/general/GeneralAlert.vue"
import { useManageRegister } from "@/composables/useManageRegister.js"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import * as THREE from 'three'
import * as ThreeMeshUI from "three-mesh-ui"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { nextTick, onMounted, ref } from 'vue'


// ==========================================
// Composable
// ==========================================
const {
  registers,
  register,
  registerDependency,
  loading,
  actionLoading,
  fetchRegisterDependency,
  fetchRegister,
  fetchRegisters,
  totalItems,
  saveRegister,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
  getRegisterById,
} = useManageRegister()

const {
  machine,
  fetchMachine,
} = useManageMachine()


// ==========================================
// State
// ==========================================
const currentStep = ref(0)
const machineId = ref(null)
const modbusServerId = ref(null)
const memoryLocation = ref('')
const name = ref('')
const description = ref('')
const dataType = ref('String')
const processedMachines = ref([])
const processedModbusServers = ref([])
const isAlertDialogVisible = ref(false)
const isModelClickable = ref(false)
const refForm = ref()
const modelPath = ref('')
const processedRegisters = ref([])
const isEditMode = computed(() => route.name === 'register-edit')


const numberedSteps = [
  {
    title: 'Register Details',
    subtitle: 'Basic Information',
  },
  
  {
    title: 'Summary',
    subtitle: 'Review Before Submit',
  },
]

const buttonModelColor = computed(() => {
  return isModelClickable.value ? "warning" : "info"
})

const buttonModelText = computed(() => {
  return isModelClickable.value ? "Click Again to Off Set Position" : "Click on 3D Model to Set Position"
})


const wrapperRef = ref(null)
const canvasRef = ref(null)

let scene, camera, renderer, controls
let model = null

// marker untuk register ini
let registerMarker = null
const showAdjustPopup = ref(false)
const bodyAlert = ref('')
const titleAlert = ref('')
const alertType = ref('info')

onMounted(async () => {
  await fetchRegisterDependency()
    processedMachines.value = registerDependency.value.entry.machines?.map(machine => ({
    title: machine.name,
    value: machine.id,
  }))
  processedModbusServers.value = registerDependency.value.entry.modbus_servers?.map(modbus_server => ({
    title: modbus_server.ip_address,
    value: modbus_server.id,
  }))
  if(isEditMode.value){
  let result = await fetchRegister(id.value)
  await fetchRegisters({isAutomatic: null})
  await nextTick()
  console.log(register.value)

  if (result.success) {
    let processedRegister = register.value.entry
    console.log(processedRegister)
    id.value = processedRegister.id
    name.value = processedRegister.name
    machineId.value = processedRegister['machine_id'] 
    modbusServerId.value = processedRegister['modbus_server_id']
    memoryLocation.value = processedRegister['memory_location']
    name.value = processedRegister['name']
    description.value = processedRegister['description']
    initialModel()
  }else{
    id.value = null
  }
  }
})


// ----------------------------------------
// Helper: Hapus marker dari scene
// ----------------------------------------
const removeMarker = marker => {
  if (!marker || !scene) return

  while (marker.children.length > 0) {
    const child = marker.children[0]

    marker.remove(child)
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => {
          if (m.map) m.map.dispose()
          m.dispose()
        })
      } else {
        if (child.material.map) child.material.map.dispose()
        child.material.dispose()
      }
    }
  }

  if (marker.clear) marker.clear()
  if (marker.parent) {
    marker.parent.remove(marker)
  }
  scene.remove(marker)
}

// ----------------------------------------
// Create marker/label
// ----------------------------------------
const createMarker = (registerName, registerValue, position) => {
  const panel = new ThreeMeshUI.Block({
    width: 10,
    height: 5,
    padding: 0.03,
    borderRadius: 0.05,
    justifyContent: 'center',
    alignContent: 'center',
    fontSize: 1.5,
    backgroundColor: new THREE.Color(0x222222),
    backgroundOpacity: 0.85,
    fontFamily: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json',
    fontTexture: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png',
  })

  const titleText = new ThreeMeshUI.Text({ content: registerName })
  const valueText = new ThreeMeshUI.Text({ content: registerValue })

  panel.add(titleText)
  panel.add(valueText)

  panel.position.copy(position)
  scene.add(panel)

  return panel
}

// ----------------------------------------
// Update marker position
// ----------------------------------------
const updateMarkerPosition = value => {
  if (registerMarker) {
    registerMarker.position.set(
      positionX.value,
      positionY.value,
      positionZ.value,
    )

    registerMarker.rotation.set(
      rotationX.value,
      rotationY.value,
      rotationZ.value,
    )
  }
}

// ----------------------------------------
// Update marker rotation
// ----------------------------------------
const updateMarkerRotation = () => {
  if (registerMarker) {
    registerMarker.rotation.set(
      THREE.MathUtils.degToRad(rotationX.value),
      THREE.MathUtils.degToRad(rotationY.value),
      THREE.MathUtils.degToRad(rotationZ.value),
    )
  }
}

// ----------------------------------------
// Click on 3D model untuk set posisi
// ----------------------------------------
const setPositionFromClick = () => {
  if (!name.value || !code.value) {
    isAlertDialogVisible.value = true
    bodyAlert.value = 'Fill Name and Register First!'
    titleAlert.value = "Invalid Input"
    alertType.value = 'error'

    return
  }
  isModelClickable.value = !isModelClickable.value

  // Hapus marker lama jika ada
  if (registerMarker) {
    removeMarker(registerMarker)
    registerMarker = null
  }

  // Tunggu user klik 3D model
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  const handleClick = event => {
    const rect = renderer.domElement.getBoundingClientRect()

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(scene.children, true)

    if (intersects.length > 0) {
      const point = intersects[0].point.clone()

      // Set nilai ke form
      positionX.value = point.x
      positionY.value = point.y
      positionZ.value = point.z

      const hit = intersects[0]

      const normal = hit.face.normal.clone()

      normal.transformDirection(hit.object.matrixWorld)  // convert ke world normal

      // Convert normal ke rotasi (Euler)
      const rotation = new THREE.Euler()

      rotation.setFromVector3(normal)

      // Set ke form (dalam radian)
      rotationX.value = rotation.x
      rotationY.value = rotation.y
      rotationZ.value = rotation.z

      // Buat marker
      registerMarker = createMarker(name.value, unit.value, point)

      // Cleanup listener
      renderer.domElement.removeEventListener("click", handleClick)
      isAlertDialogVisible.value = true
      titleAlert.value = "Position successfully set"
      bodyAlert.value = "You can adjusted in Adjust Manual button"
    }
  }

  renderer.domElement.addEventListener("click", handleClick)
}

// ----------------------------------------
// Confirm & tampilkan popup untuk adjustment
// ----------------------------------------
const showAdjustment = () => {
  if (!name.value || !code.value) {
    isAlertDialogVisible.value = true
    bodyAlert.value = 'Fill Name and Register First!'
    alertType.value = 'error'

    return
  }

  // Buat marker jika belum ada
  if (!registerMarker) {
    registerMarker = createMarker(
      name.value,
      unit.value,
      new THREE.Vector3(positionX.value, positionY.value, positionZ.value),
    )
  }

  // Update marker sesuai nilai form terbaru
  updateMarkerPosition()
  updateMarkerRotation()

  showAdjustPopup.value = true
}

const confirmAdjustment = () => {
  updateMarkerPosition()
  updateMarkerRotation()
  showAdjustPopup.value = false
}

const cancelAdjustment = () => {
  showAdjustPopup.value = false
}


const initialModel = async () => {

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)

  const width = wrapperRef.value.clientWidth
  const height = wrapperRef.value.clientHeight

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(180, 70, -40)

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  })

  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  scene.add(new THREE.AmbientLight(0xffffff, 0.8))

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.4)

  dirLight.position.set(50, 100, 50)
  scene.add(dirLight)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.screenSpacePanning = true

  // ----------------------------------------
  // LOAD MODEL
  // ----------------------------------------
  const loader = new GLTFLoader()

  if (modelPath.value) {
    loadDynamicModel()
  }


  // ----------------------------------------
  // ANIMATE
  // ----------------------------------------
  const animate = () => {
    requestAnimationFrame(animate)

    controls.update()

    // Marker selalu hadap kamera kecuali ada custom rotation
    if (registerMarker && registerMarker.parent) {
      const hasCustomRotation = (rotationX.value !== 0 || rotationY.value !== 0 || rotationZ.value !== 0)

      if (!hasCustomRotation) {
        registerMarker.quaternion.copy(camera.quaternion)
      } else {
        registerMarker.rotation.set(
          THREE.MathUtils.degToRad(rotationX.value),
          THREE.MathUtils.degToRad(rotationY.value),
          THREE.MathUtils.degToRad(rotationZ.value),
        )
      }
    }

    try {
      ThreeMeshUI.update()
    } catch (e) {
      console.warn('ThreeMeshUI update warning:', e.message)
    }
    renderer.render(scene, camera)
  }


  animate()

  // ----------------------------------------
  // RESIZE
  // ----------------------------------------
  window.addEventListener("resize", () => {
    const w = wrapperRef.value.clientWidth
    const h = wrapperRef.value.clientHeight

    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  })

}

const id = ref('')
const route = useRoute()
const router = useRouter()

id.value = route.params.id

const onSubmit = () => {
  refForm.value.validate().then(async ({ valid }) => {
    if (!valid) return

    
    const registerData = {
      id: id.value,
      machine_id: machineId.value,
      modbus_server_id: modbusServerId.value,
      memory_location: memoryLocation.value,
      name: name.value,
      description: description.value,
      data_type: dataType.value,
    }

    const result = await saveRegister(registerData)

    if (result.success) {
      await nextTick()

      isAlertDialogVisible.value = true
      bodyAlert.value = "You will be redirect to register page"
      alertType.value = 'info'
      titleAlert.value = "Success manage Register"

      setTimeout(() => {
        router.push('/registers')
      }, 2000)
    } else {
      currentStep.value = 0
      console.error('Failed to save register:', result.error || result.errors)
    }
  })
}

watch(currentStep, async value => {
  if (value === 1) {
    await nextTick()

    if (!wrapperRef.value) return

    initialModel()
  }
})

watch(machineId, async value => {
  if (!value) return

  await fetchMachine(value)
  await nextTick()
  modelPath.value = machine.value.entry.model_path

  // Reload 3D model
  loadDynamicModel()
})

const loadDynamicModel = () => {
  if (!scene) {
    console.warn("Scene belum siap untuk load model")

    return
  }

  if (!modelPath.value) return

  const loader = new GLTFLoader()

  // Hapus model lama
  if (model) {
    scene.remove(model)
    model.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
    })
    model = null
  }

  loader.load(useStaticFile(modelPath.value), gltf => {
    model = gltf.scene
    model.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())

    model.position.sub(center)

    scene.add(model)
  })
}

watch([modelPath, () => scene], async () => {
  if (scene && modelPath.value) {
    loadDynamicModel()
  }
})

watch(registers, () => {
  const list = registers.value['entries']

  if (!Array.isArray(list)) return []
  processedRegisters.value = list.map((register) => {
    return {
      title: register.code,
      value: register.id
    }
  })
})

const availableOps = [
  { title: 'Add (+)', value: 'ADDITION' },
  { title: 'Subtract (-)', value: 'SUBTRACTION' },
  { title: 'Multiply (×)', value: 'MULTIPLICATION' },
  { title: 'Divide (÷)', value: 'DIVISION' },
]

// Add new operation
function addOperation() {
  processedRegisterSequences.value.push({
    type: 'ADDITION',
    register_id: null,
  })

}

// Remove operation
function removeOperation(index) {
  const op = processedRegisterSequences.value[index]

  // jika punya id, masuk list deleted
  if (op && op.id) {
  }

  processedRegisterSequences.value.splice(index, 1)
}
</script>

<template>
  <VCol cols="6">
    <h4 class="text-h4 mb-1 mt-1">
      Create New Register
    </h4>
    <p class="text-body-1 mb-2">
      Manage register information in machine
    </p>
  </VCol>
  <div class="mb-6 d-flex justify-center">
    <AppStepper v-model:current-step="currentStep" :items="numberedSteps" align="start" />
  </div>

  <VRow>
    <!-- 3D MODEL - 7 cols -->

    <!-- FORM - 5 cols -->
    <VCol cols="12">
      <VCard>
        <VCardText>
          <VForm ref="refForm" lazy-validation @submit.prevent="onSubmit">
            <VWindow v-model="currentStep" class="disable-tab-transition">
              <VWindowItem>
                <VCol>
                  <VCol cols="12">
                    <GeneralAlert v-if="formErrors.value" color="error"
                      description="There are error for some input, please fix it first!" icon="tabler-bug" />
                    <AppSelect v-model="machineId" :error="!!formErrors.machine_id"
                      :error-messages="formErrors.machine_id" :items="processedMachines" class="mt-3" label="Machine"
                      placeholder="Select a Machine" />
                  </VCol>
                   <VCol cols="12">
                    <AppSelect v-model="modbusServerId" :error="!!formErrors.modbus_server_id"
                      :error-messages="formErrors.machine_id" :items="processedModbusServers" class="" label="Modbus Server"
                      placeholder="Select a Modbus Server" />
                  </VCol>
                 


                  <VCol cols="12">
                    <AppTextField v-model="memoryLocation" :error="!!formErrors.memory_location" :error-messages="formErrors.memory_location"
                      label="Memory Location" placeholder="e.g., 40001" required />
                  </VCol>

                  <VCol cols="12">
                    <AppTextField v-model="name" :error="!!formErrors.name" :error-messages="formErrors.name"
                      label="Name" placeholder="e.g., TEMP_01" required />
                  </VCol>
                 

                  
                  <VCol cols="12">
                    <AppTextField v-model="description" :error="!!formErrors.description"
                      :error-messages="formErrors.description" label="Description"
                      placeholder="Describe this register" />
                  </VCol>
                  <VCol cols="12">
                    <AppSelect v-model="dataType" :error="!!formErrors.data_type"
                      :error-messages="formErrors.data_type" :items="[{
                        title: 'String',
                        value: 'String',
                      }, {
                        title: 'Number',
                        value: 'Number',
                      }, {
                        title: 'Boolean (TRUE or FALSE)',
                        value: 'Boolean',
                      }]" label="Data Type" placeholder="Select a Data Type" />
                  </VCol>

                
               
                </VCol>
              </VWindowItem>           
              
            </VWindow>
            <div class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center mt-8">
              <VBtn :disabled="currentStep === 0" color="secondary" variant="tonal" @click="currentStep--">
                <VIcon class="flip-in-rtl" icon="tabler-arrow-left" start />
                Previous
              </VBtn>
              <VBtn v-if="numberedSteps.length - 1 === currentStep" color="success" @click="onSubmit">
                Submit
              </VBtn>
              <VBtn v-else @click="currentStep++">
                Next
                <VIcon class="flip-in-rtl" end icon="tabler-arrow-right" />
              </VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
  <AlertDialog :body-alert="bodyAlert" :is-dialog-visible="isAlertDialogVisible" :title-alert="titleAlert"
    :type="alertType" @update:is-dialog-visible="isAlertDialogVisible = $event" />
</template>

<style scoped>
.three-wrapper {
  width: 100%;
  height: 90vh;
  min-height: 100px;
  position: relative;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
