<script setup>
import * as THREE from 'three'
import { onMounted, ref, reactive, nextTick } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as ThreeMeshUI from 'three-mesh-ui'

const wrapperRef = ref(null)
const canvasRef = ref(null)

let scene, camera, renderer, controls
let model = null
let modelLoaded = false

//----------------------------------------
// STATE MAPPING & UI
//----------------------------------------
const activeParameter = ref(null)

// contoh parameter dummy:
const availableParameters = reactive([
  { id: 1, name: "Temperature", value: "24°C" },
  { id: 2, name: "Pressure", value: "1.5 bar" },
  { id: 3, name: "Status", value: "OK" },
])

// array untuk semua mapping
const mappingList = reactive([])

// state untuk popup adjust
const showAdjustPopup = ref(false)
const tempMapping = ref(null) // mapping yang sedang di-adjust

// Helper function untuk hapus marker dari scene dengan aman
const removeMarkerFromScene = (marker) => {
  if (!marker || !scene) return

  // 1. Remove all children first
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

  // 2. Clear ThreeMeshUI
  if (marker.clear) marker.clear()

  // 3. Remove from parent first
  if (marker.parent) {
    marker.parent.remove(marker)
  }

  // 4. Remove from scene
  scene.remove(marker)

  // 5. Set to null
  marker = null
}
//----------------------------------------
// CREATE LABEL (marker)
//----------------------------------------
const createMarker = (parameter, position) => {
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

  const titleText = new ThreeMeshUI.Text({ content: parameter.name })
  const valueText = new ThreeMeshUI.Text({ content: parameter.value })

  panel.add(titleText)
  panel.add(valueText)

  panel.position.copy(position)
  scene.add(panel)

  return panel
}

//----------------------------------------
// INIT 3D (onMounted)
//----------------------------------------
onMounted(async () => {
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 100))

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Limit pixel ratio untuk performa

  // Lighting lebih efficient
  scene.add(new THREE.AmbientLight(0xffffff, 0.8))
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.4)
  dirLight.position.set(50, 100, 50)
  scene.add(dirLight)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.screenSpacePanning = true

  //----------------------------------------
  // LOAD MODEL
  //----------------------------------------
  const loader = new GLTFLoader()

  loader.load("/models/schema-5.glb", gltf => {
    model = gltf.scene
    modelLoaded = true

    model.updateMatrixWorld(true)

    // Optimasi model - simplify materials dan shadows
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false
        child.receiveShadow = false

        // Simplify material jika terlalu kompleks
        if (child.material) {
          child.material.needsUpdate = false
        }
      }
    })

    // center model
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())

    model.position.x -= center.x
    model.position.y -= center.y
    model.position.z -= center.z

    model.position.x -= 0.3

    scene.add(model)
  })

  //----------------------------------------
  // RAYCAST CLICK HANDLER
  //----------------------------------------
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  const onClick = event => {
    if (!activeParameter.value) {
      console.warn("No active parameter selected")
      return
    }

    // Prevent multiple clicks while popup is open
    if (showAdjustPopup.value && tempMapping.value != null) {
      return
    }

    // CEK: apakah parameter ini sudah di-map?
    const existingMapping = mappingList.find(m => m.parameterId === activeParameter.value.id)
    if (existingMapping) {
      alert(`Parameter "${activeParameter.value.name}" sudah di-map! Hapus mapping lama dulu jika ingin ubah posisi.`)
      return
    }

    const rect = renderer.domElement.getBoundingClientRect()

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(scene.children, true)

    if (intersects.length > 0) {
      const point = intersects[0].point.clone()

      // 1️⃣ buat marker label (temporary)
      const marker = createMarker(activeParameter.value, point)

      // 2️⃣ buat temporary mapping object
      tempMapping.value = {
        parameterId: activeParameter.value.id,
        parameterName: activeParameter.value.name,
        value: activeParameter.value.value,
        position: point.clone(),
        rotation: { x: 0, y: 0, z: 0 }, // tambah rotation
        marker,
      }

      // 3️⃣ tampilkan popup adjust
      showAdjustPopup.value = true

    }
  }

  renderer.domElement.addEventListener("click", onClick)

  //----------------------------------------
  // ANIMATE
  //----------------------------------------
  const animate = () => {
    requestAnimationFrame(animate)


    controls.update()

    // semua marker selalu hadap kamera KECUALI yang punya custom rotation
    mappingList.forEach(m => {
      if (m.marker && m.marker.parent) { // tambah check parent
        const hasCustomRotation = m.rotation && (m.rotation.x !== 0 || m.rotation.y !== 0 || m.rotation.z !== 0)

        if (!hasCustomRotation) {
          m.marker.quaternion.copy(camera.quaternion)
        } else {
          m.marker.rotation.set(
            THREE.MathUtils.degToRad(m.rotation.x),
            THREE.MathUtils.degToRad(m.rotation.y),
            THREE.MathUtils.degToRad(m.rotation.z),
          )
        }
      }
    })

    // marker temporary juga hadap kamera KECUALI sedang di-adjust rotationnya
    if (tempMapping.value?.marker && tempMapping.value.marker.parent) { // tambah check parent
      const hasCustomRotation = tempMapping.value.rotation &&
        (tempMapping.value.rotation.x !== 0 || tempMapping.value.rotation.y !== 0 || tempMapping.value.rotation.z !== 0)

      if (!hasCustomRotation) {
        tempMapping.value.marker.quaternion.copy(camera.quaternion)
      }
    }

    try {
      ThreeMeshUI.update()
    } catch (e) {
      // Ignore errors dari disposed markers
      console.warn('ThreeMeshUI update warning (safe to ignore):', e.message)
    }
    renderer.render(scene, camera)
  }

  animate()

  //----------------------------------------
  // RESIZE
  //----------------------------------------
  window.addEventListener("resize", () => {
    const w = wrapperRef.value.clientWidth
    const h = wrapperRef.value.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  })
})

