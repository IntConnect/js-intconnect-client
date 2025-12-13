<script setup>
import * as THREE from 'three'
import { onMounted, ref, nextTick } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as ThreeMeshUI from 'three-mesh-ui'
import buildingModel from '@/assets/models/building.glb'

const wrapperRef = ref(null)
const canvasRef = ref(null)
let model = null
onMounted(async () => {
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 100))

  const scene = new THREE.Scene()

  scene.background = new THREE.Color(0xffffff)

  const width = wrapperRef.value.clientWidth
  const height = wrapperRef.value.clientHeight

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)

  camera.position.set(181.814, 70.837, -40.251)

  const renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  })

  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)

  scene.add(new THREE.AmbientLight(0xffffff, 1))

  const controls = new OrbitControls(camera, renderer.domElement)

  controls.enableDamping = true
  controls.target.set(0, 0.5, 0)
  controls.update()

  const labels = []

  // ----------------------------------------
  // FUNGSI HELPER (definisikan dulu sebelum dipakai)
  // ----------------------------------------
  const createSmallLabel = (title = "Parameter", value = "Value") => {
    const panel = new ThreeMeshUI.Block({
      width: 0.6,
      height: 0.3,
      padding: 0.02,
      borderRadius: 0.03,
      justifyContent: 'center',
      alignContent: 'center',
      fontSize: 0.045,
      backgroundColor: new THREE.Color(0x222222),
      backgroundOpacity: 0.85,
      fontFamily: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json',
      fontTexture: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png',
    })

    const titleText = new ThreeMeshUI.Text({ content: title })
    const valueText = new ThreeMeshUI.Text({ content: value })

    panel.add(titleText)
    panel.add(valueText)

    scene.add(panel) // Tambahkan ke scene

    return panel
  }

  // ----------------------------------------
  // LOAD MODEL
  // ----------------------------------------
  const loader = new GLTFLoader()

  loader.load(buildingModel, gltf => {
    model = gltf.scene
    model.updateMatrixWorld(true)

    // center model
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())

    model.position.x -= center.x
    model.position.y -= center.y
    model.position.z -= center.z
    model.position.x -= 0.3

    scene.add(model)

    controls.target.set(0, 0, 0)
    controls.update()

    // Buat label dengan posisi bebas (x, y, z)
    const label1 = createSmallLabel("Temp", "24°C")

    label1.position.set(0, 0.5, 0) // posisi bebas
    labels.push(label1)

    const label2 = createSmallLabel("Pressure", "1.5 bar")

    label2.position.set(0.5, 0.5, 0.5) // posisi bebas
    labels.push(label2)

    const label3 = createSmallLabel("Status", "OK")

    label3.position.set(-0.5, 0.5, -0.5) // posisi bebas
    labels.push(label3)
  })

  // ----------------------------------------
  // ANIMATION LOOP
  // ----------------------------------------
  const animate = () => {
    requestAnimationFrame(animate)

    controls.update()

    // Update posisi label mengikuti object
    labels.forEach(label => {
      if (label) {
        // Label menghadap kamera
        label.lookAt(camera.position)
        label.rotation.x = 0
        label.rotation.z = 0
      }
    })

    ThreeMeshUI.update()
    renderer.render(scene, camera)
  }

  animate()

  // ----------------------------------------
  // RESIZE HANDLER
  // ----------------------------------------
  window.addEventListener('resize', () => {
    const w = wrapperRef.value.clientWidth
    const h = wrapperRef.value.clientHeight

    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  })
})
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
