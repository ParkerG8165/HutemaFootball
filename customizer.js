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

function render() {
  const option = config.options[current];
  const label = config.labels[current];

  name.textContent = option;

  grid.innerHTML = Array.from({ length: 9 }, (_, index) => `
    <button class="picture-card${index === 0 ? " selected" : ""}" type="button">
      <span>Picture link</span>
      <small>${option} · ${label}</small>
    </button>
  `).join("");
}

document.querySelector(".previous").addEventListener("click", () => {
  current = (current - 1 + config.options.length) % config.options.length;
  render();
});

document.querySelector(".next").addEventListener("click", () => {
  current = (current + 1) % config.options.length;
  render();
});

grid.addEventListener("click", (event) => {
  const card = event.target.closest(".picture-card");

  if (!card) return;

  grid.querySelector(".selected")?.classList.remove("selected");
  card.classList.add("selected");
});

render();