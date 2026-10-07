/* -----------------------------
   COLOR MAP & CONFIGURATION
----------------------------- */

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
    options: ["FG", "AG", "TF", "SG"],
    labels: ["Firm Ground", "Artificial Grass", "Turf", "Soft Ground"],
    blocks: [
      "Accuracy/Control",
      "Speed",
      "Defense"
    ]
  }
};

const category = document.body.dataset.category;
const config = settings[category];

const name = document.querySelector(".option-name");
const grid = document.querySelector(".picture-grid");

let current = 0;

/* -----------------------------
   PERSISTENT STORAGE (localStorage)
----------------------------- */

function getStoredSelections() {
  const upperDefault = {
    texture: "Leather",
    block: settings.upper.blocks[0],
    colorName: "Black",
    colorHex: "#000000"
  };

  const soleplateDefault = {
    choice: "FG",
    block: settings.soleplate.blocks[0],
    colorName: "White",
    colorHex: "#FFFFFF"
  };

  const upper = JSON.parse(localStorage.getItem("hutema_selectedUpper")) || upperDefault;
  const soleplate = JSON.parse(localStorage.getItem("hutema_selectedSoleplate")) || soleplateDefault;

  return { upper, soleplate };
}

let { upper: selectedUpper, soleplate: selectedSoleplate } = getStoredSelections();

function saveSelections() {
  localStorage.setItem("hutema_selectedUpper", JSON.stringify(selectedUpper));
  localStorage.setItem("hutema_selectedSoleplate", JSON.stringify(selectedSoleplate));
}

/* -----------------------------
   CREATE COLOR PICKER SWATCHES
----------------------------- */

function createColorPicker() {
  let existing = document.querySelector(".color-picker-area");
  if (existing) {
    existing.remove();
  }

  const currentColorHex = category === "upper" ? selectedUpper.colorHex : selectedSoleplate.colorHex;
  const currentColorName = category === "upper" ? selectedUpper.colorName : selectedSoleplate.colorName;

  const colorArea = document.createElement("div");
  colorArea.className = "color-picker-area";

  const swatchesHTML = COLOR_MAP.map(c => `
    <button 
      type="button" 
      class="color-swatch${c.hex.toUpperCase() === currentColorHex.toUpperCase() ? " active" : ""}" 
      data-name="${c.name}" 
      data-hex="${c.hex}"
      style="background-color: ${c.hex};"
      title="${c.name}"
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

  document.querySelector(".options-panel").appendChild(colorArea);

  const swatches = colorArea.querySelectorAll(".color-swatch");
  const colorValue = colorArea.querySelector(".color-value");

  swatches.forEach(swatch => {
    swatch.addEventListener("click", () => {
      colorArea.querySelector(".color-swatch.active")?.classList.remove("active");
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
    });
  });
}

/* -----------------------------
   REPORT
----------------------------- */

function createReport() {
  if (document.querySelector(".customization-report")) {
    return;
  }

  const report = document.createElement("aside");
  report.className = "customization-report";

  report.innerHTML = `
    <h2>Custom Boot</h2>

    <div class="report-divider"></div>

    <h3>UPPER</h3>
    <p><strong>Texture:</strong> <span id="report-upper-texture"></span></p>
    <p><strong>Block:</strong> <span id="report-upper-block"></span></p>
    <p><strong>Color:</strong> <span id="report-upper-color"></span></p>

    <div class="report-divider"></div>

    <h3>SOLEPLATE</h3>
    <p><strong>Choice:</strong> <span id="report-sole-choice"></span></p>
    <p><strong>Block:</strong> <span id="report-sole-block"></span></p>
    <p><strong>Color:</strong> <span id="report-sole-color"></span></p>

    <div class="report-divider"></div>

    <h3>COMBINATION</h3>
    <p id="report-combination"></p>
  `;

  document.querySelector(".customizer-layout").appendChild(report);
}

/* -----------------------------
   UPDATE REPORT
----------------------------- */

function updateReport() {
  const upperTexture = document.querySelector("#report-upper-texture");
  const upperBlock = document.querySelector("#report-upper-block");
  const upperColor = document.querySelector("#report-upper-color");

  const soleChoice = document.querySelector("#report-sole-choice");
  const soleBlock = document.querySelector("#report-sole-block");
  const soleColor = document.querySelector("#report-sole-color");

  const combination = document.querySelector("#report-combination");

  upperTexture.textContent = selectedUpper.texture;
  upperBlock.textContent = selectedUpper.block;
  upperColor.textContent = selectedUpper.colorName;

  soleChoice.textContent = selectedSoleplate.choice;
  soleBlock.textContent = selectedSoleplate.block;
  soleColor.textContent = selectedSoleplate.colorName;

  combination.textContent = 
    `${selectedUpper.texture} upper with ${selectedUpper.block} in ${selectedUpper.colorName}, paired with a ${selectedSoleplate.choice} soleplate (${selectedSoleplate.block}) in ${selectedSoleplate.colorName}.`;
}

/* -----------------------------
   RENDER OPTIONS
----------------------------- */

function render() {
  const option = config.options[current];
  const label = config.labels[current];

  name.textContent = option;

  /* Dynamically generate cards for each defined block */
  const activeBlock = category === "upper" ? selectedUpper.block : selectedSoleplate.block;

  grid.innerHTML = config.blocks
    .map(
      (blockName) => `
      <button
        class="picture-card${blockName === activeBlock ? " selected" : ""}"
        type="button"
        data-block="${blockName}"
      >
        <span>${blockName}</span>
        <small>${option} · ${label}</small>
      </button>
    `
    )
    .join("");

  /* Remember choice */
  if (category === "upper") {
    selectedUpper.texture = option;
  } else if (category === "soleplate") {
    selectedSoleplate.choice = option;
  }

  saveSelections();
  createColorPicker();
  updateReport();
}

/* -----------------------------
   PREVIOUS / NEXT BUTTONS
----------------------------- */

document.querySelector(".previous").addEventListener("click", () => {
  current = (current - 1 + config.options.length) % config.options.length;
  render();
});

document.querySelector(".next").addEventListener("click", () => {
  current = (current + 1) % config.options.length;
  render();
});

/* -----------------------------
   SELECT A BLOCK
----------------------------- */

grid.addEventListener("click", (event) => {
  const card = event.target.closest(".picture-card");
  if (!card) return;

  grid.querySelector(".selected")?.classList.remove("selected");
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
});

/* -----------------------------
   INITIALIZE
----------------------------- */

// Set starting option slider index to match stored value if returning to page
if (category === "upper") {
  const index = config.options.indexOf(selectedUpper.texture);
  if (index !== -1) current = index;
} else if (category === "soleplate") {
  const index = config.options.indexOf(selectedSoleplate.choice);
  if (index !== -1) current = index;
}

createReport();
render();