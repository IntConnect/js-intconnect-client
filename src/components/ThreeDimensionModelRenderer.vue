<template>
  <div v-if="containerRef || true" ref="containerRef" class="model-viewer-container" :style="{ width: '100%', height: containerHeight }">
    <div v-if="isLoading" class="loading-overlay">
      <VProgressCircular indeterminate color="primary" size="64" />
      <p class="mt-4">Loading 3D Model...</p>
    </div>
  </div>
</template>

<script setup>
import * as THREE from 'three'
import * as ThreeMeshUI from "three-mesh-ui"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useTheme } from 'vuetify'

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
  clickable: {
    type: Boolean,
    default: false,
  },
  markerName: {
    type: String,
    default: '',
  },
  markerValue: {
    type: String,
    default: '',
  },
  markerPosition: {
    type: Object,
    default: () => ({ x: 0, y: 0, z: 0 }),
  },
  markerRotation: {
    type: Object,
    default: () => ({ x: 0, y: 0, z: 0 }),
  },
  showMarker: {
    type: Boolean,
    default: false,
  },
  parameters: {
    type: Array,
    default: () => [],
  },
  registers: {
    type: Array,
    default: () => [],
  },
  isRegisterMarker: {
    type: Boolean,
    default: false,
  }
})

const emit = defineEmits(['camera-update', 'position-click', 'marker-created', 'register-click'])

const containerRef = ref(null)
const isLoading = ref(false)
const isInitialized = ref(false)
const isMounted = ref(false)
const isDestroying = ref(false)
const { global } = useTheme()

let renderer = null
let scene = null
let camera = null
let controls = null
let model = null
let animationFrameId = null
let parameterMarker = null
let clickHandler = null
let registerMarkers = []

// Raycaster untuk deteksi klik
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// ==========================================
// Helper: Remove marker from scene
// ==========================================
const removeMarker = (marker) => {
  if (!marker || !scene) return

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

  if (marker.clear) marker.clear()
  if (marker.parent) {
    marker.parent.remove(marker)
  }
  scene.remove(marker)
}

