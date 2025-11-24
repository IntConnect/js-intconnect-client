<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// ID mesin dari route
const route = useRoute()
const machineId = route.params.id

// Refs
const canvasRef = ref(null)
const markers = ref([]) // marker yg sudah ada dari DB

// THREE essentials
let scene, camera, renderer, raycaster, model, mouse

// --------------------------------------------
//  LOAD EXISTING MARKERS FROM BACKEND
// --------------------------------------------
async function loadSavedMarkers() {
  // GANTI SENDIRI API-NYA
  // const res = await $fetch(`/api/machines/${machineId}/mapping`)
  // markers.value = res.data

  markers.value = [
    // contoh dummy
    { x: 0.2, y: 1.1, z: 0.4, label: "temperature" },
  ]
}

// --------------------------------------------
//  ADD MARKER TO SCENE
// --------------------------------------------
function addMarker({ x, y, z, label }) {
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.02),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }),
  )
  sphere.position.set(x, y, z)
  scene.add(sphere)
}

// --------------------------------------------
//  SAVE MARKER TO BACKEND
// --------------------------------------------
async function saveMarker(position) {
  // buka modal untuk memilih parameter
  const chosen = prompt("Pilih parameter (contoh: temperature, pressure):")
  if (!chosen) return

  const marker = {
    x: position.x,
    y: position.y,
    z: position.z,
    label: chosen,
  }

  addMarker(marker)

  // KAMU ISI API INI NANTI
  // await $fetch(`/api/machines/${machineId}/mapping`, {
  //   method: 'POST',
  //   body: marker
  // })

  console.log("Marker saved:", marker)
}

// --------------------------------------------
//  INIT THREE JS
// --------------------------------------------
onMounted(async () => {
  await loadSavedMarkers()

  // Setup scene
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  )
  camera.position.set(2, 2, 2)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  canvasRef.value.appendChild(renderer.domElement)

  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // LIGHT
  const light = new THREE.AmbientLight(0xffffff, 1)
  scene.add(light)

  // LOAD MODEL
  const loader = new GLTFLoader()
  loader.load('/models/schema-5.glb', (gltf) => {
    model = gltf.scene
    scene.add(model)

    // load markers after model exist
    markers.value.forEach(addMarker)
  })

  // CLICK EVENT
  renderer.domElement.addEventListener('pointerdown', (event) => {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObject(model, true)

    if (intersects.length > 0) {
      const point = intersects[0].point
      saveMarker(point)
    }
  })

  // LOOP
  function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }

  animate()
})
</script>

<template>
  <div ref="canvasRef"></div>
</template>
