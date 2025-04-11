// frontend/src/main.js
import {GLTFLoader, OrbitControls} from "three/addons";
import { showProfileModal } from './ui';
import './styles.css';
import {Scene, LoadingManager, PerspectiveCamera, HemisphereLight, Clock, DirectionalLight, WebGLRenderer} from "three";
let currentModel = null;
let missionsData,
    glbPath,
    camera,
    clock,
    renderer,
    scene;

init()

let progressBar = document.getElementById('loading-progress')


// Fetch data from Flask backend
fetch('http://127.0.0.1:5000/api/data')
    .then(response => response.json())
    .then(data => {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
      <h1>Vite + Flask</h1>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `;
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
fetch('http://127.0.0.1:5000/api/mission')
    .then(response => response.json())
    .then(data => {
        missionsData = data;
        const misDiv = document.getElementById('missions');
        data.forEach( (d) => {
        misDiv.innerHTML += `<option value="${d.title}">${d.title}</option>`;
        })
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });

// Mission Change Listener
function getGlbPathByTitle(selectedTitle) {
    const mission = missionsData.find(d => d.title === selectedTitle);
    return mission ? mission.glbPath : null;
}
document.getElementById('missions').addEventListener('change', (event) => {
    const selectedTitle = event.target.value;
    glbPath = getGlbPathByTitle(selectedTitle);
    console.log('Selected GLB Path:', glbPath);
    console.log('Current Model:', currentModel)
    loadModel(glbPath)
})
function loadModel(model) {
    const manager = new LoadingManager();
    manager.onStart = function (url, itemsLoaded, itemsTotal) {
        console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
    };
    manager.onLoad = function () {
        progressBar.style.display = 'none';
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


// login modal

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const payload = {
        username: formData.get('username'),
        password: formData.get('password')
    };
    console.log(payload)

    const res = await fetch('http://127.0.0.1:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    console.log(res)

    if (res.ok) {
        alert('Logged in!');
        form.reset();
        // loadFlights(); // Fetch flights for logged-in user
        document.getElementById('login-section').style.display = 'none';
    } else {
        const err = await res.json();
        alert(`Login failed: ${err.error || 'Unknown error'}`);
    }
});


document.getElementById('logout-btn').addEventListener('click', async () => {
    const res = await fetch('http://127.0.0.1:5000/auth/logout');
    if (res.ok) {
        document.getElementById('profile-modal').classList.add('hidden');
    }
});

document.getElementById('login-btn').addEventListener('click', () => {
    document.getElementById('login-modal').classList.remove('hidden');
});

// Opens when profile model loads

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const res = await fetch('http://127.0.0.1:5000/api/upload', {
        method: 'POST',
        body: formData
    });
    const result = await res.json();
    console.log(result);
    loadFlights(); // Refresh flight list
});

document.addEventListener('DOMContentLoaded', () => {
    // loadFlights();

    const uploadForm = document.getElementById('upload-form');
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(uploadForm);

        const res = await fetch('http://127.0.0.1:5000/api/upload', {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            alert('Upload successful!');
            uploadForm.reset();
            loadFlights();
        } else {
            alert('Upload failed');
        }
    });
});

async function loadFlights() {
    const res = await fetch('http://127.0.0.1:5000/api/flights/user');
    const flights = await res.json();
    const flightList = document.getElementById('flight-list');
    flightList.innerHTML = '';

    flights.forEach(flight => {
        const div = document.createElement('div');
        div.className = 'flight-card';
        div.innerHTML = `
      <h4>${flight.title}</h4>
      <img src="${flight.ndviPath}" alt="NDVI preview" width="200" />
      <p>
        <button onclick="viewFlight('${flight.glbPath}')">View</button>
        <button onclick="deleteFlight(${flight.id})">Delete</button>
      </p>
    `;
        flightList.appendChild(div);
    });
}

function viewFlight(glbPath) {
    // reuse your init(glbPath) logic to load model
    init(glbPath);
}

async function deleteFlight(id) {
    if (!confirm("Delete this flight?")) return;

    const res = await fetch(`http://127.0.0.1:5000/api/flights/${id}`, { method: 'DELETE' });
    if (res.ok) {
        alert('Flight deleted');
        loadFlights();
    } else {
        alert('Failed to delete flight');
    }
}


fetch('http://127.0.0.1:5000/auth/test',{  method: 'POST'})