// ==========================================
// Create marker/label using ThreeMeshUI
// ==========================================
// ==========================================
// Create marker/label using ThreeMeshUI
// ==========================================
const createMarker = (parameterName, parameterValue, position, isRegister = false, registerData = null) => {
  if (!scene) return null

  const container = new THREE.Group()
  container.position.copy(position)

  if (isRegister) {
    // ========== REGISTER MARKER - FUTURISTIC & CLICKABLE ==========
    
    // Main panel dengan gradient effect
    const mainPanel = new ThreeMeshUI.Block({
      width: 3.5,
      height: 1.8,
      padding: 0.15,
      borderRadius: 0.15,
      justifyContent: 'center',
      alignContent: 'center',
      backgroundColor: new THREE.Color(0x0a1929),
      backgroundOpacity: 0.95,
      fontFamily: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json',
      fontTexture: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png',
    })

    // Header dengan icon indicator
    const headerContainer = new ThreeMeshUI.Block({
      width: 3.2,
      height: 0.5,
      margin: 0.05,
      padding: 0.08,
      borderRadius: 0.08,
      justifyContent: 'center',
      alignContent: 'center',
      backgroundColor: new THREE.Color(0x1976d2),
      backgroundOpacity: 0.8,
    })

    const headerText = new ThreeMeshUI.Text({
      content: '● ' + parameterName.toUpperCase(),
      fontSize: 0.18,
      fontColor: new THREE.Color(0xffffff),
    })
    headerContainer.add(headerText)

    // Value display dengan highlight
    const valueContainer = new ThreeMeshUI.Block({
      width: 3.2,
      height: 0.8,
      margin: 0.05,
      padding: 0.1,
      borderRadius: 0.08,
      justifyContent: 'center',
      alignContent: 'center',
      backgroundColor: new THREE.Color(0x132f4c),
      backgroundOpacity: 0.6,
    })

    const valueText = new ThreeMeshUI.Text({
      content: String(parameterValue),
      fontSize: 0.35,
      fontColor: new THREE.Color(0x4fc3f7),
    })
    valueContainer.add(valueText)

    // Click hint
    const hintText = new ThreeMeshUI.Text({
      content: 'Click to interact',
      fontSize: 0.12,
      fontColor: new THREE.Color(0x64b5f6),
    })

    mainPanel.add(headerContainer, valueContainer, hintText)
    container.add(mainPanel)

    // Animated glow rings
    const glowRings = []
    for (let i = 0; i < 2; i++) {
      const ringGeometry = new THREE.RingGeometry(1.2 + i * 0.3, 1.3 + i * 0.3, 32)
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x2196f3,
        transparent: true,
        opacity: i === 0 ? 0.4 : 0.3,
        side: THREE.DoubleSide,
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.position.z = -0.1
      container.add(ring)
      glowRings.push(ring)
    }

    // Particle system
    const particleCount = 50
    const particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const radius = 1.5 + Math.random() * 0.5
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = Math.sin(angle) * radius
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x64b5f6,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    })
    
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    particles.position.z = -0.05
    container.add(particles)

    // Corner accents
    const accentGeometry = new THREE.PlaneGeometry(0.3, 0.3)
    const accentMaterial = new THREE.MeshBasicMaterial({
      color: 0x2196f3,
      transparent: true,
      opacity: 0.5,
    })
    
    const corners = [
      { x: -1.65, y: 0.85 },
      { x: 1.65, y: 0.85 },
      { x: -1.65, y: -0.85 },
      { x: 1.65, y: -0.85 },
    ]
    
    corners.forEach(corner => {
      const accent = new THREE.Mesh(accentGeometry, accentMaterial.clone())
      accent.position.set(corner.x, corner.y, -0.08)
      container.add(accent)
    })

    // Store references for animation
    container.userData.isRegisterMarker = true
    container.userData.registerData = registerData
    container.userData.glowRings = glowRings
    container.userData.particles = particles
    container.userData.valueText = valueText
    container.userData.animPhase = Math.random() * Math.PI * 2

  } else {
    // ========== PARAMETER MARKER - CLEAN & MINIMAL ==========
    
    const mainPanel = new ThreeMeshUI.Block({
      width: 2.8,
      height: 1.2,
      padding: 0.12,
      borderRadius: 0.1,
      justifyContent: 'center',
      alignContent: 'center',
      backgroundColor: new THREE.Color(0x263238),
      backgroundOpacity: 0.85,
      fontFamily: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json',
      fontTexture: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png',
    })

    // Name label
    const nameText = new ThreeMeshUI.Text({
      content: parameterName,
      fontSize: 0.16,
      fontColor: new THREE.Color(0xb0bec5),
    })

    // Value dengan separator
    const separatorText = new ThreeMeshUI.Text({
      content: '—',
      fontSize: 0.12,
      fontColor: new THREE.Color(0x546e7a),
    })

    const valueText = new ThreeMeshUI.Text({
      content: String(parameterValue),
      fontSize: 0.28,
      fontColor: new THREE.Color(0xffffff),
    })

    mainPanel.add(nameText, separatorText, valueText)
    container.add(mainPanel)

    // Subtle border line
    const borderGeometry = new THREE.RingGeometry(1.5, 1.52, 32)
    const borderMaterial = new THREE.MeshBasicMaterial({
      color: 0x455a64,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    })
    const border = new THREE.Mesh(borderGeometry, borderMaterial)
    border.position.z = -0.05
    container.add(border)

    // Minimal dot indicator
    const dotGeometry = new THREE.CircleGeometry(0.08, 16)
    const dotMaterial = new THREE.MeshBasicMaterial({
      color: 0x78909c,
      transparent: true,
      opacity: 0.5,
    })
    const dot = new THREE.Mesh(dotGeometry, dotMaterial)
    dot.position.set(-1.2, 0.5, -0.03)
    container.add(dot)
  }
  
  scene.add(container)
  return container
}

