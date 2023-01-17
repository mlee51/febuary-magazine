import './style.css'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { DeviceOrientationControls } from './DeviceOrientationControls.js';
import gsap from 'gsap'
import * as dat from 'lil-gui'

var isMobile = typeof window.orientation !== 'undefined'
var isMobileSafari = isMobile && !window.navigator.userAgent.match(/CriOS/i)
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
var hotspot
var deltaY
var startY
var old_deltaY = 0;
var renderCSS = false
var deviceControls = false
var deviceControlsActive = false
const selections = []
let selectedObjects = []
let rayCasting = false
let deviceOrientationControls
var content = document.getElementById('billBoard')
const canvas = document.querySelector('canvas')

const _billboard = {
    name: 'billboard',
    camPos: new THREE.Vector3(3.31, 2.48, -1.45),
    targetPos: new THREE.Vector3(3.27, 2.37, -2.43),
    camUpZ: -1.744,
    element: content
};

selections.push(_billboard)

const _fabric = {
    name: 'fabric',
    camPos: new THREE.Vector3(2.05, 1.12, -1.41),
    targetPos: new THREE.Vector3(1.25, 0.97, -1.97),
    camUpZ: -0.0524
};

selections.push(_fabric)

const _dj = {
    name: 'dj',
    camPos: new THREE.Vector3(4.5, 0.77, -1.67),
    targetPos: new THREE.Vector3(4.47, 0.1, -1.69),
    camUpZ: 0.0042
};

selections.push(_dj)


var nextCamPos = new THREE.Vector3(0, 0, 0)
var nextTargetPos = new THREE.Vector3(0, 0, 0)
const mouse = new THREE.Vector2()
const start = Date.now()
const count = 5000

const dummy = new THREE.Object3D();
const _position = new THREE.Vector3();
const _normal = new THREE.Vector3();

const gui = new dat.GUI()
const scene = new THREE.Scene()
const geometry = new THREE.BoxGeometry(100, 100, 100)
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
const mesh = new THREE.Mesh(geometry, material)
const bg_tex = new THREE.TextureLoader().load('/textures/8k_jupiter.jpg')

bg_tex.mapping = THREE.EquirectangularReflectionMapping
scene.background = bg_tex
mesh.position.set(new THREE.Vector3(0, 0, 0))
scene.add(mesh)

const scene2 = new THREE.Scene();
scene2.scale.set(0.01, 0.01, 0.01);

// Sizes
const sizes =
{
    width: isMobile? window.outerWidth : window.innerWidth,
    height: isMobile? window.outerHeight : window.innerHeight
}
//alert(window.innerHeight)
//alert(window.innerWidth)


// now anytime you need it, get a reliable window height
//alert('Mobile Safari: ' + isMobileSafari);
//if (isMobileSafari) sizes.height -= 5
// Camera
const camera = new THREE.PerspectiveCamera(isMobile? 85:75, sizes.width / sizes.height)
if (isMobile) camera.setViewOffset( sizes.width, sizes.height, 0, 80, sizes.width, sizes.height );
const spawnPos = new THREE.Vector3(3.3, 1.27, -0.43)
camera.position.set(...spawnPos)
scene.add(camera)
//gui.add(camera, 'fov', 0, 120, 1);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas.webgl'),
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.shadowMap.enabled = true

const cssRenderer = new CSS3DRenderer()
cssRenderer.setSize(sizes.width, sizes.height)


const cssContainer = document.querySelector("#css")
cssContainer.appendChild(cssRenderer.domElement)


///Raycaster
const raycaster = new THREE.Raycaster()


//Post processing
const effectComposer = new EffectComposer(renderer)
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(window.devicePixelRatio)

const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

const outlinePass = new OutlinePass(new THREE.Vector2(sizes.width, sizes.height), scene, camera)
outlinePass.edgeThickness = 3
outlinePass.edgeStrength = 4
outlinePass.edgeGlow = 0.5
outlinePass.visibleEdgeColor.set('#ffffff');
outlinePass.hiddenEdgeColor.set('#ffffff');
effectComposer.addPass(outlinePass)

