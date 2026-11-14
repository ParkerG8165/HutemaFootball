/* =========================================
1. COLOR MAP & CONFIGURATION
   ========================================= */

const COLOR_MAP = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#E53E3E" },
  { name: "Blue", hex: "#3182CE" },
  { name: "Navy", hex: "#1A202C" },
  { name: "Gold", hex: "#D69E2E" },
  { name: "Silver", hex: "#A0AEC0" },
  { name: "Neon Yellow", hex: "#ECC94B" },
  { name: "Emerald Green", hex: "#38A169" }
];

const settings = {
  upper: {
    options: ["Leather", "Synthetic", "Synthetic Leather"],
    labels: ["Classic touch", "Speed fit", "Hybrid feel"],
    blocks: [
      "High Sock Laces",
      "Low Sock Laces",
      "Mid Sock Laces",
      "High Sock Laceless",
      "Low Sock Laceless",
      "Mid Sock Laceless"
    ],
    // Map your custom upper models here. Everything else safely uses custom-shoe.glb fallback.
    modelMap: {
      "Synthetic_Low Sock Laceless": "./models/Syntheticlowsocklaceless.glb",
      "Synthetic_Low Sock Laces": "./models/Syntheticlowsocklaces.glb"
    }
  },

  soleplate: {
    options: ["Firm Ground", "Artificial Ground", "Soft Ground"],
    labels: ["Firm Ground", "Artificial Ground", "Soft Ground"],
    blocks: [
      "Accuracy/Control",
      "Speed",
      "Defense"
    ],
    // Map your soleplate models here. Everything else safely uses a base soleplate fallback.
    modelMap: {
      "Firm Ground_Accuracy/Control": "./models/Fgaccuracysoleplate.glb",
      "Firm Ground_Defense": "./models/Fgdefensesoleplate.glb"
    }
  }
};

const category = document.body.dataset.category || "upper";
const config = settings[category];

const nameElement = document.querySelector(".option-name");
const gridElement = document.querySelector(".picture-grid");

let current = 0;


/* =========================================
   2. PERSISTENT STORAGE
   ========================================= */

function getStoredSelections() {
  const upperDefault = {
    texture: "Leather",
    block: settings.upper.blocks[0],
    colorName: "Black",
    colorHex: "#000000"
  };

  const soleplateDefault = {
    choice: "Firm Ground",
    block: settings.soleplate.blocks[0],
    colorName: "White",
    colorHex: "#FFFFFF"
  };

  const upper =
    JSON.parse(localStorage.getItem("hutema_selectedUpper")) ||
    upperDefault;

  const soleplate =
    JSON.parse(localStorage.getItem("hutema_selectedSoleplate")) ||
    soleplateDefault;

  const soleplateNameMap = {
    FG: "Firm Ground",
    AG: "Artificial Ground",
    SG: "Soft Ground",
    TF: "Firm Ground",
    "Artificial Grass": "Artificial Ground",
    Turf: "Firm Ground"
  };

  if (soleplateNameMap[soleplate.choice]) {
    soleplate.choice = soleplateNameMap[soleplate.choice];
  }

  if (!settings.soleplate.options.includes(soleplate.choice)) {
    soleplate.choice = "Firm Ground";
  }

  return { upper, soleplate };
}

let {
  upper: selectedUpper,
  soleplate: selectedSoleplate
} = getStoredSelections();

function saveSelections() {
  localStorage.setItem(
    "hutema_selectedUpper",
    JSON.stringify(selectedUpper)
  );

  localStorage.setItem(
    "hutema_selectedSoleplate",
    JSON.stringify(selectedSoleplate)
  );
}


/* =========================================
   3. 3D WEBGL ENGINE SETUP
   ========================================= */

let scene, camera, renderer, controls;
let cleatGroup = null;
let currentUpperMesh = null;
let currentSoleplateMesh = null;

let loadedUpperPath = "";
let loadedSoleplatePath = "";

function init3D() {
  const container = document.getElementById("webgl-container");

  if (!container || typeof THREE === "undefined") return;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    30,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );

  // Position camera starting at max zoom distance
  camera.position.set(2, 1.5, 3).normalize().multiplyScalar(5.0);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
  dirLight1.position.set(5, 10, 7);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight2.position.set(-5, -5, -5);
  scene.add(dirLight2);

  // Orbit controls setup
  try {
    if (typeof THREE.OrbitControls === "function") {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
    } else if (typeof OrbitControls === "function") {
      controls = new OrbitControls(camera, renderer.domElement);
    }

    if (controls) {
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1.0;
      controls.maxDistance = 3.5;
    }
  } catch (e) {
    console.warn("OrbitControls failed to initialize:", e);
  }

  // Create parent container for the combined cleat
  cleatGroup = new THREE.Group();
  cleatGroup.position.set(0, -0.15, 0);
  cleatGroup.scale.set(1.1, 1.1, 1.1);
  scene.add(cleatGroup);

  loadedUpperPath = "";
  loadedSoleplatePath = "";

  loadCleatModels();

  window.addEventListener("resize", onWindowResize);
  animate();
}

