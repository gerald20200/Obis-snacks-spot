document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const accordionPanels = document.querySelectorAll('.accordion-panel');
  const yearSpan = document.getElementById('year');
  const cards = document.querySelectorAll('.food-card');
  const categoryButtons = document.querySelectorAll('.filter-btn');
  const menuSearchInput = document.getElementById('menuSearch');
  const menuSearchBtn = document.getElementById('menuSearchBtn');
  const noResultsMessage = document.getElementById('noResultsMessage');
  const checkoutForm = document.getElementById('checkoutForm');
  const cartList = document.getElementById('cartList');
  const cartTotal = document.getElementById('cartTotal');
  const cart = [];
  const summary = document.createElement('div');
  const quickOrderButtons = document.querySelectorAll('.quick-order-btn');
  const modal = document.getElementById('foodModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');
  const modalPrice = document.getElementById('modalPrice');
  const modalMainImage = document.getElementById('modalMainImage');
  const thumbnailRow = document.getElementById('thumbnailRow');
  const modalQuantity = document.getElementById('modalQuantity');
  const modalClose = document.querySelector('.modal-close');
  const modalOrderBtn = document.querySelector('.modal-order-btn');

  const foodData = {
    'Chicken Burger': {
      price: '₦2,500',
      description: 'A juicy grilled chicken burger stacked with fresh lettuce, tomato, and sauce.',
      images: [
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=900&q=80'
      ]
    },
    'Shawarma': {
      price: '₦2,000',
      description: 'A loaded shawarma wrap with seasoned meat, crunchy vegetables, and creamy sauce.',
      images: [
        'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1615870216519-2f4d2f7d18f1?auto=format&fit=crop&w=900&q=80'
      ]
    },
    'Meat Pie': {
      price: '₦1,000',
      description: 'A golden flaky pastry filled with savory minced meat and rich spices.',
      images: [
        'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80'
      ]
    },
    'Jollof Rice & Chicken': {
      price: '₦3,000',
      description: 'A classic Nigerian jollof rice plate paired with juicy chicken and pepper sauce.',
      images: [
        'https://dodptt9f4zk9h.cloudfront.net/stores/139851/products/5190c507d7660dcc6a6db675eade7063e257f946.jpeg',
        'https://dodptt9f4zk9h.cloudfront.net/stores/139851/products/5190c507d7660dcc6a6db675eade7063e257f946.jpeg',
        'https://dodptt9f4zk9h.cloudfront.net/stores/139851/products/5190c507d7660dcc6a6db675eade7063e257f946.jpeg'
      ]
    },
    'French Fries': {
      price: '₦1,500',
      description: 'Crispy golden fries served hot with a side of ketchup and seasoning.',
      images: [
        'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=900&q=80'
      ]
    },
    'Cold Drink': {
      price: '₦800',
      description: 'Chilled soft drinks in refreshing flavors for a cool, satisfying sip.',
      images: [
        'https://images.unsplash.com/photo-1622483767028-3f66f2b7420a?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80'
      ]
    },
    'Fresh Fruit Juice': {
      price: '₦1,200',
      description: 'Freshly blended fruit juice with natural sweetness and a cold finish.',
      images: [
        'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=900&q=80'
      ]
    },
    'Coca-Cola': {
      price: '₦700',
      description: 'Classic chilled cola served ice-cold and fizzy.',
      images: [
        'https://images.unsplash.com/photo-1622483767028-3f66f2b7420a?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1554866585-cd63d2c27d69?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1532634922-b3e0b7a3d9d3?auto=format&fit=crop&w=900&q=80'
      ]
    },
    'Lemonade': {
      price: '₦900',
      description: 'Freshly squeezed lemon drink with a sweet citrus kick.',
      images: [
        'https://images.unsplash.com/photo-1513558161293-cdaf765ed2e6?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80'
      ]
    },
    'Red Wine': {
      price: '₦4,500',
      description: 'Bold and smooth red wine that pairs perfectly with a relaxed evening.',
      images: [
        'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1532634922-b3e0b7a3d9d3?auto=format&fit=crop&w=900&q=80'
      ]
    }
  };

  const formatMoney = (value) => `₦${Number(value).toLocaleString('en-NG')}`;
  const parseMoney = (value) => Number(String(value).replace(/[^\d]/g, '')) || 0;

  const jollofOptions = [
    { label: 'Salad', price: 300, image: 'http://www.allnigerianrecipes.com/images/coleslaw.jpg' },
    { label: 'Plantain', price: 500, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80' },
    { label: 'Fried Rice', price: 700, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80' }
  ];

  let selectedMealOptions = [];
  let selectedQuantity = 1;

  const updateQuantityDisplay = () => {
    if (modalQuantity) {
      modalQuantity.textContent = String(selectedQuantity);
    }
  };

  summary.className = 'order-summary';
  summary.innerHTML = '<p><strong>Selected:</strong> Nothing yet</p><button type="button" class="summary-btn">Place Order</button>';

  const menuSection = document.querySelector('.menu-section');
  if (menuSection) {
    menuSection.appendChild(summary);
  }

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const renderCart = () => {
    if (!cartList || !cartTotal) return;

    if (cart.length === 0) {
      cartList.innerHTML = '<li class="empty-cart">Your cart is empty.</li>';
      cartTotal.textContent = '₦0';
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartList.innerHTML = cart.map((item) => `
      <li>
        <span>${item.name} x${item.quantity}</span>
        <strong>${formatMoney(item.price * item.quantity)}</strong>
      </li>
    `).join('');
    cartTotal.textContent = formatMoney(total);
  };

  const updateSummary = () => {
    const summaryText = summary.querySelector('p');
    if (!summaryText) return;

    if (cart.length === 0) {
      summaryText.innerHTML = '<strong>Selected:</strong> Nothing yet';
      return;
    }

    const names = cart.map((item) => `${item.name} x${item.quantity}`).join(', ');
    summaryText.innerHTML = `<strong>Selected:</strong> ${names}`;
  };

  const renderMealOptions = (name) => {
    const extrasContainer = document.getElementById('modalExtras');
    if (!extrasContainer) return;

    if (name !== 'Jollof Rice & Chicken') {
      extrasContainer.innerHTML = '';
      if (!thumbnailRow) return;

      thumbnailRow.innerHTML = '';
      const item = foodData[name];
      if (item) {
        item.images.forEach((image, index) => {
          const thumb = document.createElement('img');
          thumb.src = image;
          thumb.alt = `${name} view ${index + 1}`;
          thumb.className = `thumbnail ${index === 0 ? 'active' : ''}`;
          thumb.addEventListener('click', () => {
            modalMainImage.src = image;
            modalMainImage.alt = `${name} view ${index + 1}`;
            thumbnailRow.querySelectorAll('.thumbnail').forEach((thumbImage) => thumbImage.classList.remove('active'));
            thumb.classList.add('active');
          });
          thumbnailRow.appendChild(thumb);
        });
      }
      return;
    }

    selectedMealOptions = [];
    const basePrice = parseMoney(foodData[name].price);
    const updateJollofSelection = () => {
      const totalExtra = selectedMealOptions.reduce((sum, label) => {
        const option = jollofOptions.find((entry) => entry.label === label);
        return sum + (option ? option.price : 0);
      }, 0);

      const optionText = selectedMealOptions.length ? selectedMealOptions.join(', ') : 'pepper sauce';
      modalDescription.textContent = selectedMealOptions.length
        ? `A classic Nigerian jollof rice plate paired with juicy chicken and ${optionText.toLowerCase()}.`
        : 'A classic Nigerian jollof rice plate paired with juicy chicken and pepper sauce.';
      modalPrice.textContent = formatMoney(basePrice + totalExtra);
      modalMainImage.src = foodData[name].images[0];
      modalMainImage.alt = name;

      extrasContainer.querySelectorAll('.meal-option').forEach((item) => {
        item.classList.toggle('selected', selectedMealOptions.includes(item.dataset.option));
      });

      thumbnailRow.querySelectorAll('.jollof-option-card').forEach((card) => {
        const optionLabel = card.dataset.option;
        const isActive = optionLabel === 'main' ? selectedMealOptions.length === 0 : selectedMealOptions.includes(optionLabel);
        card.classList.toggle('active', isActive);
      });

      thumbnailRow.querySelectorAll('.thumbnail').forEach((image) => {
        const optionLabel = image.dataset.option;
        const isActive = optionLabel === 'main' ? selectedMealOptions.length === 0 : selectedMealOptions.includes(optionLabel);
        image.classList.toggle('active', isActive);
      });
    };

    extrasContainer.innerHTML = jollofOptions.map((option) => {
      const isSelected = selectedMealOptions.includes(option.label);
      return `
        <button type="button" class="meal-option ${isSelected ? 'selected' : ''}" data-option="${option.label}">
          ${option.label} <span>+ ${formatMoney(option.price)}</span>
        </button>
      `;
    }).join('');

    const jollofMainImage = foodData[name].images[0];
    thumbnailRow.innerHTML = `
      <div class="jollof-option-card ${selectedMealOptions.length === 0 ? 'active' : ''}" data-option="main">
        <img src="${jollofMainImage}" alt="${name}" class="thumbnail active" data-option="main">
        <span class="jollof-option-name">Main plate</span>
      </div>
      ${jollofOptions.map((option) => `
        <div class="jollof-option-card ${selectedMealOptions.includes(option.label) ? 'active' : ''}" data-option="${option.label}">
          <img src="${option.image}" alt="${option.label}" class="thumbnail ${selectedMealOptions.includes(option.label) ? 'active' : ''}" data-option="${option.label}">
          <span class="jollof-option-name">${option.label}</span>
        </div>
      `).join('')}
    `;

    thumbnailRow.querySelectorAll('.jollof-option-card').forEach((card) => {
      card.addEventListener('click', () => {
        const optionLabel = card.dataset.option;
        if (optionLabel === 'main') {
          selectedMealOptions = [];
        } else if (selectedMealOptions.includes(optionLabel)) {
          selectedMealOptions = selectedMealOptions.filter((item) => item !== optionLabel);
        } else {
          selectedMealOptions = [...selectedMealOptions, optionLabel];
        }

        updateJollofSelection();
      });
    });

    extrasContainer.querySelectorAll('.meal-option').forEach((button) => {
      button.addEventListener('click', () => {
        const optionLabel = button.dataset.option;
        if (selectedMealOptions.includes(optionLabel)) {
          selectedMealOptions = selectedMealOptions.filter((item) => item !== optionLabel);
        } else {
          selectedMealOptions = [...selectedMealOptions, optionLabel];
        }

        updateJollofSelection();
      });
    });

    updateJollofSelection();
  };

  const openModal = (card) => {
    const name = card.dataset.name;
    const item = foodData[name];
    if (!item || !modal) return;

    modalTitle.textContent = name;
    modalDescription.textContent = item.description;
    selectedQuantity = 1;
    selectedMealOptions = [];
    updateQuantityDisplay();
    modalPrice.textContent = item.price;
    modalMainImage.src = item.images[0];
    modalMainImage.alt = name;

    renderMealOptions(name);

    if (name !== 'Jollof Rice & Chicken' && thumbnailRow) {
      thumbnailRow.innerHTML = '';
      item.images.forEach((image, index) => {
        const thumb = document.createElement('img');
        thumb.src = image;
        thumb.alt = `${name} view ${index + 1}`;
        thumb.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        thumb.addEventListener('click', () => {
          modalMainImage.src = image;
          modalMainImage.alt = `${name} view ${index + 1}`;
          thumbnailRow.querySelectorAll('.thumbnail').forEach((thumbImage) => thumbImage.classList.remove('active'));
          thumb.classList.add('active');
        });
        thumbnailRow.appendChild(thumb);
      });
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const activatePanel = (targetId) => {
    accordionPanels.forEach((panel) => {
      const isActive = panel.dataset.panel === targetId;
      panel.classList.toggle('active', isActive);
      panel.style.display = isActive ? '' : 'none';
    });

    navLinks.forEach((link) => {
      const isActive = link.dataset.target === targetId;
      link.classList.toggle('active', isActive);
      link.setAttribute('aria-expanded', String(isActive));
    });
  };

  let currentFilter = 'all';

  const applyMenuSearch = () => {
    const query = (menuSearchInput?.value || '').trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach((card) => {
      const matchesCategory = currentFilter === 'all' || card.dataset.category === currentFilter;
      const matchesSearch = !query || card.dataset.name.toLowerCase().includes(query);
      const shouldShow = matchesCategory && matchesSearch;
      card.style.display = shouldShow ? '' : 'none';

      if (shouldShow) visibleCount += 1;
    });

    if (noResultsMessage) {
      noResultsMessage.hidden = visibleCount !== 0;
    }
  };

  const filterCards = (category) => {
    currentFilter = category;
    categoryButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.filter === category);
    });
    applyMenuSearch();
  };

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('active');
      menuToggle.classList.toggle('is-open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const targetId = link.dataset.target;
        activatePanel(targetId);
        navMenu.classList.remove('active');
        menuToggle.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterCards(button.dataset.filter);
    });
  });

  menuSearchInput?.addEventListener('input', applyMenuSearch);
  menuSearchBtn?.addEventListener('click', () => {
    applyMenuSearch();
    menuSearchInput?.focus();
  });

  const addToCart = (card, quantity = 1) => {
    const name = card.dataset.name;
    const price = Number(card.dataset.price) || 0;
    const existing = cart.find((item) => item.name === name);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ name, price, quantity });
    }

    renderCart();
    updateSummary();
    selectCard(card);
  };

  const addQuickOrder = (name) => {
    const card = document.querySelector(`.food-card[data-name="${CSS.escape(name)}"]`);
    if (!card) return;

    addToCart(card);
    document.getElementById('checkoutForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const selectCard = (card) => {
    const name = card.dataset.name;
    const price = Number(card.dataset.price) || 0;

    cards.forEach((item) => item.classList.remove('selected'));
    card.classList.add('selected');

    const summaryText = summary.querySelector('p');
    if (summaryText) {
      summaryText.innerHTML = `<strong>Selected:</strong> ${name} - ${formatMoney(price)}`;
    }
  };

  quickOrderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const name = button.dataset.quickItem;
      if (!name) return;
      addQuickOrder(name);
    });
  });

  cards.forEach((card) => {
    const orderBtn = card.querySelector('.order-btn');

    orderBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      addToCart(card);
      document.getElementById('checkoutForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    card.addEventListener('click', () => {
      openModal(card);
      selectCard(card);
    });
  });

  document.querySelectorAll('.qty-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'increase') {
        selectedQuantity += 1;
      } else if (action === 'decrease' && selectedQuantity > 1) {
        selectedQuantity -= 1;
      }
      updateQuantityDisplay();
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target instanceof HTMLElement && event.target.dataset.close === 'true') {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });

  const summaryBtn = document.querySelector('.summary-btn');
  if (summaryBtn) {
    summaryBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        alert('Please choose at least one meal first.');
        return;
      }

      document.getElementById('checkoutForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (modalOrderBtn) {
    modalOrderBtn.addEventListener('click', () => {
      const selectedCard = document.querySelector('.food-card.selected');
      if (!selectedCard) {
        alert('Please select a meal first.');
        return;
      }

      const cardName = selectedCard.dataset.name;
      const basePrice = Number(selectedCard.dataset.price) || 0;
      let itemName = cardName;
      let itemPrice = basePrice;

      if (cardName === 'Jollof Rice & Chicken' && selectedMealOptions.length > 0) {
        const extraTotal = selectedMealOptions.reduce((sum, label) => {
          const option = jollofOptions.find((entry) => entry.label === label);
          return sum + (option ? option.price : 0);
        }, 0);
        itemName = `${cardName} (${selectedMealOptions.join(', ')})`;
        itemPrice = basePrice + extraTotal;
      }

      const existing = cart.find((item) => item.name === itemName);
      const qtyToAdd = selectedQuantity || 1;

      if (existing) {
        existing.quantity += qtyToAdd;
      } else {
        cart.push({ name: itemName, price: itemPrice, quantity: qtyToAdd });
      }

      renderCart();
      updateSummary();
      closeModal();
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (cart.length === 0) {
        alert('Please add at least one item to your cart first.');
        return;
      }

      const customerName = document.getElementById('customerName').value.trim() || 'Walk-in customer';
      const phone = document.getElementById('customerPhone').value.trim() || 'Not provided';
      const address = document.getElementById('customerAddress').value.trim() || 'Not provided';
      const notes = document.getElementById('orderNotes').value.trim() || 'No extra notes';
      const customItemName = document.getElementById('customItemName').value.trim();
      const customItemPrice = Number(document.getElementById('customItemPrice').value || 0) || 0;

      const orderItems = cart.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price }));

      if (customItemName) {
        orderItems.push({
          name: customItemName,
          quantity: 1,
          price: customItemPrice
        });
      }

      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: orderItems,
            customerName,
            phone,
            address,
            notes: customItemName ? `${notes} | Custom request: ${customItemName}` : notes
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Order failed.');
        }

        const itemSummary = orderItems.map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`).join(', ');
        alert(`${result.message}\nItems: ${itemSummary}\nFor: ${customerName}`);
        cart.length = 0;
        renderCart();
        updateSummary();
        checkoutForm.reset();
        cards.forEach((card) => card.classList.remove('selected'));
      } catch (error) {
        alert(error.message || 'Unable to place your order right now.');
      }
    });
  }

  renderCart();
  updateSummary();
  filterCards('all');
});
