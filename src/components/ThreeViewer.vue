<script setup>
import * as THREE from 'three'
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

/* =========================
   PROPS
========================= */
const props = defineProps({
  modelConfiguration: Object,
  facilities: Object,
})

let markerTemplate = null
let markerWorldQuaternion = null
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

/* =========================
   REFS
========================= */
const wrapperRef = ref(null)
const canvasRef = ref(null)

/* =========================
   THREE STATE
========================= */
let scene, camera, renderer, controls, model
let facilityGroup = null
let animationId = null

/* =========================
   WATCHERS
========================= */
watch(
  () => props.modelConfiguration,
  async cfg => {
    if (!cfg?.entry) return
    await nextTick()
    initScene(cfg.entry.value)
  },
  { immediate: true },
)

watch(
  () => props.facilities,
  facilities => {
    if (!facilityGroup || !facilities?.entries) return
    renderFacilities(facilities.entries)
  },
  { deep: true },
)

/* =========================
   INIT SCENE
========================= */
function initScene(config) {
  destroyScene()

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf2f2f2)

  const width = wrapperRef.value.clientWidth
  const height = wrapperRef.value.clientHeight || 400 // 🔴 FIX UTAMA

  console.log('SCENE SIZE:', width, height)

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 5000)
  camera.position.set(0, 50, 120)

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.domElement.addEventListener('click', onCanvasClick)
  renderer.domElement.addEventListener('mousemove', onMouseMove)

  /* LIGHT */
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))

  const dir = new THREE.DirectionalLight(0xffffff, 1)

  dir.position.set(50, 100, 50)
  scene.add(dir)

  /* DEBUG AXIS */

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)

  /* FACILITY GROUP */
  facilityGroup = new THREE.Group()
  scene.add(facilityGroup)

  loadModel(config.model_path)
  animate()
}

/* =========================
   LOAD MODEL
========================= */
function loadModel(path, pinObjectName) {
  if (!path) return

  new GLTFLoader().load(useStaticFile(path), gltf => {
    model = gltf.scene

    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())

    model.position.sub(center)

    /* 🔴 AMBIL MARKER TEMPLATE */
    markerTemplate = model.getObjectByName('Mesh')


    if (markerTemplate) {
      model.updateMatrixWorld(true)

      markerWorldQuaternion = new THREE.Quaternion()
      markerTemplate.getWorldQuaternion(markerWorldQuaternion)

      markerTemplate.visible = false
      markerTemplate.parent.remove(markerTemplate)
    }

    scene.add(model)

    /* AUTO FIT CAMERA */
    const maxDim = Math.max(size.x, size.y, size.z)

    camera.position.set(0, maxDim * 0.8, maxDim * 2)
    controls.update()

    /* render facilities if exist */
    if (props.facilities?.entries) {
      renderFacilities(props.facilities.entries)
    }
  })
}

/* =========================
   FACILITIES
========================= */
function renderFacilities(entries) {
  if (!markerTemplate || !markerWorldQuaternion) return

  clearFacilities()

  entries.forEach(facility => {
    const marker = markerTemplate.clone(true)

    marker.traverse(child => {
      if (child.isMesh) {
        child.material = child.material.clone()
      }
    })

    /* 🔴 APPLY ROTASI ASLI */
    marker.quaternion.copy(markerWorldQuaternion)

    /* POSISI DARI DATABASE */
    marker.position.set(
      facility.position_x,
      facility.position_y,
      facility.position_z,
    )
    marker.userData.link = `/facilities/${facility.id}`

    marker.visible = true
    facilityGroup.add(marker)
  })
}

function clearFacilities() {
  while (facilityGroup.children.length) {
    const obj = facilityGroup.children[0]

    obj.traverse(child => {
      if (child.isMesh) {
        child.geometry?.dispose()
        child.material?.dispose()
      }
    })

    facilityGroup.remove(obj)
  }
}

/* =========================
   LOOP
========================= */
function animate() {
  animationId = requestAnimationFrame(animate)

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(
    facilityGroup.children,
    true,
  )

  document.body.style.cursor = intersects.length
    ? 'pointer'
    : 'default'

  controls?.update()
  renderer?.render(scene, camera)
}

function onCanvasClick(event) {
  const rect = renderer.domElement.getBoundingClientRect()

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(
    facilityGroup.children,
    true,
  )

  if (intersects.length === 0) return

  const clicked = intersects[0].object
  const link = clicked.userData?.link

  if (link) {
    window.location.href = link
  }
}

function onMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect()

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

/* =========================
   CLEANUP
========================= */
function destroyScene() {
  if (animationId) cancelAnimationFrame(animationId)

  if (renderer?.domElement) {
    renderer.domElement.removeEventListener('click', onCanvasClick)
  }

  renderer?.dispose()
}

onBeforeUnmount(destroyScene)
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