function loadCleatModels() {
  if (typeof THREE.GLTFLoader === "undefined" || !cleatGroup) return;

  const loader = new THREE.GLTFLoader();

  // 1. Determine Upper Model URL with safe fallback
  let upperUrl = "./models/custom-shoe.glb";
  const upperKey = `${selectedUpper.texture}_${selectedUpper.block}`;

  if (settings.upper.modelMap) {
    if (settings.upper.modelMap[upperKey]) {
      upperUrl = settings.upper.modelMap[upperKey];
    } else {
      const foundKey = Object.keys(settings.upper.modelMap).find(
        (k) => k.toLowerCase() === upperKey.toLowerCase()
      );
      if (foundKey) {
        upperUrl = settings.upper.modelMap[foundKey];
      }
    }
  }

  // 2. Determine Soleplate Model URL with safe fallback
  let soleplateUrl = "./models/Fgaccuracysoleplate.glb"; // General fallback soleplate
  const soleplateKey = `${selectedSoleplate.choice}_${selectedSoleplate.block}`;

  if (settings.soleplate.modelMap) {
    if (settings.soleplate.modelMap[soleplateKey]) {
      soleplateUrl = settings.soleplate.modelMap[soleplateKey];
    } else {
      const foundSoleKey = Object.keys(settings.soleplate.modelMap).find(
        (k) => k.toLowerCase() === soleplateKey.toLowerCase()
      );
      if (foundSoleKey) {
        soleplateUrl = settings.soleplate.modelMap[foundSoleKey];
      }
    }
  }

  // Load Upper if path changes
  if (loadedUpperPath !== upperUrl) {
    loadedUpperPath = upperUrl;
    loader.load(
      upperUrl,
      (gltf) => {
        if (currentUpperMesh) cleatGroup.remove(currentUpperMesh);
        currentUpperMesh = gltf.scene;

        currentUpperMesh.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material = child.material.clone();
          }
        });

        cleatGroup.add(currentUpperMesh);
        applyColors();
      },
      undefined,
      (err) => {
        console.error("Failed to load upper model at:", upperUrl, err);
        loadedUpperPath = "";
      }
    );
  }

  // Load Soleplate if path changes
  if (loadedSoleplatePath !== soleplateUrl) {
    loadedSoleplatePath = soleplateUrl;
    loader.load(
      soleplateUrl,
      (gltf) => {
        if (currentSoleplateMesh) cleatGroup.remove(currentSoleplateMesh);
        currentSoleplateMesh = gltf.scene;

        currentSoleplateMesh.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material = child.material.clone();
          }
        });

        cleatGroup.add(currentSoleplateMesh);
        applyColors();
      },
      undefined,
      (err) => {
        console.error("Failed to load soleplate model at:", soleplateUrl, err);
        loadedSoleplatePath = "";
      }
    );
  }
}

function onWindowResize() {
  const container = document.getElementById("webgl-container");
  if (!container || !renderer || !camera) return;

  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}


/* =========================================
   4. INDEPENDENT COLOR APPLICATION
   ========================================= */

function applyColors() {
  if (currentUpperMesh) {
    currentUpperMesh.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color.set(selectedUpper.colorHex);
        child.material.needsUpdate = true;
      }
    });
  }

  if (currentSoleplateMesh) {
    currentSoleplateMesh.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color.set(selectedSoleplate.colorHex);
        child.material.needsUpdate = true;
      }
    });
  }
}

function update3DModel() {
  applyColors();
}


/* =========================================
   5. COLOR PICKER SWATCHES
   ========================================= */

