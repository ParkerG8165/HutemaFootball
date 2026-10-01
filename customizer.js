const settings = {
  upper: {
    options: ["Leather", "Synthetic", "Synthetic Leather"],
    labels: ["Classic touch", "Speed fit", "Hybrid feel"]
  },
  soleplate: {
    options: ["FG", "AG", "SG", "TF"],
    labels: ["Firm Ground", "Artificial Grass", "Soft Ground", "Turf"]
  }
};

const category = document.body.dataset.category;
const config = settings[category];

const name = document.querySelector(".option-name");
const grid = document.querySelector(".picture-grid");

let current = 0;


/* -----------------------------
   SAVE CUSTOMIZATION
----------------------------- */

let selectedUpper = {
  texture: "Leather",
  block: "Block 1",
  color: "#000000"
};

let selectedSoleplate = {
  choice: "Not selected",
  block: "Block 1",
  color: "#ffffff"
};


/* -----------------------------
   CREATE COLOR PICKER
----------------------------- */

function createColorPicker() {

  let existing = document.querySelector(".color-picker-area");

  if (existing) {
    existing.remove();
  }

  const colorArea = document.createElement("div");

  colorArea.className = "color-picker-area";

  colorArea.innerHTML = `
    <label for="custom-color">
      ${category === "upper" ? "Upper Color" : "Soleplate Color"}
    </label>

    <div class="color-picker-row">
      <input
        id="custom-color"
        type="color"
        value="${
          category === "upper"
            ? selectedUpper.color
            : selectedSoleplate.color
        }"
      >

      <span class="color-value">
        ${
          category === "upper"
            ? selectedUpper.color.toUpperCase()
            : selectedSoleplate.color.toUpperCase()
        }
      </span>
    </div>
  `;

  document.querySelector(".options-panel").appendChild(colorArea);

  const picker = document.querySelector("#custom-color");
  const colorValue = document.querySelector(".color-value");

  picker.addEventListener("input", () => {

    colorValue.textContent = picker.value.toUpperCase();

    if (category === "upper") {
      selectedUpper.color = picker.value;
    } else {
      selectedSoleplate.color = picker.value;
    }

    updateReport();
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

    <p>
      <strong>Texture:</strong>
      <span id="report-upper-texture">Leather</span>
    </p>

    <p>
      <strong>Block:</strong>
      <span id="report-upper-block">Block 1</span>
    </p>

    <p>
      <strong>Color:</strong>
      <span id="report-upper-color">#000000</span>
    </p>

    <div class="report-divider"></div>

    <h3>SOLEPLATE</h3>

    <p>
      <strong>Choice:</strong>
      <span id="report-sole-choice">Not selected</span>
    </p>

    <p>
      <strong>Block:</strong>
      <span id="report-sole-block">Block 1</span>
    </p>

    <p>
      <strong>Color:</strong>
      <span id="report-sole-color">#FFFFFF</span>
    </p>

    <div class="report-divider"></div>

    <h3>COMBINATION</h3>

    <p id="report-combination">
      Leather upper with Block 1 in #000000, paired with a Not selected soleplate in #FFFFFF.
    </p>
  `;

  document.querySelector(".customizer-layout").appendChild(report);
}


/* -----------------------------
   UPDATE REPORT
----------------------------- */

function updateReport() {

  const upperTexture =
    document.querySelector("#report-upper-texture");

  const upperBlock =
    document.querySelector("#report-upper-block");

  const upperColor =
    document.querySelector("#report-upper-color");

  const soleChoice =
    document.querySelector("#report-sole-choice");

  const soleBlock =
    document.querySelector("#report-sole-block");

  const soleColor =
    document.querySelector("#report-sole-color");

  const combination =
    document.querySelector("#report-combination");


  upperTexture.textContent =
    selectedUpper.texture;

  upperBlock.textContent =
    selectedUpper.block;

  upperColor.textContent =
    selectedUpper.color.toUpperCase();


  soleChoice.textContent =
    selectedSoleplate.choice;

  soleBlock.textContent =
    selectedSoleplate.block;

  soleColor.textContent =
    selectedSoleplate.color.toUpperCase();


  combination.textContent =
    `${selectedUpper.texture} upper with ${selectedUpper.block} in ${selectedUpper.color.toUpperCase()}, paired with a ${selectedSoleplate.choice} soleplate in ${selectedSoleplate.color.toUpperCase()}.`;
}


/* -----------------------------
   RENDER OPTIONS
----------------------------- */

function render() {

  const option = config.options[current];
  const label = config.labels[current];

  name.textContent = option;


  grid.innerHTML = Array.from(
    { length: 9 },
    (_, index) => `
      <button
        class="picture-card${index === 0 ? " selected" : ""}"
        type="button"
        data-block="Block ${index + 1}"
      >
        <span>Picture link</span>
        <small>${option} · ${label}</small>
      </button>
    `
  ).join("");


  /*
    Remember which main option is being viewed.
  */

  if (category === "upper") {

    selectedUpper.texture = option;

  } else if (category === "soleplate") {

    selectedSoleplate.choice = option;

  }


  /*
    Block 1 is selected by default.
  */

  if (category === "upper") {

    selectedUpper.block = "Block 1";

  } else {

    selectedSoleplate.block = "Block 1";

  }


  /*
    Add the color picker.
  */

  createColorPicker();

  updateReport();
}


/* -----------------------------
   PREVIOUS BUTTON
----------------------------- */

document.querySelector(".previous").addEventListener("click", () => {

  current =
    (current - 1 + config.options.length) %
    config.options.length;

  render();
});


/* -----------------------------
   NEXT BUTTON
----------------------------- */

document.querySelector(".next").addEventListener("click", () => {

  current =
    (current + 1) %
    config.options.length;

  render();
});


/* -----------------------------
   SELECT A BLOCK
----------------------------- */

grid.addEventListener("click", (event) => {

  const card =
    event.target.closest(".picture-card");

  if (!card) return;


  grid
    .querySelector(".selected")
    ?.classList.remove("selected");

  card.classList.add("selected");


  const block =
    card.dataset.block;


  if (category === "upper") {

    selectedUpper.block = block;

  } else {

    selectedSoleplate.block = block;

  }


  /*
    Show/update color picker when
    a block is selected.
  */

  createColorPicker();

  updateReport();
});


/* -----------------------------
   START
----------------------------- */

createReport();

render();