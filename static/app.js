
// ---------------------------
// 3D Visual Initializers
// ---------------------------

// Initialize Lottie on landing (if landing-lottie container exists)
function initLandingLottie() {
  const container = document.getElementById('landing-lottie');
  if (!container) return;
  // If lottie-player already exists, skip (landing.html inline script may have created it)
  if (container.querySelector('lottie-player')) return;
  const lp = document.createElement('lottie-player');
  lp.setAttribute('src', 'https://assets10.lottiefiles.com/packages/lf20_jcikwtux.json'); // rotating coin-ish
  lp.setAttribute('background', 'transparent');
  lp.setAttribute('speed', '1');
  lp.setAttribute('style', 'width:420px; height:420px;');
  lp.setAttribute('loop', '');
  lp.setAttribute('autoplay', '');
  container.appendChild(lp);
}

// Simple Three.js animated gradient for Home page
function initHomeThree() {
  const canvas = document.getElementById('home-three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Keep retina handling simple
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Create a large plane with a moving procedural shader-like color via vertex displacement approximation
  const geometry = new THREE.PlaneGeometry(20, 12, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: 0x1b6f9c, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -0.3;
  plane.position.z = -10;
  scene.add(plane);

  // Add subtle moving light using point light
  const light = new THREE.PointLight(0xffffff, 0.8);
  light.position.set(5, 5, 10);
  scene.add(light);

  camera.position.z = 5;

  let t = 0;
  function animate() {
    t += 0.01;
    plane.rotation.z = Math.sin(t * 0.2) * 0.05;
    plane.position.x = Math.sin(t * 0.6) * 0.3;
    light.position.x = Math.cos(t * 0.7) * 6;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Resize handling
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}

// Lightweight Three.js particles for Dashboard
function initDashboardThree() {
  const canvas = document.getElementById('dashboard-three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const particleCount = Math.min(350, Math.floor(window.innerWidth / 3)); // adapt count to screen
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3 + 0] = (Math.random() - 0.5) * 60; // x
    positions[i3 + 1] = (Math.random() - 0.5) * 40; // y
    positions[i3 + 2] = (Math.random() - 0.5) * 20; // z
    // subtle bluish colors
    colors[i3 + 0] = 0.2 + Math.random() * 0.6; // r
    colors[i3 + 1] = 0.4 + Math.random() * 0.5; // g
    colors[i3 + 2] = 0.6 + Math.random() * 0.4; // b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 1.8, vertexColors: true, transparent: true, opacity: 0.85 });
  const points = new THREE.Points(geometry, material);
  points.position.z = -10;
  scene.add(points);

  camera.position.z = 10;

  let t = 0;
  function animate() {
    t += 0.005;
    // move particles slowly
    points.rotation.y = t * 0.2;
    points.rotation.x = Math.sin(t * 0.3) * 0.05;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // resize
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}

// ---------------------------
// Existing Chart & Goal Code (preserved + slightly improved visuals)
// ---------------------------

// Fetch transaction summary from backend
async function fetchSummary() {
  try {
    const res = await fetch('/api/summary');
    if (!res.ok) return {};
    return res.json();
  } catch (err) {
    console.error("Error fetching summary:", err);
    return {};
  }
}

// Draw bar chart for monthly spending (styled)
function drawBarChart(monthlyData) {
  if (!monthlyData) return;
  const ctx = document.getElementById('lineChart').getContext('2d');
  const months = Object.keys(monthlyData);
  const amounts = Object.values(monthlyData);

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(75,192,192,0.9)');
  gradient.addColorStop(1, 'rgba(75,192,192,0.25)');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Monthly Spending',
        data: amounts,
        backgroundColor: gradient,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(75,192,192,1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { color: '#222' } },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0,0,0,0.7)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 10
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#333' }, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { ticks: { color: '#333' }, grid: { display: false } }
      },
      animation: { duration: 1000, easing: 'easeOutQuart' }
    }
  });
}

// Draw pie chart for category spending (styled)
function drawPieChart(categoryData) {
  if (!categoryData) return;
  const ctx = document.getElementById('pieChart').getContext('2d');
  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);

  const backgroundColors = [
    'rgba(75,192,192,0.85)','rgba(255,99,132,0.85)','rgba(54,162,235,0.85)','rgba(255,206,86,0.85)',
    'rgba(156,39,176,0.85)','rgba(255,152,0,0.85)','rgba(0,188,212,0.85)','rgba(255,193,7,0.85)',
    'rgba(139,195,74,0.85)','rgba(255,87,34,0.85)'
  ];

  new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data, backgroundColor: backgroundColors.slice(0, labels.length), borderColor: '#fff', borderWidth: 2, hoverOffset: 8 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { color: '#222' } } },
      animation: { animateRotate: true, animateScale: true, duration: 1000 }
    }
  });
}

// Handle goal checking form
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize 3D / Lottie visuals depending on page
  initLandingLottie();
  initHomeThree();
  initDashboardThree();

  // Charts & data
  const summary = await fetchSummary();
  if (summary.monthly_spending) drawBarChart(summary.monthly_spending);
  if (summary.category_totals) drawPieChart(summary.category_totals);

  const form = document.getElementById('goalForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const goal_amount = parseFloat(document.getElementById('goal_amount').value);
    const months = parseInt(document.getElementById('months').value);
    const monthly_income_val = document.getElementById('monthly_income').value;
    const monthly_income = monthly_income_val ? parseFloat(monthly_income_val) : null;

    try {
      const res = await fetch('/api/check_goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_amount, months, monthly_income })
      });

      const data = await res.json();
      const out = document.getElementById('goalResult');

      if (data.error) {
        out.innerText = data.error;
        return;
      }

      let text = `Feasible: ${data.feasible ? 'Yes ✅' : 'No ❌'}\n`;
      text += `Current Monthly Savings: ₹${data.current_monthly_savings}\n`;
      text += `Needed Monthly Savings: ₹${data.needed_monthly_savings}\n`;
      if (data.months_needed_at_current_rate) text += `Months needed at current savings: ${data.months_needed_at_current_rate}\n`;
      text += '\nSuggestions:\n';
      data.suggestions.forEach(s => { text += `- ${s}\n`; });
      out.innerText = text;

    } catch (err) {
      console.error("Error checking goal:", err);
      document.getElementById('goalResult').innerText = "Error checking goal.";
    }
  });
});
