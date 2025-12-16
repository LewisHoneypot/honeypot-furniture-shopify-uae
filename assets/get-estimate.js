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

    // Length A (default)
    if (lengthA > 0) {
      let base = 0,
        extra = 0;
      if (fillingOption === "classics") base = 1200;
      else if (fillingOption === "signature") base = 1400;
      else if (fillingOption === "performance") {
        base = 1050;
        extra = 7.5 * 75;
      }
      total += calc(lengthA, base, extra);
    }

    // Length B
    if (lengthB > 0) {
      let base = 0,
        extra = 0;
      if (fillingOption === "classics") base = 600;
      else if (fillingOption === "signature") base = 800;
      else if (fillingOption === "performance") {
        base = 500;
        extra = 5 * 75;
      }
      total += calc(lengthB, base, extra);
    }

    // Length C
    if (lengthC > 0) {
      let base = 0,
        extra = 0;
      if (fillingOption === "classics") base = 600;
      else if (fillingOption === "signature") base = 800;
      else if (fillingOption === "performance") {
        base = 500;
        extra = 5 * 75;
      }
      total += calc(lengthC, base, extra);
    }

    // Add footstool as extra length
    if (includeAddon && addonQty > 0) {
      for (let i = 0; i < addonQty; i++) {
        let base = 0,
          extra = 0;
        if (fillingOption === "classics") base = 600;
        else if (fillingOption === "signature") base = 800;
        else if (fillingOption === "performance") {
          base = 500;
          extra = 5 * 75;
        }
        total += calc(100, base, extra); // 100 cm per footstool
      }
    }

    return total;
  }

  // --- Update mini prices ---
  function updateStep4Prices(
    totalLength,
    fillingOption,
    sofaIndex,
    addonQty = 0
  ) {
    const prices = document.querySelectorAll(".option-price");
    prices.forEach((priceEl) => {
      const option = priceEl.dataset.option;
      if (!option || totalLength === 0) {
        priceEl.textContent = "AED —";
        return;
      }

      const miniPrice = calculateTotalPrice({
        lengthA:
          sofaIndex >= 1
            ? parseFloat(document.getElementById("length-a").value) || 0
            : 0,
        lengthB:
          sofaIndex >= 2
            ? parseFloat(document.getElementById("length-b").value) || 0
            : 0,
        lengthC:
          sofaIndex >= 3
            ? parseFloat(document.getElementById("length-c").value) || 0
            : 0,
        fillingOption: option,
        addonQty,
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
      lengthB: selectedSofaIndex >= 2 ? lengthB : 0,
      lengthC: selectedSofaIndex === 3 ? lengthC : 0,
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
      lengthA +
        (selectedSofaIndex >= 2 ? lengthB : 0) +
        (selectedSofaIndex === 3 ? lengthC : 0),
      selectedFillingOptionLocal,
      selectedSofaIndex,
      0 // footstools excluded in step 4 mini prices
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

    let addonInfo = "";
    if (addonCheckbox.checked) {
      const addonQty = parseInt(addonQtyInput.value) || 1;
      const addonPrice = addonUnitPrice * addonQty;
      addonInfo = `\n*Add-on:* ${addonQty} footstool${
        addonQty > 1 ? "s" : ""
      }`;
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