// ==========================================
// Create markers untuk registers
// ==========================================
const createRegisterMarkers = () => {
  if (!scene || !props.registers || props.registers.length === 0) return
  
  // Clear existing register markers
  registerMarkers.forEach(marker => {
    removeMarker(marker)
  })
  registerMarkers = []
  
  // Create new markers
  props.registers.forEach(register => {
    const pos = new THREE.Vector3(
      register.position_x || 0,
      register.position_y || 0,
      register.position_z || 0
    )
    
    const marker = createMarker(
      register.name || 'Register',
      register.value || 0,
      pos,
      true, // isRegister
      register // registerData
    )
    
    if (marker) {
      registerMarkers.push(marker)
    }
  })
}

// ==========================================
// Handle click pada canvas untuk register markers
// ==========================================
const handleCanvasClick = (event) => {
  if (!renderer || !camera || !scene) return
  
  const rect = renderer.domElement.getBoundingClientRect()
  
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  
  raycaster.setFromCamera(mouse, camera)
  
  const intersects = raycaster.intersectObjects(scene.children, true)
  
  if (intersects.length > 0) {
    for (const intersect of intersects) {
      let obj = intersect.object
      
      // Cari parent yang merupakan marker
      while (obj && obj !== scene) {
        if (obj.userData && obj.userData.isRegisterMarker && obj.userData.registerData) {
          // EPIC CLICK EFFECT
          
          // 1. Ripple effect
          if (obj.userData.glowRings) {
            obj.userData.glowRings.forEach((ring, i) => {
              const targetScale = 1.5
              const duration = 600
              const startTime = Date.now()
              const startScale = ring.scale.x
              const startOpacity = ring.material.opacity
              
              const animateRipple = () => {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / duration, 1)
                const easeOut = 1 - Math.pow(1 - progress, 3)
                
                const scale = startScale + (targetScale - startScale) * easeOut
                ring.scale.set(scale, scale, 1)
                ring.material.opacity = startOpacity * (1 - progress)
                
                if (progress < 1) {
                  requestAnimationFrame(animateRipple)
                } else {
                  ring.scale.set(1, 1, 1)
                  ring.material.opacity = startOpacity
                }
              }
              
              setTimeout(() => animateRipple(), i * 100)
            })
          }
          
          // 2. Flash effect on particles
          if (obj.userData.particles) {
            const originalSize = obj.userData.particles.material.size
            obj.userData.particles.material.size = originalSize * 3
            obj.userData.particles.material.opacity = 1
            
            setTimeout(() => {
              obj.userData.particles.material.size = originalSize
              obj.userData.particles.material.opacity = 0.4
            }, 200)
          }
          
          // 3. Emit event
          emit('register-click', obj.userData.registerData)
          return
        }
        obj = obj.parent
      }
    }
  }
}

// ==========================================
// Handle hover effect untuk register markers
// ==========================================
const handleCanvasMouseMove = (event) => {
  if (!renderer || !camera || !scene) return
  
  const rect = renderer.domElement.getBoundingClientRect()
  
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  
  raycaster.setFromCamera(mouse, camera)
  
  const intersects = raycaster.intersectObjects(scene.children, true)
  
  let hovering = false
  
  if (intersects.length > 0) {
    for (const intersect of intersects) {
      let obj = intersect.object
      
      while (obj && obj !== scene) {
        if (obj.userData && obj.userData.isRegisterMarker) {
          hovering = true
          renderer.domElement.style.cursor = 'pointer'
          
          // Enhanced hover effect
          if (!obj.userData.isHovered) {
            obj.userData.isHovered = true
            
            // Boost glow rings
            if (obj.userData.glowRings) {
              obj.userData.glowRings.forEach(ring => {
                ring.material.opacity = Math.min(ring.material.opacity * 1.5, 0.8)
              })
            }
            
            // Boost particles
            if (obj.userData.particles) {
              obj.userData.particles.material.size *= 1.5
              obj.userData.particles.material.opacity = 0.7
            }
          }
          
          return
        }
        obj = obj.parent
      }
    }
  }
  
  if (!hovering) {
    renderer.domElement.style.cursor = 'default'
    
    // Remove highlight dari semua markers
    registerMarkers.forEach(marker => {
      if (marker.userData.isHovered) {
        marker.userData.isHovered = false
        
        // Reset glow rings
        if (marker.userData.glowRings) {
          marker.userData.glowRings.forEach((ring, i) => {
            ring.material.opacity = i === 0 ? 0.4 : 0.3
          })
        }
        
        // Reset particles
        if (marker.userData.particles) {
          marker.userData.particles.material.size = 0.05
          marker.userData.particles.material.opacity = 0.4
        }
      }
    })
  }
}

