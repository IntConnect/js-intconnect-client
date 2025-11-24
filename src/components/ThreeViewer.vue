<script setup>
import * as THREE from 'three'
import { onMounted, ref, nextTick } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const wrapperRef = ref(null)
const canvasRef = ref(null)

onMounted(async () => {
  // 👇 Tunggu DOM selesai render
  await nextTick()

  // 👇 Tambahan: tunggu sebentar agar parent benar-benar punya ukuran
  await new Promise(resolve => setTimeout(resolve, 100))

  const scene = new THREE.Scene()

  scene.background = new THREE.Color(0xffffff)

  // 🍭 Ambil ukuran parent col-7
  const width = wrapperRef.value.clientWidth
  const height = wrapperRef.value.clientHeight

  console.log('Width:', width, 'Height:', height) // 👈 Debug

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)

  camera.position.set(181.814, 70.837, -40.251)

  const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true })

  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)

  const light = new THREE.AmbientLight(0xffffff, 1)

  scene.add(light)

  const loader = new GLTFLoader()

  loader.load('/models/schema-5.glb', gltf => {
    const model = gltf.scene

    // perlu agar matrix world dari model bisa dihitung
    model.updateMatrixWorld(true)

    // hitung bounding box & pusat
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())

    // 1) pindahkan model sehingga pusatnya berada di origin
    model.position.x -= center.x
    model.position.y -= center.y
    model.position.z -= center.z

    // 2) setelah center di origin, geser sedikit ke kiri (nilai negatif)
    const leftShift = 0.3 // coba 0.1, 0.3, 1.0 tergantung ukuran model

    model.position.x += -leftShift

    scene.add(model)

    // update controls target ke titik baru (biasanya origin)
    controls.target.set(0, 0, 0)
    controls.update()
  })

  const controls = new OrbitControls(camera, renderer.domElement)

  controls.enableDamping = true
  controls.target.set(0, 0.5, 0)
  controls.update()

  const animate = () => {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }

  animate()

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
  min-height: 100px; /* 👈 Fallback penting */
  position: relative;
  border-radius: 10px;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
