
document.addEventListener('DOMContentLoaded', function () {
    const MAX_SWATCHES = 4;
    let selectedSwatches = JSON.parse(localStorage.getItem('fabricSwatches')) || [];

    // Initialize
    renderSelected();
    updateUI();

    /* SWATCH CLICK → CHANGE MAIN IMAGE + UPDATE BUTTON DATA */
    document.querySelectorAll('.fabric-card').forEach(card => {
        const mainImage = card.querySelector('.main-fabric-image');
        const addBtn = card.querySelector('.add-btn');

        card.querySelectorAll('.swatch-dot').forEach(dot => {
            dot.addEventListener('click', function () {
                // Change main image
                if (mainImage && mainImage.tagName === 'IMG') {
                    mainImage.src = this.dataset.img;
                }

                // Update add button data
                if (addBtn) {
                    addBtn.dataset.variantId = this.dataset.variantId;
                    if (this.dataset.thumb) {
                        addBtn.dataset.productImage = this.dataset.thumb;
                    }
                }

                // Highlight active swatch
                card.querySelectorAll('.swatch-dot').forEach(d => d.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Set first swatch as active by default
        const firstSwatch = card.querySelector('.swatch-dot');
        if (firstSwatch && addBtn && !addBtn.dataset.variantId) {
            addBtn.dataset.variantId = firstSwatch.dataset.variantId;
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
                    this.dataset.productImage || ''
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

    /* ORDER NOW BUTTON */
    document.querySelector('.order-btn')?.addEventListener('click', proceedToCheckout);

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
    function addSwatch(productId, productHandle, productTitle, variantId, productImage) {
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
            html += `
        <div class="selected-item" data-index="${index}">
          <img src="${item.image}" alt="${item.title}">
          <div>${item.title}</div>
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

    async function proceedToCheckout() {
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
        orderBtn.textContent = 'Processing...';
        orderBtn.disabled = true;

        try {
            // Add items **one by one** to cart
            for (const swatch of realSwatches) {
                const response = await fetch('/cart/add.js', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: swatch.variantId,
                        quantity: 1
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.description || 'Failed to add item to cart');
                }
            }

            // Clear swatches and update cart UI
            selectedSwatches = [];
            saveToLocalStorage();
            renderSelected();
            updateUI();

            // Refresh header cart/bubble if theme supports it
            if (window.theme && typeof window.theme.refreshCart === 'function') {
                window.theme.refreshCart();
            }

            // Redirect to checkout after a short delay to allow UI to update
            setTimeout(() => {
                window.location.href = '/checkout';
            }, 500);

        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('Error adding items to cart. Please try again.', 'error');
            orderBtn.textContent = originalText;
            orderBtn.disabled = false;
        }
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