// ==========================================
// Update marker position
// ==========================================
const updateMarkerPosition = () => {
  if (parameterMarker && props.markerPosition) {
    parameterMarker.position.set(
      props.markerPosition.x,
      props.markerPosition.y,
      props.markerPosition.z
    )
  }
}

// ==========================================
// Update marker rotation
// ==========================================
const updateMarkerRotation = () => {
  if (parameterMarker && props.markerRotation) {
    parameterMarker.rotation.set(
      THREE.MathUtils.degToRad(props.markerRotation.x),
      THREE.MathUtils.degToRad(props.markerRotation.y),
      THREE.MathUtils.degToRad(props.markerRotation.z)
    )
  }
}

// ==========================================
// Enable/Disable clickable mode
// ==========================================
const setClickable = (enabled) => {
  if (!renderer) return

  if (clickHandler) {
    renderer.domElement.removeEventListener('click', clickHandler)
    clickHandler = null
  }

  if (enabled) {
    const raycasterLocal = new THREE.Raycaster()
    const mouseLocal = new THREE.Vector2()

    clickHandler = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()

      mouseLocal.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseLocal.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycasterLocal.setFromCamera(mouseLocal, camera)

      const intersects = raycasterLocal.intersectObjects(scene.children, true)

      if (intersects.length > 0) {
        const hit = intersects[0]
        const point = hit.point.clone()

        const normal = hit.face.normal.clone()
        normal.transformDirection(hit.object.matrixWorld)

        const rotation = new THREE.Euler()
        rotation.setFromVector3(normal)

        emit('position-click', {
          position: {
            x: point.x,
            y: point.y,
            z: point.z,
          },
          rotation: {
            x: rotation.x,
            y: rotation.y,
            z: rotation.z,
          },
        })

        if (props.markerName && props.markerValue) {
          if (parameterMarker) {
            removeMarker(parameterMarker)
            parameterMarker = null
          }

          parameterMarker = createMarker(props.markerName, props.markerValue, point, props.isRegisterMarker)
          emit('marker-created')
        }
      }
    }

    renderer.domElement.addEventListener('click', clickHandler)
  }
}

