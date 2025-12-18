document.addEventListener("DOMContentLoaded", function () {
  const lengthFields = document.querySelectorAll("#get-estimate .length-field");
  const dimensionImages = document.querySelectorAll(
    "#get-estimate .dimension-image"
  );

  const sofaTypeRow = document.querySelector("#get-estimate .options-1");
  const fillingRow = document.querySelector("#get-estimate .options-3");

  let selectedFilling =
    document.querySelector("#get-estimate .options-3 .col")?.dataset.value ||
    null;
  let selectedFillingOption =
    document.querySelector("#get-estimate .options-4 .col")?.dataset.value ||
    null;

  const addonCheckbox = document.getElementById("addon-checkbox");
  const addonQuantityWrapper = document.querySelector(".addon-quantity");
  const addonQtyInput = document.getElementById("addon-qty");
  const addonUnitPrice = 300; // AED per footstool

  // --- Helper functions ---
  function ceiling(value, significance) {
    return Math.ceil(value / significance) * significance;
  }

  function showLengthFields(count) {
    lengthFields.forEach((field, i) => {
      field.style.display = i < count ? "block" : "none";
    });
  }

  function updateDimensionImages(sofaIndex) {
    dimensionImages.forEach((wrapper) => {
      wrapper.querySelectorAll("img").forEach((img) => {
        img.classList.toggle(
          "active",
          img.dataset.type === sofaIndex.toString()
        );
      });
    });
  }

  // --- Incremental price calculation ---
  function calculateTotalPrice({
    lengthA = 0,
    lengthB = 0,
    lengthC = 0,
    sofaTypeIndex = 1,
    fillingOption,
    addonQty = 0,
    includeAddon = false,
  }) {
    let total = 0;

    const calc = (length, base, extra = 0) => {
      return fillingOption === "performance"
        ? ceiling((base * (length / 100) + extra * (length / 100)) * 2.2, 50)
        : ceiling(base * (length / 100) * 2.2, 50);
    };

    // Adjust lengths for L and U shapes
    let adjustedLength = lengthA;
    if (sofaTypeIndex === 2) adjustedLength = lengthA + lengthB - 100; // L-corner
    else if (sofaTypeIndex === 3) adjustedLength = lengthA + lengthB + lengthC - 200; // U-corner

    let base = 0,
      extra = 0;
    if (fillingOption === "classics") base = 1200;
    else if (fillingOption === "signature") base = 1400;
    else if (fillingOption === "performance") {
      base = 1050;
      extra = 7.5 * 75;
    }

    total += calc(adjustedLength, base, extra);

    // Add footstool as extra length
    if (includeAddon && addonQty > 0) {
      for (let i = 0; i < addonQty; i++) {
        let addonBase = 0,
          addonExtra = 0;
        if (fillingOption === "classics") addonBase = 600;
        else if (fillingOption === "signature") addonBase = 800;
        else if (fillingOption === "performance") {
          addonBase = 500;
          addonExtra = 5 * 75;
        }
        total += calc(100, addonBase, addonExtra); // 100 cm per footstool
      }
    }

    return total;
  }

  // --- Update mini prices ---
  function updateStep4Prices(totalLength, fillingOption, sofaIndex, addonQty = 0) {
    const prices = document.querySelectorAll(".option-price");
    prices.forEach((priceEl) => {
      const option = priceEl.dataset.option;
      if (!option || totalLength === 0) {
        priceEl.textContent = "AED —";
        return;
      }

      // Get individual lengths from inputs
      const lengthA = parseFloat(document.getElementById("length-a").value) || 0;
      const lengthB = parseFloat(document.getElementById("length-b").value) || 0;
      const lengthC = parseFloat(document.getElementById("length-c").value) || 0;

      const miniPrice = calculateTotalPrice({
        lengthA,
        lengthB,
        lengthC,
        sofaTypeIndex: sofaIndex,
        fillingOption: option,
        addonQty,
        includeAddon: false, // exclude footstools for mini prices
      });

      priceEl.textContent = `${miniPrice.toLocaleString()} AED`;
    });
  }

  // --- Update total price ---
  function updatePrice() {
    const selectedSofaIndex = parseInt(
      document.querySelector(".options-1 .col.active")?.dataset.index || 1
    );
    const selectedFillingOptionLocal =
      document.querySelector(".options-4 .col.active")?.dataset.value || null;

    const lengthA = parseFloat(document.getElementById("length-a").value) || 0;
    const lengthB = parseFloat(document.getElementById("length-b").value) || 0;
    const lengthC = parseFloat(document.getElementById("length-c").value) || 0;

    const addonQty = addonCheckbox.checked
      ? parseInt(addonQtyInput.value) || 1
      : 0;

    // Total price (includes footstools)
    const totalPrice = calculateTotalPrice({
      lengthA,
      lengthB,
      lengthC,
      sofaTypeIndex: selectedSofaIndex,
      fillingOption: selectedFillingOptionLocal,
      addonQty,
      includeAddon: addonCheckbox.checked,
    });

    document.getElementById("price").textContent = totalPrice
      ? `${totalPrice.toLocaleString()} AED`
      : "AED —";

    document.getElementById("monthly").textContent = totalPrice
      ? `${(totalPrice / 4).toFixed(2)} AED/month (for 4 months)`
      : "AED —/month (for 4 months)";

    // Step 4 mini prices (exclude footstools)
    updateStep4Prices(
      lengthA + lengthB + lengthC,
      selectedFillingOptionLocal,
      selectedSofaIndex,
      0
    );
  }

  // --- Step 1: Sofa Type selection ---
  sofaTypeRow.querySelectorAll(".col").forEach((col) => {
    col.addEventListener("click", () => {
      sofaTypeRow
        .querySelectorAll(".col")
        .forEach((c) => c.classList.remove("active"));
      col.classList.add("active");

      const index = parseInt(col.dataset.index);
      showLengthFields(index);
      updateDimensionImages(index);
      updatePrice();
    });
  });

  // --- Step 2: Length inputs ---
  document
    .querySelectorAll(
      "#get-estimate #length-a, #get-estimate #length-b, #get-estimate #length-c"
    )
    .forEach((input) => input.addEventListener("input", updatePrice));

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

  // --- Step 4: Filling Option ---
  document.querySelectorAll(".options-4 .col").forEach((card) => {
    card.addEventListener("click", () => {
      if (card.classList.contains("active")) return;
      document
        .querySelectorAll(".options-4 .col")
        .forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      selectedFillingOption = card.dataset.value;
      updatePrice();
    });
  });

  // --- Add-on Footstool ---
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
      // Allow empty input while typing
      if (addonQtyInput.value !== "" && parseInt(addonQtyInput.value) < 1) {
        addonQtyInput.value = 1;
      }
      updatePrice();
    });
  }

  // --- Initialize ---
  const initialSofaIndex = parseInt(
    document.querySelector(".options-1 .col.active")?.dataset.index || 1
  );
  updateDimensionImages(initialSofaIndex);
  updatePrice();

  // --- Send to WhatsApp ---
  document.getElementById("book-btn").addEventListener("click", function () {
    updatePrice(); // <- ensure current price is calculated
    const phoneNumber = "971509046848";

    const sofaCol = document.querySelector(".options-1 .col.active");
    const sofaType = sofaCol?.dataset.value || "Not selected";
    const sofaIndex = parseInt(sofaCol?.dataset.index || 1);

    const filling =
      document.querySelector(".options-3 .col.active")?.dataset.value ||
      "Not selected";
    const fillingOption =
      document.querySelector(".options-4 .col.active")?.dataset.value ||
      "Not selected";

    const lengthA = document.getElementById("length-a").value || "—";
    const lengthB = document.getElementById("length-b").value || "—";
    const lengthC = document.getElementById("length-c").value || "—";

    // Build length text based on sofa type
    let lengthText = `*Length A:* ${lengthA} cm`;

    if (sofaIndex >= 2) {
      lengthText += `\n*Length B:* ${lengthB} cm`;
    }

    if (sofaIndex === 3) {
      lengthText += `\n*Length C:* ${lengthC} cm`;
    }

    // Add-on info
    let addonInfo = "";

    if (addonCheckbox.checked) {
      const addonQty = parseInt(addonQtyInput.value) || 1;
      addonInfo = `\n\n*Ottoman:* ${addonQty}`;
    } else {
      addonInfo = `\n\n*Ottoman:* No`;
    }

    const priceText = document
      .getElementById("price")
      .textContent.replace(" AED", "");

    const sofaTypeLabels = {
      straight: "Straight",
      "l-corner": "L-Corner",
      "u-corner": "U-Corner",
    };

    const fillingLabels = {
      foam: "Foam",
      feather: "Feather",
    };

    const fabricLabels = {
      classics: "Classic",
      signature: "Signature",
      performance: "Performance",
    };

    const sofaTypeLabel = sofaTypeLabels[sofaType] || sofaType;
    const fillingLabel = fillingLabels[filling] || filling;
    const fabricLabel = fabricLabels[fillingOption] || fillingOption;

    const message =
      `*New Estimate Request*\n\n` +
      `*Sofa Type:* ${sofaTypeLabel}\n` +
      `*Sofa Filling:* ${fillingLabel}\n` +
      `*Sofa Fabric:* ${fabricLabel}\n` +
      `*Sofa Length:*\n\n` +
      `${lengthText}${addonInfo}\n\n` +
      `*Estimated Price:* ${priceText} AED`;

    const encodedMessage = encodeURIComponent(message);
    const waURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(waURL, "_blank");
  });
});
