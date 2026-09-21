document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const yearSpan = document.getElementById('year');
  const cards = document.querySelectorAll('.food-card');
  const summary = document.createElement('div');
  const modal = document.getElementById('foodModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');
  const modalPrice = document.getElementById('modalPrice');
  const modalMainImage = document.getElementById('modalMainImage');
  const thumbnailRow = document.getElementById('thumbnailRow');
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
        'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80'
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

  summary.className = 'order-summary';
  summary.innerHTML = '<p><strong>Selected:</strong> Nothing yet</p><button type="button" class="summary-btn">Place Order</button>';

  const menuSection = document.querySelector('.menu-section');
  if (menuSection) {
    menuSection.appendChild(summary);
  }

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const openModal = (card) => {
    const name = card.dataset.name;
    const item = foodData[name];
    if (!item || !modal) return;

    modalTitle.textContent = name;
    modalDescription.textContent = item.description;
    modalPrice.textContent = item.price;
    modalMainImage.src = item.images[0];
    modalMainImage.alt = name;

    thumbnailRow.innerHTML = '';
    item.images.forEach((image, index) => {
      const thumb = document.createElement('img');
      thumb.src = image;
      thumb.alt = `${name} view ${index + 1}`;
      thumb.className = `thumbnail ${index === 0 ? 'active' : ''}`;
      thumb.addEventListener('click', () => {
        modalMainImage.src = image;
        modalMainImage.alt = `${name} view ${index + 1}`;
        document.querySelectorAll('.thumbnail').forEach((thumbImage) => thumbImage.classList.remove('active'));
        thumb.classList.add('active');
      });
      thumbnailRow.appendChild(thumb);
    });

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

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('active');
      menuToggle.classList.toggle('is-open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  cards.forEach((card) => {
    const orderBtn = card.querySelector('.order-btn');

    const selectCard = () => {
      const name = card.dataset.name;
      const price = card.dataset.price;

      cards.forEach((item) => item.classList.remove('selected'));
      card.classList.add('selected');

      const summaryText = summary.querySelector('p');
      if (summaryText) {
        summaryText.innerHTML = `<strong>Selected:</strong> ${name} - ${price}`;
      }
    };

    orderBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      selectCard();
    });

    card.addEventListener('click', () => {
      openModal(card);
      selectCard();
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
      const selectedCard = document.querySelector('.food-card.selected');
      if (!selectedCard) {
        alert('Please choose a meal first.');
        return;
      }

      const itemName = selectedCard.dataset.name;
      alert(`You selected ${itemName}! Your order is being prepared.`);
    });
  }

  if (modalOrderBtn) {
    modalOrderBtn.addEventListener('click', () => {
      const selectedCard = document.querySelector('.food-card.selected');
      if (!selectedCard) {
        alert('Please select a meal first.');
        return;
      }

      const itemName = selectedCard.dataset.name;
      alert(`You selected ${itemName}! Your order is being prepared.`);
      closeModal();
    });
  }
});
