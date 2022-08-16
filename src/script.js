import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import * as dat from 'lil-gui'


const gui = new dat.GUI()

// Scene
const scene = new THREE.Scene()
var bg_tex = new THREE.TextureLoader().load('/textures/8k_jupiter.jpg')
bg_tex.mapping = THREE.EquirectangularReflectionMapping;
scene.background = bg_tex
// Object
const geometry = new THREE.BoxGeometry(100, 100, 100)
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
const mesh = new THREE.Mesh(geometry, material)
mesh.position.set(new THREE.Vector3(0,0,0))
scene.add(mesh)

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.fov = 84;
camera.position.set(3.3,1.27,-0.43)
scene.add(camera)

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas.webgl'),
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.shadowMap.enabled = true


//Post processing
const effectComposer = new EffectComposer(renderer)
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(window.devicePixelRatio)

const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)
const unrealBloomPass = new UnrealBloomPass()
effectComposer.addPass(unrealBloomPass)
const smaaPass = new SMAAPass()
effectComposer.addPass(smaaPass)

unrealBloomPass.strength = 0.28
unrealBloomPass.radius = 0.84
unrealBloomPass.threshold = 0.7

gui.add(unrealBloomPass, 'enabled')
gui.add(unrealBloomPass, 'strength').min(0).max(2).step(0.001)
gui.add(unrealBloomPass, 'radius').min(0).max(2).step(0.001)
gui.add(unrealBloomPass, 'threshold').min(0).max(1).step(0.001)


const controls = new OrbitControls(camera, renderer.domElement);
controls.target = new THREE.Vector3(2.78, 1.09, -0.06)
controls.minDistance = 1
controls.maxDistance = 1
//controls.minPolarAngle = Math.PI*0.4
/*controls.maxPolarAngle = Math.PI * 0.4
controls.target = new THREE.Vector3(1.64, 0, 0)
controls.maxDistance = 7
controls.minDistance = 3*/
//gui.add(mesh.position,'x',-10,10);
//gui.add(mesh.position,'z',-10,10);

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
})

const updateAllMaterials = (floor) => {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            if (floor !== true) child.castShadow = true
            if (floor === true) child.receiveShadow = true
            child.material.envMap = bg_tex
            child.material.envMapIntensity = 1.8
        }
    })
}


const scene_group = new THREE.Group();
scene.add(scene_group)


//Load Models
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

gltfLoader.load(
    '/models/floor.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        scene_group.add(glb.scene)
        updateAllMaterials(true)
    }
)

gltfLoader.load(
    '/models/tree.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        scene_group.add(glb.scene)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/speakers.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        scene.add(glb.scene)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/table.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        scene_group.add(glb.scene)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/billboard.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        scene_group.add(glb.scene)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/projector.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        scene_group.add(glb.scene)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/clothing_stuff.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        scene_group.add(glb.scene)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/cdj.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        scene_group.add(glb.scene)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/elevator.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        scene_group.add(glb.scene)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/door.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        scene_group.add(glb.scene)
        updateAllMaterials()
    }
)



const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 13
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 1
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 10


//directionalLight.shadow.bias = -0.01
directionalLight.shadow.normalBias = 0.02
directionalLight.position.set(1, 7, 0)
directionalLight.target.position.set(-2, 3, 0)
scene.add(directionalLight)

//const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
//scene.add(directionalLightCameraHelper)


function animate() {

    requestAnimationFrame(animate);
    // required if controls.enableDamping or controls.autoRotate are set to true
    controls.update();
    directionalLight.updateMatrixWorld()
    directionalLight.target.updateMatrixWorld()
    effectComposer.render();

}

animate()