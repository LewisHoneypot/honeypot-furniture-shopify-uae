document.addEventListener('DOMContentLoaded', function () {
    const MAX_SWATCHES = 4;
    let selectedSwatches = JSON.parse(localStorage.getItem('fabricSwatches')) || [];

    // MIGRATION: Add colorName to legacy swatches that don't have it
    let needsMigration = false;
    selectedSwatches = selectedSwatches.map(swatch => {
        if (!swatch.colorName && swatch.image) {
            // Extract color name from image URL
            const imageName = swatch.image.split('/').pop().split('?')[0];
            const colorName = imageName.split('_')[0].split('.')[0];
            needsMigration = true;
            return { ...swatch, colorName: colorName };
        }
        return swatch;
    });

    // Save migrated data back to localStorage
    if (needsMigration) {
        localStorage.setItem('fabricSwatches', JSON.stringify(selectedSwatches));
        console.log('✅ Migrated legacy swatches with colorName');
    }

    // Initialize
    renderSelected();
    updateUI();

    /* SWATCH CLICK → CHANGE MAIN IMAGE + UPDATE BUTTON DATA */
    document.querySelectorAll('.fabric-card').forEach(card => {
        const mainImage = card.querySelector('.main-fabric-image');
        const addBtn = card.querySelector('.add-btn');

        card.querySelectorAll('.swatch-dot').forEach(dot => {
            dot.addEventListener('click', function () {
                const altText = (this.getAttribute('data-alt') || '').trim();
                const thumbUrl = this.getAttribute('data-thumb') || this.dataset.thumb;
                const imgUrl = this.getAttribute('data-img') || this.dataset.img;

                // Extract image filename from URL
                const imageName = imgUrl ? imgUrl.split('/').pop().split('?')[0] : 'N/A';

                // Extract color/variant name from filename (e.g., "02-River" from "02-River_600x600_crop_center.jpg")
                const colorName = imageName.split('_')[0].split('.')[0];

                console.log('=== Swatch Clicked ===');
                console.log('Image Alt Text:', altText);
                console.log('Image Name:', imageName);
                console.log('Color Name:', colorName);
                console.log('======================');

                // Change main image
                if (mainImage && mainImage.tagName === 'IMG') {
                    const titleEl = card.querySelector('.fabric-title');
                    const baseTitle = titleEl ? (titleEl.getAttribute('data-base-title') || '').trim() : '';

                    // Use color name from filename for title
                    const fullTitle = colorName ? `${baseTitle}-${colorName}` : baseTitle;

                    mainImage.src = imgUrl;
                    mainImage.alt = fullTitle;
                    mainImage.title = fullTitle;

                    if (titleEl) {
                        titleEl.textContent = fullTitle;
                    }
                }

                // Update add button data - Extract color name from MAIN IMAGE
                if (addBtn) {
                    // Extract color name from the MAIN image that was just set
                    const mainImageSrc = mainImage && mainImage.tagName === 'IMG' ? mainImage.src : imgUrl;
                    const mainImageName = mainImageSrc ? mainImageSrc.split('/').pop().split('?')[0] : '';
                    const mainColorName = mainImageName.split('_')[0].split('.')[0];

                    addBtn.dataset.variantId = this.dataset.variantId || this.getAttribute('data-variant-id');
                    addBtn.dataset.altName = altText;
                    addBtn.dataset.colorName = mainColorName; // Use main image's color name
                    if (this.dataset.thumb || this.getAttribute('data-thumb')) {
                        addBtn.dataset.productImage = this.dataset.thumb || this.getAttribute('data-thumb');
                    }
                }

                // Highlight active swatch
                card.querySelectorAll('.swatch-dot').forEach(d => d.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Set first swatch as active by default and extract its color name
        const firstSwatch = card.querySelector('.swatch-dot');
        if (firstSwatch && addBtn && !addBtn.dataset.variantId) {
            const imgUrl = firstSwatch.getAttribute('data-img') || firstSwatch.dataset.img;
            const imageName = imgUrl ? imgUrl.split('/').pop().split('?')[0] : '';
            const colorName = imageName.split('_')[0].split('.')[0];

            addBtn.dataset.variantId = firstSwatch.dataset.variantId;
            addBtn.dataset.colorName = colorName;
            if (firstSwatch.dataset.thumb) {
                addBtn.dataset.productImage = firstSwatch.dataset.thumb;
            }
        }
    });

    /* MORE INFO BUTTON CLICK */
    document.querySelectorAll('.more-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            if (this.dataset.demo === 'true') {
                showDemoPopup(this);
            } else {
                showProductPopup(
                    this.dataset.productHandle,
                    this.dataset.productTitle,
                    this.dataset.productId
                );
            }
        });
    });

    /* ADD SWATCH BUTTON CLICK */
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            if (this.dataset.demo === 'true') {
                addDemoSwatch(this);
            } else {
                addSwatch(
                    this.dataset.productId,
                    this.dataset.productHandle,
                    this.dataset.productTitle,
                    this.dataset.variantId,
                    this.dataset.productImage || '',
                    this.dataset.colorName || ''
                );
            }
        });
    });

    /* POPUP CLOSE EVENTS */
    document.querySelector('.close-popup')?.addEventListener('click', closePopup);
    document.querySelector('.popup-overlay')?.addEventListener('click', closePopup);

    // Escape key to close popup
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePopup();
        }
    });

    /* ORDER NOW BUTTON - WhatsApp Redirect */
    document.querySelector('.order-btn')?.addEventListener('click', sendToWhatsApp);

    /* SHOW PRODUCT POPUP */
    async function showProductPopup(productHandle, productTitle, productId) {
        try {
            const response = await fetch(`/products/${productHandle}.js`);
            const product = await response.json();

            updatePopupContent(product);
            openPopup();
        } catch (error) {
            console.error('Error loading product:', error);
            showErrorPopup(productTitle);
        }
    }

    /* SHOW DEMO POPUP */
    function showDemoPopup(button) {
        const fabricCard = button.closest('.fabric-card');
        const productTitle = fabricCard.querySelector('.fabric-title').textContent;
        const fabricType = button.dataset.fabricType || '';

        const demoProduct = {
            title: productTitle,
            featured_image: getDemoImage(productTitle),
            variants: [
                { id: 'demo-1', title: getColorFromTitle(productTitle), available: true },
                { id: 'demo-2', title: 'Alternative Color', available: true }
            ]
        };

        updatePopupContent(demoProduct, fabricType);
        openPopup();
    }

    /* UPDATE POPUP CONTENT */
    function updatePopupContent(product, fabricType = '') {
        // Set product title
        document.getElementById('popup-product-title').textContent = product.title;

        // Set product image
        const imageElement = document.getElementById('popup-product-image');
        if (product.featured_image) {
            imageElement.src = typeof product.featured_image === 'string'
                ? product.featured_image
                : product.featured_image.src;
            imageElement.alt = product.title;
        }

        // Set swatches under title
        const swatchesContainer = document.getElementById('popup-swatches');
        swatchesContainer.innerHTML = '';

        // Get swatches from the card (same as on main page)
        const card = document.querySelector(`.fabric-card[data-product-handle="${product.handle}"]`);
        if (card) {
            const cardSwatches = card.querySelectorAll('.swatch-dot');
            cardSwatches.forEach((dot, index) => {
                const swatch = document.createElement('div');
                swatch.className = 'popup-swatch' + (index === 0 ? ' active' : '');
                swatch.style.backgroundImage = dot.style.backgroundImage;
                swatch.dataset.variantId = dot.dataset.variantId;
                swatch.dataset.img = dot.dataset.img;

                swatch.addEventListener('click', function () {
                    // Remove active class from all swatches
                    swatchesContainer.querySelectorAll('.popup-swatch').forEach(s => {
                        s.classList.remove('active');
                    });

                    // Add active class to clicked swatch
                    this.classList.add('active');

                    // Update main image
                    if (imageElement) {
                        imageElement.src = dot.dataset.img;
                    }
                });

                swatchesContainer.appendChild(swatch);
            });
        } else {
            // Fallback if card not found
            if (product.variants && product.variants.length > 0) {
                product.variants.forEach((variant, index) => {
                    if (variant.available) {
                        const swatch = document.createElement('div');
                        swatch.className = 'popup-swatch' + (index === 0 ? ' active' : '');
                        swatch.title = variant.title;
                        swatch.dataset.variantId = variant.id;

                        // Set background color or image
                        const color = getColorFromVariantTitle(variant.title);
                        if (variant.image) {
                            const imageUrl = typeof variant.image === 'string' ? variant.image : variant.image.src;
                            swatch.style.backgroundImage = `url('${imageUrl}')`;
                            swatch.dataset.img = imageUrl;
                        } else {
                            swatch.style.backgroundColor = color;
                        }

                        swatchesContainer.appendChild(swatch);
                    }
                });
            }
        }

        // Set material info from metafield or default
        updateMaterialInfo(product);

        // Set features from metafield
        updateFeatures(product);

        // Update Add Swatch button
        const addBtn = document.getElementById('popup-add-btn');
        addBtn.onclick = () => {
            const activeSwatch = swatchesContainer.querySelector('.popup-swatch.active');
            let variantId = '';
            let imageUrl = imageElement.src;

            if (activeSwatch && activeSwatch.dataset.variantId) {
                variantId = activeSwatch.dataset.variantId;
                if (activeSwatch.dataset.img) {
                    imageUrl = activeSwatch.dataset.img;
                }
            } else if (product.variants && product.variants[0]) {
                variantId = product.variants[0].id;
            }

            addSwatch(
                product.id || 'demo-' + Date.now(),
                product.handle || '',
                product.title,
                variantId,
                imageUrl
            );

            closePopup();
        };
    }

    /* UPDATE MATERIAL INFO */
    function updateMaterialInfo(product) {
        const materialContainer = document.getElementById('popup-material-info');

        // Try to get material from metafield first
        let materialText = '';

        // If product has metafields, try to get custom material info
        if (product.metafields && product.metafields.custom) {
            // You can add specific metafield logic here
            materialText = product.metafields.custom.material_info || '';
        }

        // Fallback to default material based on product title
        if (!materialText) {
            materialText = getDefaultMaterial(product.title);
        }

        if (materialText) {
            materialContainer.innerHTML = `<p>${materialText}</p>`;
            materialContainer.style.display = 'block';
        } else {
            materialContainer.style.display = 'none';
        }
    }

    /* UPDATE FEATURES FROM METAFIELD */
    function updateFeatures(product) {
        const featuresContainer = document.getElementById('popup-features-grid');
        featuresContainer.innerHTML = '';

        let features = [];

        const card = document.querySelector(
            `.fabric-card[data-product-handle="${product.handle}"]`
        );

        if (card && card.dataset.features) {
            try {
                features = JSON.parse(card.dataset.features);
            } catch (e) {
                console.error('Invalid feature JSON', e);
            }
        }

        if (!Array.isArray(features) || features.length === 0) {
            features = getDefaultFeatures(product.title);
        }

        features.forEach(feature => {
            const featureItem = document.createElement('div');
            featureItem.className = 'popup-feature-item';

            featureItem.innerHTML = `
      <span class="popup-feature-check">✓</span>
      <span class="popup-feature-text">${feature}</span>
    `;

            featuresContainer.appendChild(featureItem);
        });
    }

    /* ADD SWATCH */
    function addSwatch(productId, productHandle, productTitle, variantId, productImage, colorName = '') {
        if (selectedSwatches.length >= MAX_SWATCHES) {
            showNotification(`Maximum ${MAX_SWATCHES} swatches allowed. Please remove some before adding more.`, 'error');
            return;
        }

        // Check if already added
        const alreadyAdded = selectedSwatches.some(sw =>
            sw.variantId === variantId ||
            (sw.productId === productId && sw.variantId === variantId)
        );

        if (alreadyAdded) {
            showNotification('This swatch is already in your selection.', 'error');
            return;
        }

        const swatchData = {
            id: Date.now(),
            productId: productId,
            productHandle: productHandle,
            variantId: variantId,
            title: productTitle,
            colorName: colorName,
            image: productImage || getDemoImage(productTitle),
            addedAt: new Date().toISOString()
        };

        selectedSwatches.push(swatchData);
        saveToLocalStorage();
        renderSelected();
        updateUI();
        showNotification('Swatch added successfully!');
    }

    /* ADD DEMO SWATCH */
    function addDemoSwatch(button) {
        const fabricCard = button.closest('.fabric-card');
        const productTitle = fabricCard.querySelector('.fabric-title').textContent;

        addSwatch(
            'demo-' + Date.now(),
            '',
            productTitle,
            'demo-variant',
            getDemoImage(productTitle)
        );
    }

    /* RENDER SELECTED SWATCHES */
    function renderSelected() {
        const container = document.getElementById('selected');

        if (selectedSwatches.length === 0) {
            // Hide "No swatches selected yet" message on mobile
            if (window.innerWidth <= 900) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = `
        <div style="text-align: center; color: #999; font-style: italic; padding: 40px 0;">
          No swatches selected yet
        </div>
      `;
            return;
        }

        let html = '';
        selectedSwatches.forEach((item, index) => {
            // Fallback: Extract colorName from image URL if missing
            let colorName = item.colorName;
            if (!colorName && item.image) {
                const imageName = item.image.split('/').pop().split('?')[0];
                colorName = imageName.split('_')[0].split('.')[0];
            }

            html += `
        <div class="selected-item" data-index="${index}">
          <img src="${item.image}" alt="${item.title}">
          <div class="item-info">
            <div class="title">${item.title}</div>
            ${colorName ? `<div class="color-name">${colorName}</div>` : ''}
          </div>
          <div class="remove" onclick="window.removeSwatch(${index})">×</div>
        </div>
      `;
        });

        container.innerHTML = html;
    }

    /* REMOVE SWATCH - Make it globally accessible */
    window.removeSwatch = function (index) {
        selectedSwatches.splice(index, 1);
        saveToLocalStorage();
        renderSelected();
        updateUI();
        showNotification('Swatch removed');
    };

    /* UPDATE UI */
    function updateUI() {
        const count = selectedSwatches.length;
        const remaining = MAX_SWATCHES - count;

        // Update counters
        document.getElementById('count').textContent = count;
        document.getElementById('remain').textContent = remaining;
        document.getElementById('remaining-text').textContent = remaining;

        // Update order button
        const orderBtn = document.querySelector('.order-btn');
        if (orderBtn) {
            orderBtn.disabled = count === 0;
            orderBtn.style.display = count > 0 ? 'block' : 'none';
        }
    }

    /* SAVE TO LOCAL STORAGE */
    function saveToLocalStorage() {
        localStorage.setItem('fabricSwatches', JSON.stringify(selectedSwatches));
    }

    /* SEND TO WHATSAPP FUNCTION */
    function sendToWhatsApp() {
        if (selectedSwatches.length === 0) {
            showNotification('Please add at least one swatch before ordering.', 'error');
            return;
        }

        // Filter out demo items
        const realSwatches = selectedSwatches.filter(swatch =>
            !swatch.productId.startsWith('demo-') &&
            !swatch.variantId.startsWith('demo-')
        );

        if (realSwatches.length === 0) {
            showNotification('Demo swatches cannot be ordered. Please add real products from your collections.', 'error');
            return;
        }

        const orderBtn = document.querySelector('.order-btn');
        const originalText = orderBtn.textContent;
        orderBtn.textContent = 'Preparing WhatsApp...';
        orderBtn.disabled = true;

        try {
            const whatsappMessage = createWhatsAppMessage(realSwatches);

            const encodedMessage = encodeURIComponent(whatsappMessage);

            const phoneNumber = '+971509046848';

            const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

            setTimeout(() => {
                window.open(whatsappURL, '_blank');

                setTimeout(() => {
                    orderBtn.textContent = originalText;
                    orderBtn.disabled = false;

                    selectedSwatches = [];
                    saveToLocalStorage();
                    renderSelected();
                    updateUI();

                    showNotification('Message prepared for WhatsApp!');
                }, 1000);
            }, 500);

        } catch (error) {
            console.error('Error creating WhatsApp message:', error);
            showNotification('Error preparing WhatsApp message. Please try again.', 'error');
            orderBtn.textContent = originalText;
            orderBtn.disabled = false;
        }
    }

    /* CREATE WHATSAPP MESSAGE */
    function createWhatsAppMessage(swatches) {
        // Website URL
        const websiteURL = window.location.origin;

        // Current date
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Create message header
        let message = `🎯 *FABRIC SWATCHES ORDER REQUEST* 🎯\n`;
        message += `📅 Date: ${currentDate}\n`;
        message += `🌐 Website: ${websiteURL}\n`;
        message += `================================\n\n`;

        // Add swatch details
        message += `📋 *Selected Swatches (${swatches.length} items):*\n\n`;

        swatches.forEach((swatch, index) => {
            message += `${index + 1}. *${swatch.title}*\n`;
            if (swatch.colorName) {
                message += `   🎨 Color: ${swatch.colorName}\n`;
            }
            message += `   🔗 Product ID: ${swatch.productId}\n`;
            message += `   🔗 Variant ID: ${swatch.variantId}\n`;
            message += `   📸 Image: ${swatch.image}\n`;
            message += `\n`;
        });

        // Add customer information request
        message += `================================\n\n`;
        message += `👤 *PLEASE PROVIDE YOUR DETAILS:*\n\n`;
        message += `1. Full Name:\n`;
        message += `2. Phone Number:\n`;
        message += `3. Shipping Address:\n`;
        message += `4. City:\n`;
        message += `5. Postal Code:\n`;
        message += `6. Any Special Instructions:\n`;

        // Add footer
        message += `\n================================\n`;
        message += `📦 *Free Swatches Order*\n`;
        message += `🚚 Delivery: 7-10 working days\n`;
        message += `💰 Total: FREE\n`;
        message += `\nThank you! We'll process your order shortly. 🙏`;

        return message;
    }

    /* HELPER FUNCTIONS */
    function getDemoImage(title) {
        const fabricTypes = {
            'Naturama': 'https://placehold.co/400x400/87CEEB/FFFFFF?text=Naturama',
            'Wisdom': 'https://placehold.co/400x400/483C32/FFFFFF?text=Wisdom',
            'Sand': 'https://placehold.co/400x400/C2B280/FFFFFF?text=Sand',
            'Natural': 'https://placehold.co/400x400/F5F5DC/333333?text=Natural',
            'Flake': 'https://placehold.co/400x400/F0F0F0/333333?text=Flake',
            'Mist': 'https://placehold.co/400x400/E6E6FA/333333?text=Mist',
            'Truffel': 'https://placehold.co/400x400/A0522D/FFFFFF?text=Truffel',
            'Fresco': 'https://placehold.co/400x400/D4AF37/FFFFFF?text=Fresco'
        };

        for (const [key, image] of Object.entries(fabricTypes)) {
            if (title.includes(key)) {
                return image;
            }
        }

        return 'https://placehold.co/400x400/CCCCCC/333333?text=Fabric+Swatch';
    }

    function getColorFromVariantTitle(title) {
        const colorMap = {
            'sky': '#87CEEB',
            'taupe': '#483C32',
            'sand': '#C2B280',
            'natural': '#F5F5DC',
            'flake': '#F0F0F0',
            'mist': '#E6E6FA',
            'truffel': '#A0522D',
            'fresco': '#D4AF37'
        };

        const lowerTitle = title.toLowerCase();
        for (const [key, color] of Object.entries(colorMap)) {
            if (lowerTitle.includes(key)) {
                return color;
            }
        }

        return '#CCCCCC';
    }

    function getColorFromTitle(title) {
        const colorMap = {
            'sky': 'Sky Blue',
            'taupe': 'Taupe',
            'sand': 'Sand',
            'natural': 'Natural',
            'flake': 'Flake White',
            'mist': 'Mist Gray',
            'truffel': 'Truffel Brown',
            'fresco': 'Fresco Gold'
        };

        const lowerTitle = title.toLowerCase();
        for (const [key, color] of Object.entries(colorMap)) {
            if (lowerTitle.includes(key)) {
                return color;
            }
        }

        return 'Default';
    }

    function getDefaultMaterial(productTitle) {
        const lowerTitle = productTitle.toLowerCase();

        if (lowerTitle.includes('naturama') || lowerTitle.includes('wisdom')) {
            return 'Recycled Polyester & Organic Cotton';
        } else if (lowerTitle.includes('sand') || lowerTitle.includes('natural')) {
            return '100% Organic Cotton';
        } else if (lowerTitle.includes('flake') || lowerTitle.includes('mist')) {
            return 'Premium Chenille Blend';
        } else if (lowerTitle.includes('truffel') || lowerTitle.includes('fresco')) {
            return 'Suede Fabric with Microfiber';
        } else {
            return '';
        }
    }

    function getDefaultFeatures(productTitle) {
        // Default features if metafield is not available
        return [
            'Water Repellant',
            'Moisture Barrier',
            'Stain Resistant',
            'Eco Friendly',
            'Fire Retardant',
            'Easy Clean'
        ];
    }

    function showErrorPopup(productTitle) {
        document.getElementById('popup-product-title').textContent = productTitle;
        openPopup();
    }

    function openPopup() {
        document.getElementById('more-info-popup').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closePopup() {
        document.getElementById('more-info-popup').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function showNotification(message, type = 'success') {
        // Remove existing notification
        const existingNotification = document.querySelector('.success-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        if (type === 'error') {
            notification.classList.add('error');
        }
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
    document.head.appendChild(style);
});