//----------------------------------------
// SELECT PARAMETER
//----------------------------------------
const setActiveParameter = param => {
  // cek apakah parameter ini sudah di-map
  const alreadyMapped = mappingList.find(m => m.parameterId === param.id)
  if (alreadyMapped) {
    alert(`Parameter "${param.name}" sudah di-map! Hapus mapping lama dulu jika ingin ubah posisi.`)
    return
  }

  activeParameter.value = param
}

//----------------------------------------
// ADJUST POPUP HANDLERS
//----------------------------------------
const confirmMapping = () => {
  if (tempMapping.value) {
    // update posisi marker sesuai input terakhir
    tempMapping.value.marker.position.copy(tempMapping.value.position)

    // simpan ke mapping list
    mappingList.push(tempMapping.value)

  }

  // reset
  showAdjustPopup.value = false
  tempMapping.value = null
}

const cancelMapping = () => {
  if (tempMapping.value?.marker) {
    removeMarkerFromScene(tempMapping.value.marker)
    tempMapping.value.marker = null // pastikan reference di-null
  }

  showAdjustPopup.value = false
  tempMapping.value = null
}

const updateMarkerPosition = () => {
  if (tempMapping.value?.marker) {
    tempMapping.value.marker.position.copy(tempMapping.value.position)
  }
}

const updateMarkerRotation = () => {
  if (tempMapping.value?.marker) {
    tempMapping.value.marker.rotation.set(
      THREE.MathUtils.degToRad(tempMapping.value.rotation.x),
      THREE.MathUtils.degToRad(tempMapping.value.rotation.y),
      THREE.MathUtils.degToRad(tempMapping.value.rotation.z),
    )
  }
}

const deleteMapping = (index) => {

  const mapping = mappingList[index]
  if (mapping?.marker) {

    // Method 1: Remove langsung dari parent
    if (mapping.marker.parent) {
      mapping.marker.parent.remove(mapping.marker)
    }

    // Method 2: Remove dari scene
    scene.remove(mapping.marker)

    // Dispose ThreeMeshUI block
    if (mapping.marker.clear) {
      mapping.marker.clear()
    }

    // Dispose children
    while (mapping.marker.children.length > 0) {
      const child = mapping.marker.children[0]
      mapping.marker.remove(child)
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    }
  }

  mappingList.splice(index, 1)
}

</script>