function createColorPicker() {
  const existing = document.querySelector(".color-picker-area");
  if (existing) existing.remove();

  const optionsPanel = document.querySelector(".options-panel");
  if (!optionsPanel) return;

  const currentColorHex =
    category === "upper"
      ? selectedUpper.colorHex
      : selectedSoleplate.colorHex;

  const currentColorName =
    category === "upper"
      ? selectedUpper.colorName
      : selectedSoleplate.colorName;

  const colorArea = document.createElement("div");
  colorArea.className = "color-picker-area";

  const swatchesHTML = COLOR_MAP.map(
    (color) => `
    <button
      type="button"
      class="color-swatch${
        color.hex.toUpperCase() === currentColorHex.toUpperCase()
          ? " active"
          : ""
      }"
      data-name="${color.name}"
      data-hex="${color.hex}"
      style="background-color: ${color.hex};"
      title="${color.name}"
      aria-label="${color.name}"
    ></button>
  `
  ).join("");

  colorArea.innerHTML = `
    <label>
      ${category === "upper" ? "Upper Color" : "Soleplate Color"}:
      <strong class="color-value">${currentColorName}</strong>
    </label>

    <div class="color-swatches-grid">
      ${swatchesHTML}
    </div>
  `;

  optionsPanel.appendChild(colorArea);

  const swatches = colorArea.querySelectorAll(".color-swatch");
  const colorValue = colorArea.querySelector(".color-value");

  swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      colorArea
        .querySelector(".color-swatch.active")
        ?.classList.remove("active");

      swatch.classList.add("active");

      const name = swatch.dataset.name;
      const hex = swatch.dataset.hex;

      colorValue.textContent = name;

      if (category === "upper") {
        selectedUpper.colorName = name;
        selectedUpper.colorHex = hex;
      } else {
        selectedSoleplate.colorName = name;
        selectedSoleplate.colorHex = hex;
      }

      saveSelections();
      updateReport();
      applyColors();
    });
  });
}


/* =========================================
   6. SUMMARY REPORT PANEL
   ========================================= */

function createReport() {
  if (category === "upper" && document.querySelector(".customization-report")) {
    return;
  }
  updateReport();
}

function updateReport() {
  const setText = (selectors, value) => {
    selectors.forEach((selector) => {
      const element = document.querySelector(selector);
      if (element) element.textContent = value;
    });
  };

  setText(
    ["#summary-upper-texture", "#report-upper-texture"],
    selectedUpper.texture
  );
  setText(
    ["#summary-upper-block", "#report-upper-block"],
    selectedUpper.block
  );
  setText(
    ["#summary-upper-color", "#report-upper-color"],
    selectedUpper.colorName
  );

  setText(
    ["#summary-sole-choice", "#report-sole-choice"],
    selectedSoleplate.choice
  );
  setText(
    ["#summary-sole-block", "#report-sole-block"],
    selectedSoleplate.block
  );
  setText(
    ["#summary-sole-color", "#report-sole-color"],
    selectedSoleplate.colorName
  );

  const combination =
    `${selectedUpper.texture} upper with ` +
    `${selectedUpper.block} in ${selectedUpper.colorName}, ` +
    `paired with a ${selectedSoleplate.choice} soleplate ` +
    `(${selectedSoleplate.block}) in ` +
    `${selectedSoleplate.colorName}.`;

  setText(["#summary-combination", "#report-combination"], combination);
}


/* =========================================
   7. RENDER CUSTOMIZER CONTROLS
   ========================================= */

function render() {
  const option = config.options[current];
  const label = config.labels[current];

  if (nameElement) {
    nameElement.textContent = option;
  }

  const activeBlock =
    category === "upper" ? selectedUpper.block : selectedSoleplate.block;

  if (gridElement) {
    gridElement.innerHTML = config.blocks
      .map(
        (blockName) => `
          <button
            class="picture-card${
              blockName === activeBlock ? " selected" : ""
            }"
            type="button"
            data-block="${blockName}"
          >
            <span>${blockName}</span>

            <small>
              ${category === "soleplate" ? label : `${option} · ${label}`}
            </small>
          </button>
        `
      )
      .join("");
  }

  if (category === "upper") {
    selectedUpper.texture = option;
  } else if (category === "soleplate") {
    selectedSoleplate.choice = option;
  }

  saveSelections();
  createColorPicker();
  updateReport();
  loadCleatModels();
}


/* =========================================
   8. EVENT LISTENERS & INITIALIZATION
   ========================================= */

const prevBtn = document.querySelector(".previous");

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    current = (current - 1 + config.options.length) % config.options.length;
    render();
  });
}

const nextBtn = document.querySelector(".next");

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    current = (current + 1) % config.options.length;
    render();
  });
}

if (gridElement) {
  gridElement.addEventListener("click", (event) => {
    const card = event.target.closest(".picture-card");
    if (!card) return;

    gridElement.querySelector(".selected")?.classList.remove("selected");
    card.classList.add("selected");

    const block = card.dataset.block;

    if (category === "upper") {
      selectedUpper.block = block;
    } else {
      selectedSoleplate.block = block;
    }

    saveSelections();
    createColorPicker();
    updateReport();
    loadCleatModels();
  });
}

if (category === "upper") {
  const index = config.options.indexOf(selectedUpper.texture);
  if (index !== -1) current = index;
} else if (category === "soleplate") {
  const index = config.options.indexOf(selectedSoleplate.choice);
  if (index !== -1) current = index;
}

createReport();
init3D();
render();