// frontend/src/main.js
import {GLTFLoader, OrbitControls} from "three/addons";
import './styles.css';
import {Scene, LoadingManager, PerspectiveCamera, HemisphereLight, Clock, DirectionalLight, WebGLRenderer} from "three";
import { ModalManager } from './js/modal.js';
import { showProfileModal } from './ui';
import { setupAuth } from './js/auth.js';
import { setupFlights } from './js/flights.js';
import { setupProfile } from './js/profile.js';



let currentModel = null;
let currentUser = null;
let profileUsername;
let missionsData,
    glbPath,
    camera,
    clock,
    renderer,
    scene;

init()

let progressBar = document.getElementById('loading-progress')


// Fetch default missions
// fetch('http://127.0.0.1:5000/api/mission')
//     .then(response => response.json())
//     .then(data => {
//         missionsData = data;
//         const misDiv = document.getElementById('missions');
//         data.forEach( (d) => {
//         misDiv.innerHTML += `<option value="${d.title}">${d.title}</option>`;
//         })
//     })
//     .catch(error => {
//         console.error('Error fetching data:', error);
//     });

// Mission Change Listener
function getGlbPathByTitle(selectedTitle) {
    const mission = missionsData.find(d => d.title === selectedTitle);
    return mission ? mission.glbPath : null;
}
// document.getElementById('missions').addEventListener('change', (event) => {
//     const selectedTitle = event.target.value;
//     glbPath = getGlbPathByTitle(selectedTitle);
//     console.log('Selected GLB Path:', glbPath);
//     console.log('Current Model:', currentModel)
//     loadModel(glbPath)
// })

// ThreeJS funcs
function loadModel(model) {
    const manager = new LoadingManager();
    manager.onStart = function (url, itemsLoaded, itemsTotal) {
        console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
    };
    manager.onLoad = function () {
        progressBar.style.display = 'none';
        document.getElementById('container').style.display = 'block';
        console.log('Loading complete!');
    };
    manager.onProgress = function (xhr) {
        if (xhr.lengthComputable) {
            const percentComplete = xhr.loaded / xhr.total * 100;
            progressBar.style.display = 'block';
            progressBar.innerHTML = `${percentComplete}`;
            console.log('model ' + percentComplete.toFixed(2) + '% downloaded');
        }
    }

    manager.onError = function (url) {
        console.log('There was an error loading ' + url);
    };
    let loader = new GLTFLoader(manager);

    loader.load(model, function (gltf) {
        if (currentModel) {
            scene.remove(currentModel);
            disposeModel(currentModel);
        }

        currentModel = gltf.scene;
        scene.add(currentModel);
        render();
    })
}

function disposeModel(model) {
    console.log("Disposing ", model)
    document.getElementById('container').style.display = 'none';
    model.traverse((object) => {
        if (object.isMesh) {
            if (object.geometry) object.geometry.dispose();

            if (object.material) {
                const materials = Array.isArray(object.material)
                    ? object.material
                    : [object.material];

                materials.forEach((material) => {
                    // Dispose textures
                    for (const key in material) {
                        const value = material[key];
                        if (value && value.isTexture) {
                            value.dispose();
                        }
                    }
                    material.dispose();
                });
            }
        }
    });
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth /2, window.innerHeight/2);


}

function render() {

    renderer.render( scene, camera );

}
function init() {

    const container = document.getElementById('container');
    let progressBar = document.getElementById('loading-progress')
    container.style.display = 'none';
    scene = new Scene();
    camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
    camera.position.set(1, 2, 600);
    camera.lookAt(0, 1, 0);
    clock = new Clock();

    renderer = new WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth /2, window.innerHeight/2);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 2;
    controls.maxDistance = 5;
    controls.addEventListener('change', render);

    window.addEventListener('resize', onWindowResize);

    const hemiLight = new HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new DirectionalLight(0xffffff, 3);
    dirLight.position.set(-3, 10, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    scene.add(dirLight);

}
// ThreeJS


document.addEventListener('DOMContentLoaded', () => {

    const loginBtn = document.getElementById('login-button');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            ModalManager.toggle('login-modal');
        });
    }


    // Register all modals
    ModalManager.register('login-modal');
    ModalManager.register('profile-modal');
    ModalManager.register('upload-modal');

    // Init modules
    setupAuth();
    showProfileModal()
    // setupFlights();
    setupProfile();

});


// close modal button listener
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('close-button')) {
        const targetModalId = event.target.getAttribute('data-modal-target');
        if (targetModalId) {
           ModalManager.toggle(targetModalId);
        } else {
            console.warn("Close button missing data-modal-target attribute.");
        }
    }
});