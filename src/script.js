import './style.css'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import gsap from 'gsap'
import * as dat from 'lil-gui'
import { Vector3 } from 'three'

var surface
var sampler1
var sampler2
var grassMesh1
var grassMesh2
var grassMaterial
var _color
var billboard
var projector
var fabric
const selections = []

const _billboard = {
    name: 'Cube005_2',
    camPos: new THREE.Vector3(3.31, 2.48, -1.45),
    targetPos: new THREE.Vector3(3.27, 2.37, -2.43) 
};

selections.push(_billboard)

const _fabric = {
    name: 'fabric_hitbox',
    camPos: new THREE.Vector3(2.05, 1.12, -1.41),
    targetPos: new THREE.Vector3(1.25, 0.97, -1.97) 
};

selections.push(_fabric)


var nextCamPos = new THREE.Vector3(0,0,0)
var nextTargetPos = new THREE.Vector3(0,0,0)
const mouse = new THREE.Vector2()
const start = Date.now()
const count = 5000

const dummy = new THREE.Object3D();
const _position = new THREE.Vector3();
const _normal = new THREE.Vector3();

//const gui = new dat.GUI()
const scene = new THREE.Scene()
const geometry = new THREE.BoxGeometry(100, 100, 100)
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
const mesh = new THREE.Mesh(geometry, material)
const bg_tex = new THREE.TextureLoader().load('/textures/8k_jupiter.jpg')

bg_tex.mapping = THREE.EquirectangularReflectionMapping
scene.background = bg_tex
mesh.position.set(new THREE.Vector3(0, 0, 0))
scene.add(mesh)

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.fov = 84;
const spawnPos = new THREE.Vector3(3.3, 1.27, -0.43)
camera.position.set(...spawnPos)
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


///Raycaster
const raycaster = new THREE.Raycaster()


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

unrealBloomPass.strength = 0.22
unrealBloomPass.radius = 0.829
unrealBloomPass.threshold = 0.681

/*gui.add(unrealBloomPass, 'enabled')
gui.add(unrealBloomPass, 'strength').min(0).max(2).step(0.001)
gui.add(unrealBloomPass, 'radius').min(0).max(2).step(0.001)
gui.add(unrealBloomPass, 'threshold').min(0).max(1).step(0.001)*/


const controls = new OrbitControls(camera, renderer.domElement);
const spawnTarget = new THREE.Vector3(2.78, 1.09, -0.06)
controls.target = spawnTarget
//controls.minDistance = 1
//controls.maxDistance = 1
//controls.autoRotate = true
//controls.autoRotateSpeed = 0.2

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

let btn = document.createElement("button")
btn.innerHTML = "HOME"
btn.className = "home"
document.body.appendChild(btn)
btn.onclick = function (e) {
    e.stopPropagation()
    btn.style.display = "none"
    gsap.to(camera.position, {...spawnPos, duration: 2})
    gsap.to(controls.target,{...new THREE.Vector3(2.78,1.09,-0.06), duration: 2})
    controls.update()
};

document.querySelector('canvas').addEventListener('mousedown', (event) =>
{
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    
    const objectsToTest = [fabric, billboard]
    const intersects = raycaster.intersectObjects(objectsToTest)
    if (intersects.length > 1) {
        //console.log(intersects)
        for(let i = 0; i < selections.length; i++){
            if(selections[i].name === intersects[0].object.name){
                nextCamPos = selections[i].camPos
                nextTargetPos = selections[i].targetPos
                gsap.to(camera.position, {...nextCamPos, duration: 2})
                gsap.to(controls.target, {...nextTargetPos, duration: 2, onComplete: () => {btn.style.display = "block"}})
                controls.update()
                break
            }
        }
    }
    //console.log(intersects)
})