const unrealBloomPass = new UnrealBloomPass()
unrealBloomPass.strength = 0.22
unrealBloomPass.radius = 0.829
unrealBloomPass.threshold = 0.681
effectComposer.addPass(unrealBloomPass)

const smaaPass = new SMAAPass()
effectComposer.addPass(smaaPass)

/*gui.add(unrealBloomPass, 'enabled')
gui.add(unrealBloomPass, 'strength').min(0).max(2).step(0.001)
gui.add(unrealBloomPass, 'radius').min(0).max(2).step(0.001)
gui.add(unrealBloomPass, 'threshold').min(0).max(1).step(0.001)*/


const controls = new OrbitControls(camera, renderer.domElement)
const spawnTarget = new THREE.Vector3(2.78, 1.09, -0.06)
controls.target = spawnTarget
controls.enableZoom = false
controls.enablePan = false

function initDeviceOrientationControls() {
    deviceOrientationControls = new DeviceOrientationControls(camera)
    deviceOrientationControls.enabled = true
    deviceOrientationControls.enablePan = false
    deviceOrientationControls.enableZoom = false
    controls.enabled = false
    deviceControls = true
    deviceControlsActive = true
}

/*if(controls.target) {
    gui.add(camera.up,'z',-0.1,0.1)
}*/

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
    cssRenderer.setSize(sizes.width, sizes.height)
})

var mousedown = false


cssContainer.addEventListener('mousedown', (e) => {
    startY = e.clientY;
    old_deltaY = content.scrollTop
    mousedown = true
});

cssContainer.addEventListener('mouseup', (e) => {
    mousedown = false
});

cssContainer.addEventListener('mousemove', (e) => {
    if (mousedown) {
        deltaY = e.clientY - startY
        content.scrollTop = old_deltaY - deltaY
    }
});

cssContainer.addEventListener('mousewheel', (e) => {
    content.scrollTop += e.deltaY
});

cssContainer.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    old_deltaY = content.scrollTop
});

cssContainer.addEventListener('touchmove', (e) => {
    deltaY = e.touches[0].clientY - startY;
    content.scrollTop = old_deltaY - deltaY
});



content.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    old_deltaY = content.scrollTop
});

content.addEventListener('touchmove', (e) => {
    deltaY = e.touches[0].clientY - startY;
    content.scrollTop = old_deltaY - deltaY
});



let btn = document.createElement("button")
btn.innerHTML = "HOME"
btn.className = "home"
document.body.appendChild(btn)
btn.onclick = function (e) {
    camera.rotation.order = 'YXZ'
    e.stopPropagation()
    renderCSS = false
    if (hotspot.element) hotspot.element.style.display = "none"
    btn.style.display = "none"
    controls.enabled = false
    if (deviceControls && !deviceControlsActive) deviceControlsActive = true
    gsap.to(camera.position, { ...spawnPos, duration: 2 })
    gsap.to(camera.up, { z: 0, duration: 2 })
    gsap.to(controls.target, {
        ...new THREE.Vector3(2.78, 1.09, -0.06), duration: 2,
        onComplete: () => { selectedObjects = [], rayCasting = true, controls.enabled = true, cssContainer.style.pointerEvents = "none" }
    })
    controls.update()
};

canvas.addEventListener('mousemove', (event) => {
    if (rayCasting) {
        mouse.x = event.clientX / sizes.width * 2 - 1
        mouse.y = - (event.clientY / sizes.height) * 2 + 1
        raycaster.setFromCamera(mouse, camera)
        const objectsToTest = [fabric, billboard, ...dj_group]
        const intersects = raycaster.intersectObjects(objectsToTest)
        if (intersects.length > 1) {
            if (selectedObjects.length < 1) {
                canvas.style.cursor = "pointer"
                const selectedObject = intersects[0].object.parent
                selectedObjects.push(selectedObject)
                outlinePass.selectedObjects = selectedObjects
            }
        } else {
            selectedObjects = []
            outlinePass.selectedObjects = selectedObjects
            canvas.style.cursor = "default"
        }
    }
})

