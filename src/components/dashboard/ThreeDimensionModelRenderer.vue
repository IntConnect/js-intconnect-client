<template>
  <div ref="containerRef" class="model-viewer-container" :style="{ width: '100%', height: containerHeight }" />
</template>

<script setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  modelPath: {
    type: String,
    required: true,
  },
  cameraPosition: {
    type: Object,
    default: () => ({ x: 0, y: 0, z: 5 }),
  },
  editable: {
    type: Boolean,
    default: false,
  },
  containerHeight: {
    type: String,
    default: '400px',
  },
  backgroundColor: {
    type: String,
    default: '#f5f5f5',
  },
})

const emit = defineEmits(['camera-update'])

const containerRef = ref(null)
let renderer = null
let scene = null
let camera = null
let controls = null
let model = null
let animationFrameId = null

const initViewer = () => {
  if (!containerRef.value || !props.modelPath) return

  cleanupViewer()

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  containerRef.value.appendChild(renderer.domElement)

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(props.backgroundColor)

  // Camera - PENTING: Gunakan aspect ratio yang konsisten
  const aspectRatio = width / height
  camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000)
  
  // Set posisi kamera dari props
  camera.position.set(
    props.cameraPosition.x,
    props.cameraPosition.y,
    props.cameraPosition.z
  )
  camera.updateProjectionMatrix()

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enableZoom = true
  controls.enablePan = true
  controls.enableRotate = true

  // Jika editable, emit camera position saat user selesai berinteraksi
  if (props.editable) {
    controls.addEventListener('end', () => {
      emit('camera-update', {
        x: Number(camera.position.x.toFixed(4)),
        y: Number(camera.position.y.toFixed(4)),
        z: Number(camera.position.z.toFixed(4)),
      })
    })
  }

  // Environment
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture

  // Lighting
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1)
  scene.add(hemisphereLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight.position.set(5, 10, 7.5)
  scene.add(directionalLight)

  // Load Model
  const loader = new GLTFLoader()
  const modelUrl = props.modelPath.startsWith('blob:') || props.modelPath.startsWith('http')
    ? props.modelPath
    : useStaticFile(props.modelPath)

  loader.load(
    modelUrl,
    (gltf) => {
      model = gltf.scene
      model.updateMatrixWorld(true)

      // Center model
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      model.position.x -= center.x
      model.position.y -= center.y
      model.position.z -= center.z

      scene.add(model)

      // Hanya auto-fit jika posisi kamera adalah default (0,0,5) atau semua 0
      const isDefaultCamera = 
        (props.cameraPosition.x === 0 && props.cameraPosition.y === 0 && props.cameraPosition.z === 5) ||
        (props.cameraPosition.x === 0 && props.cameraPosition.y === 0 && props.cameraPosition.z === 0)

      if (isDefaultCamera && props.editable) {
        // Auto-fit untuk model baru
        const maxDim = Math.max(size.x, size.y, size.z)
        const fov = camera.fov * (Math.PI / 180)
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
        cameraZ *= 1.5

        camera.position.set(cameraZ * 0.7, cameraZ * 0.5, cameraZ)
        camera.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        controls.update()

        // Emit posisi baru
        emit('camera-update', {
          x: Number(camera.position.x.toFixed(4)),
          y: Number(camera.position.y.toFixed(4)),
          z: Number(camera.position.z.toFixed(4)),
        })
      } else {
        // Gunakan posisi yang disimpan
        camera.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        controls.update()
      }

      animate()
    },
    undefined,
    (error) => {
      console.error('Error loading 3D model:', error)
    }
  )
}

const animate = () => {
  if (!renderer || !scene || !camera) return
  
  animationFrameId = requestAnimationFrame(animate)
  
  if (controls) {
    controls.update()
  }
  
  renderer.render(scene, camera)
}

const cleanupViewer = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  if (controls) {
    controls.removeEventListener('end', () => {})
    controls.dispose()
    controls = null
  }

  if (renderer) {
    renderer.dispose()
    renderer = null
  }

  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }

  scene = null
  camera = null
  model = null
}

const handleResize = () => {
  if (!containerRef.value || !camera || !renderer) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// Watch modelPath changes
watch(() => props.modelPath, () => {
  initViewer()
}, { immediate: false })

// Watch camera position changes (untuk sinkronisasi eksternal)
watch(() => props.cameraPosition, (newPos) => {
  if (camera && !props.editable) {
    camera.position.set(newPos.x, newPos.y, newPos.z)
    camera.updateProjectionMatrix()
    if (controls) {
      controls.update()
    }
  }
}, { deep: true })

onMounted(() => {
  initViewer()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cleanupViewer()
})

// Expose methods jika diperlukan
defineExpose({
  resetCamera: () => {
    if (camera && model) {
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = camera.fov * (Math.PI / 180)
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
      cameraZ *= 1.5

      camera.position.set(cameraZ * 0.7, cameraZ * 0.5, cameraZ)
      camera.lookAt(0, 0, 0)
      controls.target.set(0, 0, 0)
      controls.update()

      if (props.editable) {
        emit('camera-update', {
          x: Number(camera.position.x.toFixed(4)),
          y: Number(camera.position.y.toFixed(4)),
          z: Number(camera.position.z.toFixed(4)),
        })
      }
    }
  }
})
</script>

<style scoped>
.model-viewer-container {
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  position: relative;
}
</style>
