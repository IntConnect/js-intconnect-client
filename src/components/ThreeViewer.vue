<script setup>
import * as THREE from 'three'
import { onMounted, ref } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const canvasRef = ref(null)

onMounted(() => {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value })
  renderer.setSize(window.innerWidth, window.innerHeight)

  // 🟢 Tambah pencahayaan
  const light = new THREE.AmbientLight(0xffffff, 1)
  scene.add(light)

  // 🟢 Muat model GLB/GLTF
  const loader = new GLTFLoader()
  loader.load('/models/schema-1.glb', (gltf) => {
    scene.add(gltf.scene)
    gltf.scene.position.set(0, 0, 0)
  })

  camera.position.z = 3

  const animate = () => {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  animate()
})
</script>

<template>
  <canvas ref="canvasRef"></canvas>
</template>

<style scoped>
canvas {
  width: 100%;
  height: 100vh;
  display: block;
}
</style>