const updateAllMaterials = (floor) => {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial || child instanceof THREE.Mesh && child.material instanceof CustomShaderMaterial) {
            if (floor !== true) child.castShadow = true
            if (floor === true) child.receiveShadow = true
            child.material.envMap = bg_tex
            child.material.envMapIntensity = 1.7
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
    '/models/grass1.glb',
    (glb) => {
        const _grassMesh = glb.scene.getObjectByName('grass1')
        const grassGeo = _grassMesh.geometry.clone()
        const defaultTransform = new THREE.Matrix4().makeRotationY(-Math.PI * 0.5)
        //.multiply( new THREE.Matrix4().makeScale( 7, 7, 7 )
        grassGeo.applyMatrix4(defaultTransform)
        grassGeo.rotateY(Math.random())
        _color = _grassMesh.material.color
        grassMaterial = new CustomShaderMaterial({
            baseMaterial: THREE.MeshStandardMaterial,
            vertexShader: `
            varying vec2 vUv;
            uniform float uTime;
            void main() {
                vUv = uv;
                float time = uTime * 0.2;
                //csm_Normal = normal * vec3(1.0,1.0+time,1.0);
                csm_Position = position * vec3(1.0,1.0+time,1.0);
            }
            `,
            uniforms: {
                uTime: {
                    value: 0.0,
                },
            },
            //flatShading: true,
            color: _color,
        })
        grassMaterial.roughness = 0.4
        
        grassMaterial.needsUpdate = true
        grassMesh1 = new THREE.InstancedMesh(grassGeo, grassMaterial, count)

        gltfLoader.load(
            '/models/grass2.glb',
            (glb) => {
                const _grassMesh = glb.scene.getObjectByName('grass2')
                const grassGeo = _grassMesh.geometry.clone()
                const defaultTransform = new THREE.Matrix4().makeRotationY(-Math.PI * 0.5)
                grassGeo.applyMatrix4(defaultTransform)
                const grassMaterial = _grassMesh.material
                grassMesh2 = new THREE.InstancedMesh(grassGeo, grassMaterial, Math.round(count * 0.25))


                gltfLoader.load(
                    '/models/floor.glb',
                    (glb) => {
                        glb.scene.scale.set(0.2, 0.2, 0.2)
                        scene_group.add(glb.scene)
                        glb.scene.children[0].material.color = _color
                        surface = glb.scene.children[0].clone()
                        surface.geometry = glb.scene.children[0].geometry.clone().toNonIndexed()
                        const defaultTransform = new THREE.Matrix4().makeTranslation(1.5, 0.0, 0.0).multiply(new THREE.Matrix4().makeScale(0.2, 0.2, 0.2));
                        surface.geometry.applyMatrix4(defaultTransform)
                        resample()
                        scene.add(grassMesh1)
                        scene.add(grassMesh2)
                        updateAllMaterials(true)
                    }
                )
            }
        )
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
        billboard = glb.scene
        scene_group.add(billboard)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/projector.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        projector = glb.scene
        scene_group.add(projector)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/clothing_stuff.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        fabric = glb.scene
        const geometry = new THREE.BoxGeometry( 3, 5, 1 );
        const box = new THREE.Mesh( geometry, material );
        box.name = 'fabric_hitbox'
        box.position.set(7.3,5,-9)
        box.rotateY(Math.PI*0.3)
        box.visible = false
        glb.scene.add(box)
        scene_group.add(fabric)
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

gltfLoader.load(
    '/models/pacman.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        scene_group.add(glb.scene)
        updateAllMaterials()
    }
)


function resample() {

    const vertexCount = surface.geometry.getAttribute('position').count;
    //console.info('Sampling ' + count + ' points from a surface with ' + vertexCount + ' vertices...');
    //console.time('.build()');
    sampler1 = new MeshSurfaceSampler(surface)
        //.setWeightAttribute( null )
        .build();
    sampler2 = new MeshSurfaceSampler(surface)
        //.setWeightAttribute( null )
        .build();
    //console.timeEnd('.build()');
    //console.time('.sample()');

    for (let i = 0; i < count; i++) {
        //ages[ i ] = Math.random();
        //scales[ i ] = scaleCurve( ages[ i ] );
        resampleParticle1(i);
        resampleParticle2(i);
    }

    //console.timeEnd('.sample()');
}

function resampleParticle1(i) {
    sampler1.sample(_position, _normal);
    _normal.add(_position);
    dummy.position.copy(_position);
    const randomScale = Math.random() * (1.7 - 0.5) + 0.5;
    dummy.scale.set(randomScale, randomScale, randomScale);
    dummy.lookAt(_normal);
    dummy.updateMatrix();
    grassMesh1.setMatrixAt(i, dummy.matrix);

}

function resampleParticle2(i) {
    sampler2.sample(_position, _normal);
    _normal.add(_position);
    dummy.position.copy(_position);
    const randomScale = Math.random() * (1.0 - 0.25) + 0.25;
    dummy.scale.set(randomScale, randomScale, randomScale);
    dummy.lookAt(_normal);
    dummy.updateMatrix();
    grassMesh2.setMatrixAt(i, dummy.matrix);
}

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
    if(grassMaterial) {
        grassMaterial.uniforms.uTime.value = Math.sin((Date.now()-start)*0.0007)
    } 
    //sconsole.log(Math.sin((Date.now()-start)*0.00025))
    requestAnimationFrame(animate);
    // required if controls.enableDamping or controls.autoRotate are set to true
    controls.update();
    directionalLight.updateMatrixWorld()
    directionalLight.target.updateMatrixWorld()
    effectComposer.render();
    /*console.log('camPos')
    console.log(camera.position)
    console.log('targetPos')
    console.log(controls.target)*/
}

animate()