const initViewer = async () => {
  if (isDestroying.value || isLoading.value || !isMounted.value) {
    console.warn('Component not ready for initialization')
    return
  }

  if (!containerRef.value || !props.modelPath) {
    console.warn('Container or modelPath not ready')
    return
  }

  isLoading.value = true
  
  await nextTick()

  cleanupViewer()

  if (!containerRef.value) {
    console.warn('Container removed during cleanup')
    isLoading.value = false
    return
  }

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  if (width === 0 || height === 0) {
    console.warn('Container has no dimensions yet')
    isLoading.value = false
    return
  }

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    
    if (containerRef.value) {
      containerRef.value.appendChild(renderer.domElement)
    } else {
      renderer.dispose()
      renderer = null
      isLoading.value = false
      return
    }

    scene = new THREE.Scene()
    
    const colorMode = global.name.value
    let modelBackgroundColor = '#343a52'
    if(colorMode == 'light'){
      modelBackgroundColor = '#f0f2f5'
    }
    scene.background = new THREE.Color(modelBackgroundColor)

    const aspectRatio = width / height
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000)
    
    camera.position.set(
      props.cameraPosition.x,
      props.cameraPosition.y,
      props.cameraPosition.z
    )
    camera.updateProjectionMatrix()

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.enablePan = true
    controls.enableRotate = true

    if (props.editable) {
      controls.addEventListener('end', () => {
        emit('camera-update', {
          x: Number(camera.position.x.toFixed(4)),
          y: Number(camera.position.y.toFixed(4)),
          z: Number(camera.position.z.toFixed(4)),
        })
      })
    }

    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1)
    scene.add(hemisphereLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(5, 10, 7.5)
    scene.add(directionalLight)

    const loader = new GLTFLoader()
    const modelUrl = props.modelPath.startsWith('blob:') || props.modelPath.startsWith('http')
      ? props.modelPath
      : useStaticFile(props.modelPath)

    console.log('Loading model from:', modelUrl)

    loader.load(
      modelUrl,
      (gltf) => {
        if (isDestroying.value || !isMounted.value || !containerRef.value || !scene || !camera || !renderer || !controls) {
          console.warn('Component unmounted during model load - aborting')
          if (!isDestroying.value) {
            isLoading.value = false
          }
          return
        }

        try {
          model = gltf.scene
          model.updateMatrixWorld(true)

          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())

          model.position.x -= center.x
          model.position.y -= center.y
          model.position.z -= center.z

          if (!scene || isDestroying.value) {
            console.warn('Scene destroyed before model add')
            if (!isDestroying.value) {
              isLoading.value = false
            }
            return
          }
          
          scene.add(model)

          const isDefaultCamera = 
            (props.cameraPosition.x === 0 && props.cameraPosition.y === 0 && props.cameraPosition.z === 5) ||
            (props.cameraPosition.x === 0 && props.cameraPosition.y === 0 && props.cameraPosition.z === 0)

          if (isDefaultCamera && props.editable && camera && controls) {
            const maxDim = Math.max(size.x, size.y, size.z)
            const fov = camera.fov * (Math.PI / 180)
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
            cameraZ *= 1.5

            camera.position.set(cameraZ * 0.7, cameraZ * 0.5, cameraZ)
            camera.lookAt(0, 0, 0)
            controls.target.set(0, 0, 0)
            controls.update()

            emit('camera-update', {
              x: Number(camera.position.x.toFixed(4)),
              y: Number(camera.position.y.toFixed(4)),
              z: Number(camera.position.z.toFixed(4)),
            })
          } else if (camera && controls) {
            camera.lookAt(0, 0, 0)
            controls.target.set(0, 0, 0)
            controls.update()
          }

          console.log(props.showMarker, props.markerName, props.markerValue)
          console.log(scene)
          if (scene && props.showMarker && props.markerName && props.markerValue) {
            try {
              const markerPos = new THREE.Vector3(
                props.markerPosition.x,
                props.markerPosition.y,
                props.markerPosition.z
              )
              parameterMarker = createMarker(props.markerName, props.markerValue, markerPos, props.isRegisterMarker)
              if (parameterMarker) {
                updateMarkerRotation()
              }
            } catch (markerError) {
              console.warn('Failed to create marker:', markerError)
            }
          }

          if (props.clickable && renderer && renderer.domElement) {
            setClickable(true)
          }

          // Create parameter markers
          if(props.parameters && props.parameters.length > 0) {
            for (const element of props.parameters) {
              const pos = new THREE.Vector3(element.position_x, element.position_y, element.position_z)
              createMarker(element.name, 0, pos, false)
            }
            updateMarkerPosition()
          }
          
          // Create register markers
          if (props.registers && props.registers.length > 0) {
            createRegisterMarkers()
          }

          isLoading.value = false
          isInitialized.value = true
          console.log('Model loaded successfully')

          if (!isDestroying.value && renderer && scene && camera) {
            animate()
          }
        } catch (loadError) {
          console.error('Error processing loaded model:', loadError)
          if (!isDestroying.value) {
            isLoading.value = false
          }
        }
      },
      (progress) => {
        // Progress handler
      },
      (error) => {
        console.error('Error loading 3D model:', error)
        if (isLoading.value) {
          isLoading.value = false
        }
      }
    )
  } catch (error) {
    console.error('Error initializing viewer:', error)
    isLoading.value = false
    cleanupViewer()
  }
}

