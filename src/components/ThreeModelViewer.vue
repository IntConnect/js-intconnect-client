<script setup>
import { useStaticFile } from '@/composables/useStaticFile'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelPath: {
    type: String,
    required: true,
  },
  cameraPosition: {
    type: Object,
    default: () => ({ x: 3, y: 2, z: 5 }),
  },
  height: {
    type: [String, Number],
    default: 550,
  },
})

const containerRef = ref(null)

let renderer
let scene
let camera
let controls
let model
let animationId

function init() {
  if (!containerRef.value || !props.modelPath) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.outputEncoding = THREE.sRGBEncoding
  containerRef.value.appendChild(renderer.domElement)

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)

  const pmrem = new THREE.PMREMGenerator(renderer)

  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  // Camera
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(
    props.cameraPosition.x,
    props.cameraPosition.y,
    props.cameraPosition.z,
  )

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.target.set(0, 0, 0)
  controls.update()

  // Light
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1))

  loadModel()
  animate()
}

function loadModel() {
  const loader = new GLTFLoader()

  loader.load(useStaticFile( props.modelPath), gltf => {
    model = gltf.scene

    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())

    model.position.sub(center)
    scene.add(model)
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)
  controls?.update()
  renderer?.render(scene, camera)
}

function dispose() {
  cancelAnimationFrame(animationId)

  controls?.dispose()
  renderer?.dispose()

  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }

  renderer = null
  scene = null
  camera = null
  controls = null
  model = null
}

onMounted(async () => {
  await nextTick()
  init()
})

onBeforeUnmount(() => {
  dispose()
})

watch(() => props.modelPath, () => {
  dispose()
  nextTick(init)
})
</script>

<template>
  <div
    ref="containerRef"
    class="three-viewer"
    :style="{ height: `${height}px` }"
  />
</template>

<style scoped>
.three-viewer {
      height: 100%;
  width: 100%;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}
</style>
