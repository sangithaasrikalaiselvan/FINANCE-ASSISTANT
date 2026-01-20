document.addEventListener("DOMContentLoaded", function() {
  const container = document.getElementById('three-container');
  if (!container) {
    console.error("Three.js container not found!");
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(5, 5, 5); // bigger cube
const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false }); // bright red
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);


  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);

  camera.position.z = 5;

  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
});