const animate = () => {
  if (!renderer || !scene || !camera) return
  
  animationFrameId = requestAnimationFrame(animate)
  
  if (controls) {
    controls.update()
  }

  const time = Date.now() * 0.001

  // Advanced animations untuk register markers
  registerMarkers.forEach((marker, index) => {
    if (marker.userData.isRegisterMarker) {
      // Animate glow rings
      if (marker.userData.glowRings) {
        marker.userData.animPhase += 0.03
        
        const ring1 = marker.userData.glowRings[0]
        const ring2 = marker.userData.glowRings[1]
        
        // Pulsating effect
        const pulse1 = Math.sin(marker.userData.animPhase) * 0.3 + 0.5
        const pulse2 = Math.sin(marker.userData.animPhase + Math.PI) * 0.3 + 0.4
        
        ring1.material.opacity = pulse1
        ring2.material.opacity = pulse2
        
        // Rotating rings
        ring1.rotation.z += 0.005
        ring2.rotation.z -= 0.003
        
        // Scale pulse
        const scale = 1 + Math.sin(marker.userData.animPhase * 2) * 0.05
        ring1.scale.set(scale, scale, 1)
        ring2.scale.set(scale * 0.95, scale * 0.95, 1)
      }
      
      // Animate particles
      if (marker.userData.particles) {
        const positions = marker.userData.particles.geometry.attributes.position.array
        
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += Math.sin(time + i) * 0.002
          
          // Reset particle if out of bounds
          if (positions[i + 1] > 1) positions[i + 1] = -1
          if (positions[i + 1] < -1) positions[i + 1] = 1
        }
        
        marker.userData.particles.geometry.attributes.position.needsUpdate = true
        marker.userData.particles.rotation.z += 0.001
      }
      
      // Value text glow effect (hovered state)
      if (marker.userData.isHovered && marker.userData.valueText) {
        const glowIntensity = Math.sin(time * 5) * 0.3 + 0.7
        // Color cycling effect saat hover
        const hue = (time * 0.5) % 1
        const color = new THREE.Color().setHSL(hue, 0.8, 0.6)
        // marker.userData.valueText.set({ fontColor: color }) // Optional: color cycling
      }
    }
  })

  if (parameterMarker && parameterMarker.parent) {
    const hasCustomRotation = (
      props.markerRotation.x !== 0 || 
      props.markerRotation.y !== 0 || 
      props.markerRotation.z !== 0
    )

    if (!hasCustomRotation) {
      parameterMarker.quaternion.copy(camera.quaternion)
    } else {
      updateMarkerRotation()
    }
  }
  
  // Update semua markers untuk menghadap kamera (billboard effect)
  registerMarkers.forEach(marker => {
    marker.quaternion.copy(camera.quaternion)
  })

  try {
    ThreeMeshUI.update()
  } catch (e) {
    console.warn('ThreeMeshUI update warning:', e.message)
  }
  
  renderer.render(scene, camera)
}

const cleanupViewer = (isComponentDestroying = false) => {
  if (isComponentDestroying) {
    isDestroying.value = true
  }
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  if (clickHandler && renderer && renderer.domElement) {
    try {
      renderer.domElement.removeEventListener('click', clickHandler)
    } catch (e) {
      console.warn('Error removing click handler:', e)
    }
    clickHandler = null
  }

  // Clean register markers
  registerMarkers.forEach(marker => {
    removeMarker(marker)
  })
  registerMarkers = []

  if (parameterMarker) {
    removeMarker(parameterMarker)
    parameterMarker = null
  }

  if (controls) {
    try {
      controls.removeEventListener('end', () => {})
      controls.dispose()
    } catch (e) {
      console.warn('Error disposing controls:', e)
    }
    controls = null
  }

  if (renderer && renderer.domElement) {
    const canvas = renderer.domElement
    try {
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas)
      }
      renderer.dispose()
    } catch (e) {
      console.warn('Error disposing renderer:', e)
    }
    renderer = null
  }

  if (containerRef.value && isComponentDestroying) {
    try {
      while (containerRef.value.firstChild) {
        containerRef.value.removeChild(containerRef.value.firstChild)
      }
    } catch (e) {
      console.warn('Error clearing container:', e)
    }
  }

  scene = null
  camera = null
  model = null
  isInitialized.value = false
  
  if (isComponentDestroying) {
    isDestroying.value = false
  }
}

