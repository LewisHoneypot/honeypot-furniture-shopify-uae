document.addEventListener("DOMContentLoaded", function () {
  const lengthFields = document.querySelectorAll("#get-estimate .length-field");
  const dimensionImages = document.querySelectorAll(
    "#get-estimate .dimension-image"
  );

  const sofaTypeRow = document.querySelector("#get-estimate .options-1");
  const fillingRow = document.querySelector("#get-estimate .options-3");
  const fillingOptionRow = document.querySelector("#get-estimate .options-4");

  let selectedFilling =
    document.querySelector("#get-estimate .options-3 .col")?.dataset.value ||
    null;
  let selectedFillingOption =
    document.querySelector("#get-estimate .options-4 .col")?.dataset.value ||
    null;

  function showLengthFields(count) {
    lengthFields.forEach((field, i) => {
      field.style.display = i < count ? "block" : "none";
    });
  }

  function updateDimensionImages(sofaIndex) {
    document
      .querySelectorAll("#get-estimate .dimension-image")
      .forEach((wrapper) => {
        const images = wrapper.querySelectorAll("img");
        images.forEach((img) => {
          img.classList.toggle(
            "active",
            img.dataset.type === sofaIndex.toString()
          );
        });
      });
  }

  // Initial state
  showLengthFields(1);

  // --- Step 1: Sofa Type selection ---
  sofaTypeRow.querySelectorAll(".col").forEach((col) => {
    col.addEventListener("click", () => {
      sofaTypeRow
        .querySelectorAll(".col")
        .forEach((c) => c.classList.remove("active"));
      col.classList.add("active");
      const index = parseInt(col.dataset.index);
      if (index === 1) showLengthFields(1);
      else if (index === 2) showLengthFields(2);
      else if (index === 3) showLengthFields(3);

      updateDimensionImages(index);
      updatePrice();
    });
  });

  // --- Step 2: Length inputs ---
  const inputs = document.querySelectorAll(
    "#get-estimate #length-a, #get-estimate #length-b, #get-estimate #length-c"
  );
  inputs.forEach((input) => input.addEventListener("input", updatePrice));

  // --- Step 3: Sofa Filling ---
  fillingRow.querySelectorAll(".col").forEach((col) => {
    col.addEventListener("click", () => {
      fillingRow
        .querySelectorAll(".col")
        .forEach((c) => c.classList.remove("active"));
      col.classList.add("active");
      selectedFilling = col.dataset.value;
      updatePrice();
    });
  });

  // --- Step 4: Filling Option (radio behavior) ---
  const fillingCards = document.querySelectorAll(".options-4 .col");
  fillingCards.forEach((card) => {
    card.addEventListener("click", () => {
      if (card.classList.contains("active")) return;
      fillingCards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      selectedFillingOption = card.dataset.value;
      updatePrice();
    });
  });

  // --- CEILING helper (round up to nearest multiple) ---
  function ceiling(value, significance) {
    return Math.ceil(value / significance) * significance;
  }

  // --- Step 4 mini prices ---
  function updateStep4Prices(totalLength) {
    const L = totalLength / 100; // cm → meters
    const prices = document.querySelectorAll(".option-price");

    prices.forEach((priceEl) => {
      const option = priceEl.dataset.option;
      let base = 0;
      let result = 0;

      if (!option || totalLength === 0) {
        priceEl.textContent = `AED —`;
        return;
      }

      // Always use the feather price
      if (option === "classics") base = 1200;
      else if (option === "signature") base = 1400;
      else if (option === "performance") base = 1050;

      result = ceiling(
        option === "performance"
          ? (base * L + 7.5 * 75 * L) * 2.2
          : base * L * 2.2,
        50
      );

      // Include add-on if selected
      if (addonCheckbox.checked) {
        const addonQty = parseInt(addonQtyInput.value) || 1;
        result += addonUnitPrice * addonQty;
      }

      priceEl.textContent = `${result.toLocaleString()} AED`;
    });
  }

  // --- Add-on price configuration ---
  const addonCheckbox = document.getElementById("addon-checkbox");
  const addonQuantityWrapper = document.querySelector(".addon-quantity");
  const addonQtyInput = document.getElementById("addon-qty");
  const addonUnitPrice = 300; // AED per footstool

  if (addonCheckbox && addonQuantityWrapper && addonQtyInput) {
    addonQuantityWrapper.style.display = "none";
    addonQtyInput.disabled = true;

    addonCheckbox.addEventListener("change", () => {
      const checked = addonCheckbox.checked;
      addonQuantityWrapper.style.display = checked ? "block" : "none";
      addonQtyInput.disabled = !checked;
      if (!checked) addonQtyInput.value = 1;
      updatePrice();
    });

    addonQtyInput.addEventListener("input", () => {
      if (addonQtyInput.value < 1) addonQtyInput.value = 1;
      updatePrice();
    });
  }

  // --- Update total price ---
  function updatePrice() {
    let totalLength = 0;
    lengthFields.forEach((field) => {
      if (field.style.display !== "none") {
        const input = field.querySelector("input");
        totalLength += parseFloat(input.value) || 0;
      }
    });

    updateStep4Prices(totalLength, selectedFilling);

    if (!selectedFillingOption || !selectedFilling || totalLength === 0) {
      document.getElementById("price").textContent = "AED —";
      document.getElementById("monthly").textContent =
        "AED —/month (for 4 months)";
      return;
    }

    let base = 0;
    const L = totalLength / 100;
    let result = 0;

    // Always use the feather price
    if (selectedFillingOption === "classics") base = 1200;
    else if (selectedFillingOption === "signature") base = 1400;
    else if (selectedFillingOption === "performance") base = 1050;

    result = ceiling(
      selectedFillingOption === "performance"
        ? (base * L + 7.5 * 75 * L) * 2.2
        : base * L * 2.2,
      50
    );

    // Add-on price
    if (addonCheckbox.checked) {
      const addonQty = parseInt(addonQtyInput.value) || 1;
      result += addonUnitPrice * addonQty;
    }

    document.getElementById(
      "price"
    ).textContent = `${result.toLocaleString()} AED`;
    document.getElementById("monthly").textContent = `${(result / 4).toFixed(
      2
    )} AED/month (for 4 months)`;
  }

  const initialSofaIndex =
    document.querySelector(".options-1 .col.active")?.dataset.index || 1;
  updateDimensionImages(parseInt(initialSofaIndex));
  updatePrice();

  // --- SEND TO WHATSAPP ---
  document.getElementById("book-btn").addEventListener("click", function () {
    const phoneNumber = "971509046848";

    const sofaType =
      document.querySelector(".options-1 .col.active")?.dataset.value ||
      "Not selected";
    const filling =
      document.querySelector(".options-3 .col.active")?.dataset.value ||
      "Not selected";
    const fillingOption =
      document.querySelector(".options-4 .col.active")?.dataset.value ||
      "Not selected";
    const lengthA = document.getElementById("length-a").value || "—";
    const lengthB = document.getElementById("length-b").value || "—";
    const lengthC = document.getElementById("length-c").value || "—";

    // Include add-on info
    let addonInfo = "";
    if (addonCheckbox.checked) {
      const addonQty = parseInt(addonQtyInput.value) || 1;
      const addonPrice = addonUnitPrice * addonQty;
      addonInfo = `\n*Add-on:* ${addonQty} footstool${
        addonQty > 1 ? "s" : ""
      } (AED ${addonPrice.toLocaleString()})`;
    }

    const priceText = document
      .getElementById("price")
      .textContent.replace("AED ", "");

    const message =
      `*New Estimate Request*\n\n` +
      `*Sofa Type:* ${sofaType}\n` +
      `*Filling:* ${filling}\n` +
      `*Filling Option:* ${fillingOption}\n\n` +
      `*Length A:* ${lengthA} cm\n` +
      `*Length B:* ${lengthB} cm\n` +
      `*Length C:* ${lengthC} cm${addonInfo}\n\n` +
      `*Estimated Price:* AED ${priceText}`;

    const encodedMessage = encodeURIComponent(message);
    const waURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(waURL, "_blank");
  });
});
