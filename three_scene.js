// Minimal three.js-based fallback scene using CDN-loaded THREE
let threeRenderer = null;
let threeScene = null;
let threeCamera = null;
let threeRaf = null;

function startThree(container) {
    // require global THREE from CDN
    if (typeof THREE === 'undefined') {
        // inject CDN script
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/three@0.152.2/build/three.min.js';
        s.onload = () => initializeThree(container);
        document.head.appendChild(s);
    } else {
        initializeThree(container);
    }
}

function initializeThree(container) {
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    threeRenderer = new THREE.WebGLRenderer({ antialias: true });
    threeRenderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(threeRenderer.domElement);

    threeScene = new THREE.Scene();
    threeCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    threeCamera.position.set(0, 6, 10);
    threeCamera.lookAt(0, 0, 0);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5,10,7);
    threeScene.add(light);

    const geom = new THREE.BoxGeometry(1,1,1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x44ff88 });
    const cube = new THREE.Mesh(geom, mat);
    threeScene.add(cube);

    function animate() {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.02;
        threeRenderer.render(threeScene, threeCamera);
        threeRaf = requestAnimationFrame(animate);
    }
    animate();
}

function stopThree() {
    if (threeRaf) cancelAnimationFrame(threeRaf);
    threeRaf = null;
    if (threeRenderer && threeRenderer.domElement && threeRenderer.domElement.parentNode) {
        threeRenderer.domElement.parentNode.removeChild(threeRenderer.domElement);
    }
    threeRenderer = null;
    threeScene = null;
    threeCamera = null;
}