const handleResize = () => {
  if (!containerRef.value || !camera || !renderer) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

let modelPathTimer = null
watch(() => props.modelPath, (newPath, oldPath) => {
  console.log('ModelPath changed:', oldPath, '->', newPath)
  
  if (modelPathTimer) {
    clearTimeout(modelPathTimer)
  }
  
  if (oldPath && oldPath !== newPath) {
    console.log('Cleaning up for model path change')
    cleanupViewer(false)
  }
  
  if (newPath && containerRef.value && isMounted.value && !isDestroying.value) {
    modelPathTimer = setTimeout(() => {
      if (isMounted.value && !isDestroying.value) {
        initViewer()
      }
    }, 100)
  }
}, { immediate: false })

watch(() => props.cameraPosition, (newPos) => {
  if (camera && !props.editable) {
    camera.position.set(newPos.x, newPos.y, newPos.z)
    camera.updateProjectionMatrix()
    if (controls) {
      controls.update()
    }
  }
}, { deep: true })

watch(() => props.clickable, (enabled) => {
  if (isInitialized.value) {
    setClickable(enabled)
  }
})

watch(() => props.markerPosition, () => {
  if (isInitialized.value) {
    updateMarkerPosition()
  }
}, { deep: true })

watch(() => props.markerRotation, () => {
  if (isInitialized.value) {
    updateMarkerRotation()
  }
}, { deep: true })

watch(() => props.showMarker, (show) => {
  if (!isInitialized.value) return
  
  if (show && props.markerName && props.markerValue && !parameterMarker) {
    const markerPos = new THREE.Vector3(
      props.markerPosition.x,
      props.markerPosition.y,
      props.markerPosition.z
    )
    parameterMarker = createMarker(props.markerName, props.markerValue, markerPos, false)
    updateMarkerRotation()
  } else if (!show && parameterMarker) {
    removeMarker(parameterMarker)
    parameterMarker = null
  }
})

watch(() => props.registers, () => {
  if (isInitialized.value && props.registers) {
    createRegisterMarkers()
  }
}, { deep: true })

onMounted(async () => {
  console.log('Component mounted, modelPath:', props.modelPath)
  
  await nextTick()
  
  isMounted.value = true
  
  window.addEventListener('resize', handleResize)
  
  if (props.modelPath && containerRef.value) {
    setTimeout(() => {
      if (containerRef.value && isMounted.value && !isDestroying.value) {
        initViewer()
      }
    }, 150)
  }
})

onBeforeUnmount(() => {
  console.log('Component before unmount - cleaning up')
  
  isMounted.value = false
  
  if (modelPathTimer) {
    clearTimeout(modelPathTimer)
    modelPathTimer = null
  }
  
  // Remove canvas event listeners
  if (renderer && renderer.domElement) {
    renderer.domElement.removeEventListener('click', handleCanvasClick)
    renderer.domElement.removeEventListener('mousemove', handleCanvasMouseMove)
    renderer.domElement.style.cursor = 'default'
  }
  
  cleanupViewer(true)
})

onUnmounted(() => {
  console.log('Component unmounted')
  window.removeEventListener('resize', handleResize)
  isMounted.value = false
})

// Setup click handler for register markers after mount
watch(() => isInitialized.value, (initialized) => {
  if (initialized && renderer && renderer.domElement) {
    renderer.domElement.addEventListener('click', handleCanvasClick)
    renderer.domElement.addEventListener('mousemove', handleCanvasMouseMove)
  }
})

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
  },
  setClickable,
  removeMarker: () => {
    if (parameterMarker) {
      removeMarker(parameterMarker)
      parameterMarker = null
    }
  },
  createMarkerAt: (name, value, position) => {
    if (!isInitialized.value) return null
    
    if (parameterMarker) {
      removeMarker(parameterMarker)
    }
    const pos = new THREE.Vector3(position.x, position.y, position.z)
    parameterMarker = createMarker(name, value, pos, false)
    return parameterMarker
  },
})
</script>

<style scoped>
.model-viewer-container {
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(245, 245, 245, 0.9);
  z-index: 10;
}

.loading-overlay p {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}
</style>