<template>
  <div class="flex gap-4 relative">
    <!-- SIDEBAR PARAMETER -->
    <div class="w-1/4 bg-gray-100 p-3 rounded">
      <h3 class="font-bold mb-2">Parameters</h3>

      <div
        v-for="p in availableParameters"
        :key="p.id"
        :class="[
          activeParameter?.id === p.id ? 'bg-blue-300' : 'bg-white',
          mappingList.find(m => m.parameterId === p.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-100'
        ]"
        class="p-2 mb-2 rounded transition"
        @click="setActiveParameter(p)"
      >
        <div class="font-semibold">{{ p.name }}</div>
        <div class="text-sm text-gray-600">{{ p.value }}</div>
        <div v-if="mappingList.find(m => m.parameterId === p.id)" class="text-xs text-green-600 mt-1">
          ✓ Mapped
        </div>
      </div>

      <!-- MAPPING LIST -->
      <div v-if="mappingList.length > 0" class="mt-6">
        <h3 class="font-bold mb-2">Mapped Parameters</h3>
        <div
          v-for="(m, idx) in mappingList"
          :key="idx"
          class="bg-white p-2 mb-2 rounded text-sm"
        >
          <div class="font-semibold">{{ m.parameterName }}</div>
          <div class="text-xs text-gray-600 mt-1">
            <div>X: {{ m.position.x.toFixed(2) }}</div>
            <div>Y: {{ m.position.y.toFixed(2) }}</div>
            <div>Z: {{ m.position.z.toFixed(2) }}</div>
            <div v-if="m.rotation" class="mt-1 text-gray-500">
              Rot: {{ m.rotation.x }}°, {{ m.rotation.y }}°, {{ m.rotation.z }}°
            </div>
          </div>
          <button
            class="text-red-500 text-xs mt-1 hover:underline"
            @click="deleteMapping(idx)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- 3D MODEL -->
    <div ref="wrapperRef" class="three-wrapper rounded-lg grow">
      <canvas ref="canvasRef" class="rounded-lg"/>
    </div>

    <!-- ADJUST POPUP -->
    <div
      v-if="showAdjustPopup && tempMapping"
      class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-2xl rounded-lg p-6 z-50 w-96 max-h-[90vh] overflow-y-auto"
    >
      <h3 class="font-bold text-lg mb-4">Adjust Position</h3>

      <div class="mb-4 p-3 bg-gray-50 rounded">
        <div class="font-semibold">{{ tempMapping.parameterName }}</div>
        <div class="text-sm text-gray-600">{{ tempMapping.value }}</div>
      </div>

      <div class="space-y-3">
        <div class="border-b pb-3">
          <h4 class="font-semibold text-sm mb-2">Position</h4>
          <div class="space-y-2">
            <div>
              <label class="block text-xs font-semibold mb-1">X Position</label>
              <input
                v-model.number="tempMapping.position.x"
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.1"
                type="number"
                @input="updateMarkerPosition"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold mb-1">Y Position</label>
              <input
                v-model.number="tempMapping.position.y"
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.1"
                type="number"
                @input="updateMarkerPosition"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold mb-1">Z Position</label>
              <input
                v-model.number="tempMapping.position.z"
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.1"
                type="number"
                @input="updateMarkerPosition"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-semibold text-sm mb-2">Rotation (degrees)</h4>
          <div class="space-y-2">
            <div>
              <label class="block text-xs font-semibold mb-1">X Rotation</label>
              <input
                v-model.number="tempMapping.rotation.x"
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="1"
                type="number"
                @input="updateMarkerRotation"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold mb-1">Y Rotation</label>
              <input
                v-model.number="tempMapping.rotation.y"
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="1"
                type="number"
                @input="updateMarkerRotation"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold mb-1">Z Rotation</label>
              <input
                v-model.number="tempMapping.rotation.z"
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="1"
                type="number"
                @input="updateMarkerRotation"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button
          class="flex-1 bg-blue-500 text-white rounded py-2 font-semibold hover:bg-blue-600 transition"
          @click="confirmMapping"
        >
          Confirm
        </button>
        <button
          class="flex-1 bg-gray-300 text-gray-700 rounded py-2 font-semibold hover:bg-gray-400 transition"
          @click="cancelMapping"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- OVERLAY BACKDROP -->
    <div
      v-if="showAdjustPopup"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="cancelMapping"
    ></div>
  </div>
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