function useCrosshairSelection() {
    if (rayCasting) {
        const center = new THREE.Vector2(0, 0)
        raycaster.setFromCamera(center, camera)
        const objectsToTest = [fabric, billboard, ...dj_group]
        const intersects = raycaster.intersectObjects(objectsToTest)
        if (intersects.length > 1) {
            if (selectedObjects.length < 1) {
                canvas.style.cursor = "pointer"
                const selectedObject = intersects[0].object.parent
                selectedObjects.push(selectedObject)
                outlinePass.selectedObjects = selectedObjects
            }
        } else {
            selectedObjects = []
            outlinePass.selectedObjects = selectedObjects
            canvas.style.cursor = "default"
        }
    }
}

function FadeInElement(element) {
    renderCSS = true
    element.style.opacity = 0
    element.style.display = "block"
    gsap.to(element, { opacity: 1, duration: 1 })
}

canvas.addEventListener('mousedown', (event) => {
    if (rayCasting && selectedObjects.length > 0) {
        for (let i = 0; i < selections.length; i++) {
            if (selections[i].name === selectedObjects[0].name) {
                if(deviceControls && deviceControlsActive) deviceControlsActive = false
                outlinePass.selectedObjects = []
                rayCasting = false
                hotspot = selections[i]
                nextCamPos = hotspot.camPos
                nextTargetPos = hotspot.targetPos
                const upZ = hotspot.camUpZ
                controls.enabled = false
                canvas.style.cursor = "default"
                gsap.to(camera.position, { ...nextCamPos, duration: 2 })
                gsap.to(camera.up, { z: upZ, duration: 2 })
                gsap.to(controls.target, {
                    ...nextTargetPos, duration: 2,
                    onComplete: () => { btn.style.display = "block", controls.enabled = false, hotspot.element ? FadeInElement(hotspot.element) : "", cssContainer.style.pointerEvents = "auto" }
                })
                controls.update()
                return
            }
        }
    }
})

const startButton = document.getElementById('startButton');
if (!isMobile) {
    startButton.remove()
} else {
    startButton.style.display = 'block'
    startButton.addEventListener('click', function () {
        initDeviceOrientationControls()
    }, false);
}

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

const scene_group = new THREE.Group()
scene.add(scene_group)

const dj_group = []



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
                grassMesh2 = new THREE.InstancedMesh(grassGeo, grassMaterial, Math.round(count * 0.15))


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
                        const l_door = document.getElementById('leftDoor')
                        const r_door = document.getElementById('rightDoor')
                        if (l_door) gsap.to(l_door, { x: -1000, duration: 3, onComplete: () => { l_door.style.display = 'none' } })
                        if (r_door) gsap.to(r_door, { x: 1000, duration: 3, onComplete: () => { r_door.style.display = 'none' } })

                        rayCasting = true
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
        glb.scene.children.forEach(child => {
            child.name = 'dj'
        });
        glb.scene.name = 'dj'
        dj_group.push(glb.scene)
        scene.add(glb.scene)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/table.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        glb.scene.children.forEach(child => {
            child.name = 'dj'
        });
        glb.scene.name = 'dj'
        dj_group.push(glb.scene)
        scene_group.add(glb.scene)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/billboard.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        billboard = glb.scene
        const screen_tex = new THREE.TextureLoader().load('/textures/billboard/1.jpg')
        screen_tex.repeat = new THREE.Vector2(1.0, 0.78)
        screen_tex.offset = new THREE.Vector2(0, 0.22)
        const geometry = new THREE.PlaneGeometry(6.4, 10.7);
        const material = new THREE.MeshBasicMaterial({ map: screen_tex, color: 'white'});
        const plane = new THREE.Mesh(geometry, material);
        plane.position.set(16.05, 11.5, -17.97)
        plane.rotateZ(-Math.PI * 0.02)
        plane.rotateY(Math.PI * 0.025)
        plane.rotateX(-Math.PI * 0.02)
        billboard.name = plane.name = "billboard"
        billboard.add(plane);
        scene_group.add(billboard)
        updateAllMaterials()
    }
)

