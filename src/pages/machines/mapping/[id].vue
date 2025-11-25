<script setup>
import * as THREE from 'three'
import { onMounted, ref, nextTick } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as ThreeMeshUI from 'three-mesh-ui'

const wrapperRef = ref(null)
const canvasRef = ref(null)
let model = null
let modelLoaded = false

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
  controls.enablePan = true // Sudah aktif by default
  controls.screenSpacePanning = true // Pan horizontal & vertikal
  controls.panSpeed = 1.0
  controls.minDistance = 0
  controls.maxDistance = Infinity
  controls.minPolarAngle = 0 // Bisa lihat dari atas
  controls.maxPolarAngle = Math.PI // Bisa lihat dari bawah

  const labels = []

  // ----------------------------------------
  // FUNGSI HELPER (definisikan dulu sebelum dipakai)
  // ----------------------------------------
  const createSmallLabel = (title = "Parameter", value = "Value") => {
    const panel = new ThreeMeshUI.Block({
      width: 12,
      height: 6,
      padding: 0.02,
      borderRadius: 0.03,
      justifyContent: 'center',
      alignContent: 'center',
      fontSize: 2,
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

  loader.load('/models/schema-5.glb', gltf => {
    model = gltf.scene
    modelLoaded = true
    model.updateMatrixWorld(true)

    // center model
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())

    model.position.x -= center.x
    model.position.y -= center.y
    model.position.z -= center.z
    model.position.x -= 0.3

    scene.add(model)

   
    // Buat label dengan posisi bebas (x, y, z)
    const label1 = createSmallLabel("Temp", "24°C")

    label1.position.set(0, 0.5, 0) // posisi bebas
    labels.push(label1)

    const label2 = createSmallLabel("Pressure", "1.5 bar")

    label2.position.set(12.832886990793174, 31.203119887815724, -88.82343070400847) // posisi bebas
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
        label.quaternion.copy(camera.quaternion)

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

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  const onClick = event => {
    const rect = renderer.domElement.getBoundingClientRect()

    // Konversi posisi mouse → Normalized Device Coordinates
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    // Cari object yang diklik di dalam scene
    const intersects = raycaster.intersectObjects(scene.children, true)

    if (intersects.length > 0) {
      const obj = intersects[0].object

      // Posisi dunia (global)
      const pos = new THREE.Vector3()

      obj.getWorldPosition(pos)

      console.log("Clicked object:", obj.name || obj.type)

      const point = intersects[0].point

      console.log("Surface Point:", point.x, point.y, point.z)
    }
  }

  renderer.domElement.addEventListener('click', onClick)
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
