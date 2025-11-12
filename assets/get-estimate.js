document.addEventListener('DOMContentLoaded', function () {
      const lengthFields = document.querySelectorAll('#get-estimate .length-field');
      const sofaTypeRow = document.querySelector('#get-estimate .options-1');
      const fillingRow = document.querySelector('#get-estimate .options-3');
      const fillingOptionRow = document.querySelector('#get-estimate .options-4');

      let selectedFilling = document.querySelector('#get-estimate .options-3 .col')?.dataset.value || null;
      let selectedFillingOption = document.querySelector('#get-estimate .options-4 .col')?.dataset.value || null;

      function showLengthFields(count) {
        lengthFields.forEach((field, i) => {
          field.style.display = i < count ? 'block' : 'none';
        });
      }

      // Initial state
      showLengthFields(1);

      // --- Step 1: Sofa Type selection ---
      sofaTypeRow.querySelectorAll('.col').forEach((col) => {
        col.addEventListener('click', () => {
          sofaTypeRow.querySelectorAll('.col').forEach((c) => c.classList.remove('active'));
          col.classList.add('active');
          const index = parseInt(col.dataset.index);
          if (index === 1) showLengthFields(1);
          else if (index === 2) showLengthFields(2);
          else if (index === 3) showLengthFields(3);
          updatePrice();
        });
      });

      // --- Step 2: Length inputs ---
      const inputs = document.querySelectorAll(
        '#get-estimate #length-a, #get-estimate #length-b, #get-estimate #length-c'
      );
      inputs.forEach((input) => input.addEventListener('input', updatePrice));

      // --- Step 3: Sofa Filling ---
      fillingRow.querySelectorAll('.col').forEach((col) => {
        col.addEventListener('click', () => {
          fillingRow.querySelectorAll('.col').forEach((c) => c.classList.remove('active'));
          col.classList.add('active');
          selectedFilling = col.dataset.value;
          updatePrice();
        });
      });

      // Step 4 — Only one open at a time
      const fillingCards = document.querySelectorAll('.options-4 .col');

      fillingCards.forEach((card) => {
        card.addEventListener('click', () => {
          // Already active? Do nothing (radio behavior)
          if (card.classList.contains('active')) return;

          // Deactivate all
          fillingCards.forEach((c) => c.classList.remove('active'));

          // Activate clicked one
          card.classList.add('active');

          selectedFillingOption = card.dataset.value;

          updatePrice();
        });
      });

      // --- CEILING helper (round up to nearest multiple) ---
      function ceiling(value, significance) {
        return Math.ceil(value / significance) * significance;
      }

      function updateStep4Prices(totalLength, selectedFilling) {
        const L = totalLength / 100; // cm → meters
        const prices = document.querySelectorAll('.option-price');

        prices.forEach((priceEl) => {
          const option = priceEl.dataset.option;
          let base = 0;
          let result = 0;

          if (!option || totalLength === 0) {
            priceEl.textContent = `Dhs —`;
            return;
          }

          // Logic from updatePrice()
          if (option === 'classics') {
            base = selectedFilling === 'feather' ? 1200 : 1100;
            result = ceiling(base * L * 2.1, 50);
          } else if (option === 'signature') {
            base = selectedFilling === 'feather' ? 1400 : 1300;
            result = ceiling(base * L * 2.1, 50);
          } else if (option === 'performance') {
            base = selectedFilling === 'feather' ? 1050 : 950;
            result = ceiling((base * L + 7.5 * 75 * L) * 2.1, 50);
          }

          priceEl.textContent = `Dhs ${result.toLocaleString()}`;
        });
      }

      // --- Update price ---
      function updatePrice() {
        let totalLength = 0;
        lengthFields.forEach((field) => {
          if (field.style.display !== 'none') {
            const input = field.querySelector('input');
            totalLength += parseFloat(input.value) || 0;
          }
        });

        // Update Step 4 prices dynamically no matter what
        updateStep4Prices(totalLength, selectedFilling);

        // Only update the final price if everything is selected
        if (!selectedFillingOption || !selectedFilling || totalLength === 0) {
          document.getElementById('price').textContent = 'Price: Dhs. —';
          document.getElementById('monthly').textContent = 'AED —/month (for 4 months)';
          return;
        }

        let base = 0;
        const L = totalLength / 100;

        let result = 0;

        // SAME LOGIC as above
        if (selectedFillingOption === 'classics') {
          base = selectedFilling === 'feather' ? 1200 : 1100;
          result = ceiling(base * L * 2.1, 50);
        } else if (selectedFillingOption === 'signature') {
          base = selectedFilling === 'feather' ? 1400 : 1300;
          result = ceiling(base * L * 2.1, 50);
        } else if (selectedFillingOption === 'performance') {
          base = selectedFilling === 'feather' ? 1050 : 950;
          result = ceiling((base * L + 7.5 * 75 * L) * 2.1, 50);
        }

        // Update main display
        document.getElementById('price').textContent = `Price: Dhs. ${result.toLocaleString()}`;
        document.getElementById('monthly').textContent = `AED ${(result / 4).toFixed(2)}/month (for 4 months)`;
      }

      updatePrice();

      // --- SEND TO WHATSAPP ---
      document.getElementById('book-btn').addEventListener('click', function () {
        // ✅ Replace with your WhatsApp number (include country code, no +)
        const phoneNumber = '971509046848';

        // Get selected sofa type
        const sofaType = document.querySelector('.options-1 .col.active')?.dataset.value || 'Not selected';

        // Get selected filling
        const filling = document.querySelector('.options-3 .col.active')?.dataset.value || 'Not selected';

        // Get selected filling option
        const fillingOption = document.querySelector('.options-4 .col.active')?.dataset.value || 'Not selected';

        // Get lengths
        const lengthA = document.getElementById('length-a').value || '—';
        const lengthB = document.getElementById('length-b').value || '—';
        const lengthC = document.getElementById('length-c').value || '—';

        // Get price
        const priceText = document.getElementById('price').textContent.replace('Price: ', '');

        // Format WhatsApp message (URL encoded)
        const message =
          `*New Estimate Request*\n\n` +
          `*Sofa Type:* ${sofaType}\n` +
          `*Filling:* ${filling}\n` +
          `*Filling Option:* ${fillingOption}\n\n` +
          `*Length A:* ${lengthA} cm\n` +
          `*Length B:* ${lengthB} cm\n` +
          `*Length C:* ${lengthC} cm\n\n` +
          `*Estimated Price:* ${priceText}`;

        const encodedMessage = encodeURIComponent(message);

        // Open WhatsApp
        const waURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(waURL, '_blank');
      });
    });