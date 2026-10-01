/* -------------------------
   CURRENT SELECTIONS
------------------------- */

let selectedUpper = "Not Selected";
let selectedSole = "Not Selected";

let upperColor = "#111111";
let soleColor = "#ffffff";


/* -------------------------
   UPPER / SOLE BUTTONS
------------------------- */

const optionButtons = document.querySelectorAll(".option-button");

optionButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        const type = button.dataset.type;
        const option = button.dataset.option;


        /* UPPER */

        if (type === "upper") {

            selectedUpper = option;

            // Remove selected class from other upper buttons
            document.querySelectorAll(
                '.option-button[data-type="upper"]'
            ).forEach(function(btn) {

                btn.classList.remove("selected");

            });

            // Select this button
            button.classList.add("selected");

            // Update report
            document.getElementById(
                "reportUpperBlock"
            ).textContent = selectedUpper;

        }


        /* SOLE */

        if (type === "sole") {

            selectedSole = option;

            // Remove selected class from other sole buttons
            document.querySelectorAll(
                '.option-button[data-type="sole"]'
            ).forEach(function(btn) {

                btn.classList.remove("selected");

            });

            // Select this button
            button.classList.add("selected");

            // Update report
            document.getElementById(
                "reportSole"
            ).textContent = selectedSole;

        }

        updateCombination();

    });

});


/* -------------------------
   UPPER COLOR
------------------------- */

const upperColorPicker =
    document.getElementById("upperColor");

upperColorPicker.addEventListener("input", function() {

    upperColor = upperColorPicker.value;

    // Change preview
    document.getElementById(
        "upperPreview"
    ).style.backgroundColor = upperColor;


    // Update color text
    document.getElementById(
        "upperColorValue"
    ).textContent = upperColor.toUpperCase();


    // Update report
    document.getElementById(
        "reportUpperColor"
    ).textContent = upperColor.toUpperCase();

});


/* -------------------------
   SOLE COLOR
------------------------- */

const soleColorPicker =
    document.getElementById("soleColor");

soleColorPicker.addEventListener("input", function() {

    soleColor = soleColorPicker.value;

    // Change preview
    document.getElementById(
        "solePreview"
    ).style.backgroundColor = soleColor;


    // Update color text
    document.getElementById(
        "soleColorValue"
    ).textContent = soleColor.toUpperCase();


    // Update report
    document.getElementById(
        "reportSoleColor"
    ).textContent = soleColor.toUpperCase();

});


/* -------------------------
   COMBINATION REPORT
------------------------- */

function updateCombination() {

    const combinationText =
        document.getElementById("combinationText");


    if (
        selectedUpper === "Not Selected" &&
        selectedSole === "Not Selected"
    ) {

        combinationText.textContent =
            "Select an upper and soleplate configuration.";

        return;
    }


    combinationText.textContent =
        upperColor.toUpperCase() +
        " " +
        selectedUpper +
        " upper with a " +
        soleColor.toUpperCase() +
        " " +
        selectedSole +
        " soleplate.";

}


/* -------------------------
   INITIAL PREVIEW
------------------------- */

document.getElementById(
    "upperPreview"
).style.backgroundColor = upperColor;

document.getElementById(
    "solePreview"
).style.backgroundColor = soleColor;