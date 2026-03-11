<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'

const containerRef = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let earth: THREE.Mesh
let atmosphere: THREE.Mesh
let pointsGroup: THREE.Group
let raf = 0

const locations = [
  { lat: 1.3521, lon: 103.8198 },
  { lat: -33.8688, lon: 151.2093 },
  { lat: 34.0522, lon: -118.2437 },
  { lat: 51.5074, lon: -0.1278 },
  { lat: 40.7128, lon: -74.006 },
  { lat: 41.8781, lon: -87.6298 },
  { lat: 6.5244, lon: 3.3792 },
  { lat: 37.5665, lon: 126.978 },
  { lat: 48.8566, lon: 2.3522 },
  { lat: -8.4095, lon: 115.1889 },
  { lat: 40.4168, lon: -3.7038 },
  { lat: 37.9838, lon: 23.7275 },
  { lat: 43.6532, lon: -79.3832 },
  { lat: 25.2854, lon: 51.531 },
  { lat: 49.2827, lon: -123.1207 },
]

const init = () => {
  if (!containerRef.value) return

  // Scene setup
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, containerRef.value.clientWidth / containerRef.value.clientHeight, 0.1, 1000)
  camera.position.z = 2.5

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  containerRef.value.appendChild(renderer.domElement)

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.2)
  sunLight.position.set(-2, 1, 5)
  scene.add(sunLight)

  const loader = new THREE.TextureLoader()
  loader.setCrossOrigin('anonymous')

  // Textures
  const earthTexture = loader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg')
  const specularMap = loader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg')
  const normalMap = loader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg')

  // Geometry
  const sphereGeom = new THREE.SphereGeometry(1, 64, 64)
  const earthMat = new THREE.MeshStandardMaterial({
    map: earthTexture,
    specularMap: specularMap,
    normalMap: normalMap,
    metalness: 0.1,
    roughness: 0.7,
  })
  earth = new THREE.Mesh(sphereGeom, earthMat)
  scene.add(earth)

  // Atmosphere (Glow effect using a simple shader-like approach)
  const atmosGeom = new THREE.SphereGeometry(1.03, 64, 64)
  const atmosMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      glowColor: { value: new THREE.Color(0x91d6ff) },
      viewVector: { value: camera.position }
    },
    vertexShader: `
      uniform vec3 viewVector;
      varying float intensity;
      void main() {
        vec3 vNormal = normalize( normalMatrix * normal );
        vec3 vNormel = normalize( normalMatrix * viewVector );
        intensity = pow( 0.7 - dot(vNormal, vNormel), 4.0 );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying float intensity;
      void main() {
        vec3 glow = glowColor * intensity;
        gl_FragColor = vec4( glow, intensity );
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  })
  atmosphere = new THREE.Mesh(atmosGeom, atmosMat)
  scene.add(atmosphere)

  // Markers
  pointsGroup = new THREE.Group()
  const pointGeom = new THREE.SphereGeometry(0.012, 16, 16)
  const pointMat = new THREE.MeshBasicMaterial({ color: 0xffba7e })

  locations.forEach(loc => {
    const lat = (loc.lat * Math.PI) / 180
    const lon = (loc.lon * Math.PI) / 180
    
    // Convert lat/lon to 3D Cartesian coords
    const x = Math.cos(lat) * Math.cos(lon)
    const y = Math.sin(lat)
    const z = Math.cos(lat) * Math.sin(-lon) // Invert lon for correct mapping

    const point = new THREE.Mesh(pointGeom, pointMat)
    point.position.set(x, y, z)
    
    // Add a small pulse/glow to the point
    const pulseGeom = new THREE.SphereGeometry(0.025, 12, 12)
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffba7e, transparent: true, opacity: 0.3 })
    const pulse = new THREE.Mesh(pulseGeom, pulseMat)
    point.add(pulse)
    
    pointsGroup.add(point)
  })
  earth.add(pointsGroup)

  animate()
}

const animate = () => {
  raf = requestAnimationFrame(animate)
  if (earth) {
    earth.rotation.y += 0.0012
  }
  renderer.render(scene, camera)
}

const onResize = () => {
  if (!containerRef.value) return
  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}

onMounted(() => {
  init()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  cancelAnimationFrame(raf)
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<template>
  <section class="page" style="padding-top:.8rem;padding-bottom:4rem;">
    <div class="grid-2">
      <div ref="containerRef" class="glass globe-container"></div>
      <article class="glass cta">
        <h2 class="section-title">Host your event with TicketRemaster</h2>
        <p class="section-subtitle">Launch, sell, and manage verified resale with one organizer dashboard trusted across global venues.</p>
        <button class="list-btn">List your event</button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.globe-container { width: 100%; height: 440px; overflow: hidden; position: relative; }
.cta{padding:1.2rem;display:grid;align-content:center;justify-items:center;gap:.75rem;text-align:center}
.list-btn{width:auto}
@media (max-width:920px){.globe-container{height:320px}}
</style>
