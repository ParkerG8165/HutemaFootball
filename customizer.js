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
    ]
  },

  soleplate: {
    options: ["Firm Ground", "Artificial Ground", "Soft Ground"],
    labels: ["Firm Ground", "Artificial Ground", "Soft Ground"],
    blocks: [
      "Accuracy/Control",
      "Speed",
      "Defense"
    ]
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

let scene, camera, renderer, controls, bootModel;

function init3D() {
  const container = document.getElementById("webgl-container");

  if (!container || typeof THREE === "undefined") return;

  scene = new THREE.Scene();

  // Reduced FOV (30deg) keeps the toe box fully in view when zoomed/rotated
  camera = new THREE.PerspectiveCamera(
    30,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );

  // Position camera at 0.8 (starts at your minimum zoom level)
  camera.position.set(0, 0.1, 0.8);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

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
  if (typeof THREE.OrbitControls !== "undefined") {
    controls = new THREE.OrbitControls(
      camera,
      renderer.domElement
    );

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Zoom Limits:
    controls.minDistance = 0.533; // Max zoom-in (1.5x closer than 0.8)
    controls.maxDistance = 0.8;   // Min zoom-out (your previous max zoom)
  }

  // Load 3D shoe model
  if (typeof THREE.GLTFLoader !== "undefined") {
    const loader = new THREE.GLTFLoader();

    const modelUrl =
      "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb";

    loader.load(
      modelUrl,
      (gltf) => {
        bootModel = gltf.scene;

        bootModel.position.set(0, -0.15, 0);
        bootModel.scale.set(1.1, 1.1, 1.1);

        // Ensure materials are unique on meshes so upper and soleplate color independently
        bootModel.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material = child.material.clone();
          }
        });

        scene.add(bootModel);
        update3DModel();
      },
      undefined,
      (error) => {
        console.error("Error loading 3D model:", error);
      }
    );
  }

  window.addEventListener("resize", onWindowResize);
  animate();
}

function onWindowResize() {
  const container = document.getElementById("webgl-container");

  if (!container || !renderer || !camera) return;

  camera.aspect =
    container.clientWidth / container.clientHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );
}

function animate() {
  requestAnimationFrame(animate);

  if (controls) {
    controls.update();
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}


/* =========================================
   4. MULTI-PART 3D MODEL COLOR UPDATES
   ========================================= */

function update3DModel() {
  if (!bootModel) return;

  bootModel.traverse((child) => {
    if (child.isMesh && child.material) {
      const name = (child.name + " " + child.material.name).toLowerCase();

      // Check if mesh/material matches soleplate keywords OR sample model material names
      const isSoleplate =
        name.includes("sole") ||
        name.includes("plate") ||
        name.includes("bottom") ||
        name.includes("stud") ||
        name.includes("outsole") ||
        name.includes("rubber") ||
        name.includes("stripe") ||
        child.material.name === "street_shoe_sole";

      if (isSoleplate) {
        child.material.color.set(selectedSoleplate.colorHex);
      } else {
        child.material.color.set(selectedUpper.colorHex);
      }

      child.material.needsUpdate = true;
    }
  });
}


/* =========================================
   5. COLOR PICKER SWATCHES
   ========================================= */

function createColorPicker() {
  const existing = document.querySelector(".color-picker-area");

  if (existing) {
    existing.remove();
  }

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

  const swatchesHTML = COLOR_MAP.map((color) => `
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
  `).join("");

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
      update3DModel();
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
      if (element) {
        element.textContent = value;
      }
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

  setText(
    ["#summary-combination", "#report-combination"],
    combination
  );
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
    category === "upper"
      ? selectedUpper.block
      : selectedSoleplate.block;

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
              ${
                category === "soleplate"
                  ? label
                  : `${option} · ${label}`
              }
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
  update3DModel();
}


/* =========================================
   8. EVENT LISTENERS
   ========================================= */

const prevBtn = document.querySelector(".previous");

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    current =
      (current - 1 + config.options.length) %
      config.options.length;

    render();
  });
}

const nextBtn = document.querySelector(".next");

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    current =
      (current + 1) % config.options.length;

    render();
  });
}

if (gridElement) {
  gridElement.addEventListener("click", (event) => {
    const card = event.target.closest(".picture-card");

    if (!card) return;

    gridElement
      .querySelector(".selected")
      ?.classList.remove("selected");

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
    update3DModel();
  });
}


/* =========================================
   9. INITIALIZE PAGE
   ========================================= */

if (category === "upper") {
  const index = config.options.indexOf(selectedUpper.texture);
  if (index !== -1) current = index;
} else if (category === "soleplate") {
  const index = config.options.indexOf(selectedSoleplate.choice);
  if (index !== -1) current = index;
}

createReport();
render();
init3D();