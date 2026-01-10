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
    filling,
  }) {
    let total = 0;

    const calc = (length, base, extra = 0) => {
      return fillingOption === "performance"
        ? ceiling((base * (length / 100) + extra * (length / 100)) * 2.2, 50)
        : ceiling(base * (length / 100) * 2.2, 50);
    };

    // Adjust lengths for L and U shapes
    let adjustedLength = lengthA;
    if (sofaTypeIndex === 2) adjustedLength = lengthA + lengthB - 100;
    else if (sofaTypeIndex === 3)
      adjustedLength = lengthA + lengthB + lengthC - 200;

    let base = 0,
      extra = 0;
    if (fillingOption === "classics") base = 1200;
    else if (fillingOption === "signature") base = 1400;
    else if (fillingOption === "performance") {
      base = 1050;
      extra = 7.5 * 75;
    }

    // Foam adjustment
    if (filling === "foam") {
      base -= 100;
    }

    total += calc(adjustedLength, base, extra);
    return total;
  }

  // --- Update mini prices ---
  function updateStep4Prices(totalLength, sofaIndex) {
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
        filling: selectedFilling,
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

    const totalPrice = calculateTotalPrice({
      lengthA,
      lengthB,
      lengthC,
      sofaTypeIndex: selectedSofaIndex,
      fillingOption: selectedFillingOptionLocal,
      filling: selectedFilling,
    });

    document.getElementById("price").textContent = totalPrice
      ? `${totalPrice.toLocaleString()} AED`
      : "AED —";

    document.getElementById("monthly").textContent = totalPrice
      ? `${(totalPrice / 4).toFixed(2)} AED/month (for 4 months)`
      : "AED —/month (for 4 months)";

    updateStep4Prices(
      lengthA + lengthB + lengthC,
      selectedSofaIndex,
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
      document
        .querySelectorAll(".options-4 .col")
        .forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      selectedFillingOption = card.dataset.value;
      updatePrice();
    });
  });

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
    if (sofaIndex >= 2) lengthText += `\n*Length B:* ${lengthB} cm`;
    if (sofaIndex === 3) lengthText += `\n*Length C:* ${lengthC} cm`;

    const priceText = document
      .getElementById("price")
      .textContent.replace(" AED", "");

    const message =
      `*New Estimate Request*\n\n` +
      `*Sofa Type:* ${sofaType}\n` +
      `*Sofa Filling:* ${filling}\n` +
      `*Sofa Fabric:* ${fillingOption}\n\n` +
      `*Sofa Length:*\n${lengthText}\n\n` +
      `*Estimated Price:* ${priceText} AED`;

    window.open(
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  });
});
