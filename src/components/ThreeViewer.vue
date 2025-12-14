<script setup>
import * as THREE from 'three'
import { onMounted, ref, nextTick } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as ThreeMeshUI from 'three-mesh-ui'
import buildingModel from '@/assets/models/building.glb'

const props = defineProps({
  modelConfiguration: {
    type: Object,
    required: false,
    default: () => {
    },
  },
})

watch(
  () => props.modelConfiguration,
  async config => {
    console.log(config)
    if (!config || !config.entry) return

    await nextTick()
    initScene(config)
  },
  { immediate: true },
)


const wrapperRef = ref(null)
const canvasRef = ref(null)

let scene, camera, renderer, controls, model
const labels = []

function initScene(config) {
  if (!wrapperRef.value || !canvasRef.value) return

  // CLEANUP (hot reload safe)
  if (renderer) {
    renderer.dispose()
    renderer = null
  }

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)

  const width = wrapperRef.value.clientWidth
  const height = wrapperRef.value.clientHeight

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(
    Number(config.entry.value.camera_x),
    Number(config.entry.value.camera_y),
    Number(config.entry.value.camera_z),
  )

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  })

  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)

  scene.add(new THREE.AmbientLight(0xffffff, 1))

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  loadModel(config.entry.value.model_path)
  animate()
}

function animate() {
  requestAnimationFrame(animate)

  if (controls) controls.update()
  if (renderer && scene && camera) {
    ThreeMeshUI.update()
    renderer.render(scene, camera)
  }
}


function loadModel(modelPath) {
  if (!modelPath) return

  const loader = new GLTFLoader()

  console.log(useStaticFile(modelPath))
  loader.load(
    "http://localhost:8080/api/public/uploads/system-settings/models/1765681869280599000-All%20Building.glb",
    gltf => {
      model = gltf.scene
      model.updateMatrixWorld(true)

      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())

      model.position.sub(center)
      scene.add(model)
      console.log('Scene objects:', scene.children)

      controls.target.set(0, 0, 0)
      controls.update()

    },
    undefined,
    err => {
      console.error('GLTF LOAD FAILED:', err)
    },
  )
}
</script>

<template>
  <div
    ref="wrapperRef"
    class="three-wrapper rounded-lg"
  >
    <canvas
      ref="canvasRef"
      class="rounded-lg"
    />
  </div>
</template>

<style scoped>
.three-wrapper {
  width: 100%;
  height: 100%;
  min-height: 100px;
  position: relative;
  border-radius: 10px;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