function LoadVideo() {
    var videlem = document.getElementById('video');
    videlem.load();
    videlem.play();
    let texture = new THREE.VideoTexture(videlem);
    texture.crossOrigin = "anonymous";
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    //texture.flipY = false
    texture.wrapS = THREE.RepeatWrapping;
    //texture.repeat.x = - 1;
    texture.needsUpdate;
    return texture
}

gltfLoader.load(
    '/models/projector.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        projector = glb.scene
        const screen_tex = LoadVideo()//new THREE.TextureLoader().load('/textures/billboard/1.jpg')
        //screen_tex.repeat = new THREE.Vector2(1.0,0.78)
        //screen_tex.offset = new THREE.Vector2(0,0.22)
        const geometry = new THREE.PlaneGeometry(16 * 1.2, 9 * 1.2);
        const material = new THREE.MeshBasicMaterial({ map: screen_tex });
        const plane = new THREE.Mesh(geometry, material);
        plane.position.set(-16.2, 12.7, 20.2)
        //plane.rotateZ(-Math.PI*0.02)
        plane.rotateY(Math.PI * 0.685)
        plane.rotateX(Math.PI * 0.05)
        //billboard.name = plane.name = "billboard"
        projector.add(plane);
        //if (projector.children[2].children[1] !== undefined) projector.children[2].children[1].material.map = LoadVideo()
        //projector.children[2].material.map = LoadVideo()
        //projector.children[2].children[1].visible = false
        scene_group.add(projector)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/clothing_stuff.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        fabric = glb.scene
        const geometry = new THREE.BoxGeometry(3, 5, 1)
        const box = new THREE.Mesh(geometry, material)
        box.position.set(7.3, 5, -9)
        box.rotateY(Math.PI * 0.3)
        box.visible = false
        glb.scene.add(box)
        glb.scene.children.forEach(child => {
            child.name = 'fabric'
        });
        glb.scene.name = 'fabric'
        scene_group.add(fabric)
        updateAllMaterials()
    }
)

gltfLoader.load(
    '/models/cdj.glb',
    (glb) => {
        glb.scene.scale.set(0.2, 0.2, 0.2)
        glb.scene.children.forEach(child => {
            child.name = 'dj'
            child.children.forEach(child => {
                child.name = 'dj'
                child.children.forEach(child => {
                    child.name = 'dj'
                })
            })
        });
        glb.scene.name = 'dj'
        dj_group.push(glb.scene)
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
directionalLight.shadow.mapSize.set(512, 512)
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


function createCSS3DObject(content) {
    var object = new CSS3DObject(content);
    //object.element.style.height = (object.element.style.height% 2 === 0 ? object.element.style.height: object.element.style.height- 1)+'px'
    object.renderOrder = Infinity;
    return object;
}

var cssElement = createCSS3DObject(content);
isMobile ? cssElement.position.set(323, 251, -363) : cssElement.position.set(321.5, 231.1, -359)
//let y = isMobile? 260:230.5
//cssElement.position.set(321.5, y, -359)
gui.add(cssElement.position, 'y', 200, 300, .1);
cssElement.rotateZ(-Math.PI * 0.02)
cssElement.rotateY(Math.PI * 0.025)
cssElement.rotateX(-Math.PI * 0.02)

scene2.add(cssElement);

function animate() {
    if (grassMaterial) {
        grassMaterial.uniforms.uTime.value = Math.sin((Date.now() - start) * 0.0007)
    }
    requestAnimationFrame(animate);

    deviceControlsActive ? deviceOrientationControls.update() : controls.update()
    if (isMobile) useCrosshairSelection()
    directionalLight.updateMatrixWorld()
    directionalLight.target.updateMatrixWorld()
    camera.updateProjectionMatrix()
        if (renderCSS) cssRenderer.render(scene2, camera);
        else effectComposer.render();
    /*console.log('camPos')
    console.log(camera.position)
    console.log('targetPos')
    console.log(controls.target)*/
}

animate()