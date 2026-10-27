(function () {
  'use strict';

  var $ = function (selector, context) { return (context || document).querySelector(selector); };
  var $$ = function (selector, context) { return Array.prototype.slice.call((context || document).querySelectorAll(selector)); };
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var priceFormatter = new Intl.NumberFormat('vi-VN');
  var FREE_SHIP = 500000;
  var SHIP_FEE = 30000;
  var CART_KEY = 'tiem-nho-cart-v1';
  var THEME_KEY = 'tiem-nho-theme';
  var MAX_QTY = 20;

  var PRODUCTS = {
    mug: { name: 'Tách Gốm Men Mật', price: 185000, sprite: 'sprite-mug' },
    vase: { name: 'Bình Gốm Men Rêu', price: 320000, sprite: 'sprite-vase' },
    coffee: { name: 'Arabica Mộc Đà Lạt', price: 165000, sprite: 'sprite-coffee' },
    bottle: { name: 'Cold Brew Chai', price: 95000, sprite: 'sprite-bottle' },
    candle: { name: 'Nến Chiều Mưa', price: 210000, sprite: 'sprite-candle' },
    tea: { name: 'Oolong Sương Sớm', price: 140000, sprite: 'sprite-tea' },
    notebook: { name: 'Sổ Tay Giấy Mộc', price: 95000, sprite: 'sprite-notebook' },
    postcards: { name: 'Thiệp Bốn Mùa', price: 60000, sprite: 'sprite-postcards' }
  };

  function formatPrice(value) {
    return priceFormatter.format(value) + '₫';
  }

  /* ---------- Cart state ---------- */
  var cart = [];
  try {
    var savedCart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (Array.isArray(savedCart)) {
      cart = savedCart
        .filter(function (item) { return item && PRODUCTS[item.id] && Number.isInteger(item.qty) && item.qty > 0; })
        .map(function (item) { return { id: item.id, qty: Math.min(item.qty, MAX_QTY) }; });
    }
  } catch (error) { cart = []; }

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (error) {}
  }

  var cartCount = $('#cart-count');
  var cartCountLabel = $('#cart-count-label');
  var cartDialogCount = $('#cart-dialog-count');
  var cartItems = $('#cart-items');
  var cartEmpty = $('#cart-empty');
  var cartFoot = $('#cart-foot');
  var cartMain = $('#cart-main');
  var cartSuccess = $('#cart-success');
  var cartLive = $('#cart-live');
  var drawer = $('#cart-drawer');
  var scrim = $('#cart-scrim');
  var page = $('#page');
  var cartOpenBtn = $('#cart-open');
  var closeBtn = $('.cart-close');
  var checkoutBtn = $('#checkout-btn');
  var checkoutLabel = $('.checkout-label', checkoutBtn);
  var lastFocus = null;
  var closeTimer = null;
  var focusTimer = null;

  function announce(message) {
    cartLive.textContent = '';
    window.requestAnimationFrame(function () { cartLive.textContent = message; });
  }

  function getCount() {
    return cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function getSubtotal() {
    return cart.reduce(function (sum, item) { return sum + PRODUCTS[item.id].price * item.qty; }, 0);
  }

  function updateCartUI() {
    var count = getCount();
    var subtotal = getSubtotal();
    var freeShip = subtotal >= FREE_SHIP;
    var shipping = cart.length ? (freeShip ? 0 : SHIP_FEE) : 0;
    var total = subtotal + shipping;

    cartCount.textContent = String(count);
    cartCountLabel.textContent = 'Giỏ hàng, ' + count + ' món';
    cartDialogCount.textContent = '(' + count + ')';

    cartEmpty.hidden = cart.length > 0;
    cartItems.innerHTML = cart.map(function (item) {
      var product = PRODUCTS[item.id];
      var lineTotal = product.price * item.qty;
      return '' +
        '<li class="cart-item">' +
          '<span class="cart-thumb" aria-hidden="true">' +
            '<svg viewBox="0 0 32 32" width="36" height="36" shape-rendering="crispEdges"><use href="#' + product.sprite + '"></use></svg>' +
          '</span>' +
          '<div>' +
            '<p class="cart-name">' + product.name + '</p>' +
            '<p class="cart-unit">' + formatPrice(product.price) + ' / món</p>' +
            '<div class="qty">' +
              '<button type="button" data-qty="' + item.id + '" data-delta="-1" aria-label="Giảm số lượng ' + product.name + '">−</button>' +
              '<output aria-label="Số lượng ' + product.name + '">' + item.qty + '</output>' +
              '<button type="button" data-qty="' + item.id + '" data-delta="1" aria-label="Tăng số lượng ' + product.name + '">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="cart-side">' +
            '<span class="cart-line-total">' + formatPrice(lineTotal) + '</span>' +
            '<button type="button" class="cart-remove" data-remove="' + item.id + '" aria-label="Xoá ' + product.name + ' khỏi giỏ">Xoá</button>' +
          '</div>' +
        '</li>';
    }).join('');

    cartFoot.hidden = cart.length === 0;
    $('#cart-subtotal').textContent = formatPrice(subtotal);
    $('#cart-shipping').textContent = cart.length ? (freeShip ? 'Miễn phí' : formatPrice(SHIP_FEE)) : '—';
    $('#cart-total').textContent = formatPrice(total);
    $('#checkout-total').textContent = formatPrice(total);

    var shipLabel = $('#ship-label');
    var segments = $$('#ship-bar span');
    var filled = freeShip ? 10 : Math.min(9, Math.ceil((subtotal / FREE_SHIP) * 10));
    segments.forEach(function (segment, index) {
      segment.classList.toggle('is-on', index < filled);
      segment.classList.toggle('is-free', freeShip);
    });

    if (cart.length === 0) {
      shipLabel.textContent = 'Miễn phí giao hàng từ ' + formatPrice(FREE_SHIP);
      shipLabel.classList.remove('is-free');
    } else if (freeShip) {
      shipLabel.textContent = 'Đã được miễn phí giao hàng nội thành.';
      shipLabel.classList.add('is-free');
    } else {
      shipLabel.textContent = 'Thêm ' + formatPrice(FREE_SHIP - subtotal) + ' để được miễn phí giao hàng.';
      shipLabel.classList.remove('is-free');
    }
  }

  function resetCartView() {
    cartSuccess.hidden = true;
    cartMain.hidden = false;
    cartFoot.hidden = cart.length === 0;
    checkoutBtn.disabled = false;
    checkoutLabel.textContent = 'Đặt hàng';
    updateCartUI();
  }

  function openCart(trigger) {
    if (drawer.classList.contains('is-open')) return;
    closeNav();
    window.clearTimeout(closeTimer);
    window.clearTimeout(focusTimer);
    resetCartView();
    lastFocus = trigger || (document.activeElement && document.activeElement !== document.body ? document.activeElement : cartOpenBtn);
    if (scrim.hidden) {
      scrim.hidden = false;
      window.requestAnimationFrame(function () { scrim.classList.add('is-open'); });
    } else {
      scrim.classList.add('is-open');
    }
    drawer.inert = false;
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('is-open');
    page.inert = true;
    document.body.classList.add('is-locked');
    window.requestAnimationFrame(function () { closeBtn.focus(); });
  }

  function closeCart() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    scrim.classList.remove('is-open');
    page.inert = false;
    document.body.classList.remove('is-locked');
    closeTimer = window.setTimeout(function () {
      if (!drawer.classList.contains('is-open')) scrim.hidden = true;
    }, 220);
    if (lastFocus && document.contains(lastFocus)) {
      focusTimer = window.setTimeout(function () {
        if (!drawer.classList.contains('is-open')) lastFocus.focus();
      }, 180);
    }
  }

  function bumpCount() {
    cartCount.classList.remove('is-bumped');
    void cartCount.offsetWidth;
    cartCount.classList.add('is-bumped');
    window.setTimeout(function () { cartCount.classList.remove('is-bumped'); }, 400);
  }

  function addToCart(id, button) {
    var product = PRODUCTS[id];
    if (!product) return;
    var existing = cart.find(function (item) { return item.id === id; });
    if (existing) {
      existing.qty = Math.min(MAX_QTY, existing.qty + 1);
    } else {
      cart.push({ id: id, qty: 1 });
    }
    saveCart();
    updateCartUI();
    bumpCount();
    announce('Đã thêm ' + product.name + ' vào giỏ.');
    openCart(button || cartOpenBtn);
    if (button) {
      var label = $('.add-label', button);
      if (label) {
        if (!button.dataset.originalLabel) button.dataset.originalLabel = label.textContent;
        label.textContent = 'Đã thêm';
        button.classList.add('is-added');
        window.setTimeout(function () {
          label.textContent = button.dataset.originalLabel;
          button.classList.remove('is-added');
        }, 1200);
      }
    }
  }

  function changeQty(id, delta) {
    var item = cart.find(function (entry) { return entry.id === id; });
    if (!item) return;
    item.qty += delta;
    var wasRemoved = false;
    if (item.qty <= 0) {
      cart = cart.filter(function (entry) { return entry.id !== id; });
      wasRemoved = true;
      announce('Đã xoá ' + PRODUCTS[id].name + ' khỏi giỏ.');
    } else {
      item.qty = Math.min(item.qty, MAX_QTY);
      announce(PRODUCTS[id].name + ': ' + item.qty + ' món trong giỏ.');
    }
    saveCart();
    updateCartUI();
    if (drawer.classList.contains('is-open')) {
      var target = null;
      if (!wasRemoved) target = $('[data-qty="' + id + '"][data-delta="' + delta + '"]', drawer);
      if (!target) target = $('[data-qty]', drawer) || closeBtn;
      if (target) target.focus();
    }
  }

  function removeItem(id) {
    var product = PRODUCTS[id];
    var index = cart.findIndex(function (item) { return item.id === id; });
    cart = cart.filter(function (item) { return item.id !== id; });
    saveCart();
    updateCartUI();
    if (drawer.classList.contains('is-open')) {
      var removeButtons = $$('[data-remove]', drawer);
      var nextTarget = removeButtons[Math.min(Math.max(index, 0), removeButtons.length - 1)] || closeBtn;
      if (nextTarget) nextTarget.focus();
    }
    if (product) announce('Đã xoá ' + product.name + ' khỏi giỏ.');
  }

  /* ---------- Cart events ---------- */
  $$('[data-add]').forEach(function (button) {
    button.addEventListener('click', function () { addToCart(button.dataset.add, button); });
  });

  cartOpenBtn.addEventListener('click', function () { openCart(cartOpenBtn); });
  scrim.addEventListener('click', closeCart);

  drawer.addEventListener('click', function (event) {
    var close = event.target.closest('[data-close-cart]');
    if (close) { closeCart(); return; }

    var qtyButton = event.target.closest('[data-qty]');
    if (qtyButton) {
      changeQty(qtyButton.dataset.qty, Number(qtyButton.dataset.delta));
      return;
    }

    var removeButton = event.target.closest('[data-remove]');
    if (removeButton) { removeItem(removeButton.dataset.remove); return; }

    var goShop = event.target.closest('[data-go-shop]');
    if (goShop) {
      closeCart();
      window.setTimeout(function () {
        var products = $('#san-pham');
        if (products) products.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      }, 160);
    }
  });

  drawer.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCart();
      return;
    }
    if (event.key !== 'Tab') return;
    var focusables = $$('button:not(:disabled), a[href], input, [tabindex]:not([tabindex="-1"])', drawer).filter(function (element) {
      return element.offsetParent !== null;
    });
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  checkoutBtn.addEventListener('click', function () {
    if (!cart.length) return;
    checkoutBtn.disabled = true;
    checkoutLabel.textContent = 'Đang gói ghém…';
    window.setTimeout(function () {
      var code = 'TN-' + String(Math.floor(1000 + Math.random() * 9000));
      cart = [];
      saveCart();
      updateCartUI();
      $('#order-code').textContent = code;
      cartMain.hidden = true;
      cartFoot.hidden = true;
      cartSuccess.hidden = false;
      checkoutLabel.textContent = 'Đặt hàng';
      checkoutBtn.disabled = false;
      var nextButton = $('button', cartSuccess);
      if (nextButton) nextButton.focus();
      announce('Đơn ' + code + ' đã được tạo. Đây là trang demo.');
    }, 900);
  });

  /* ---------- Filters ---------- */
  var filterButtons = $$('.chip[data-filter]');
  var cards = $$('.product-card');
  var results = $('#product-results');
  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var filter = button.dataset.filter;
      var visible = 0;
      filterButtons.forEach(function (chip) {
        var active = chip === button;
        chip.classList.toggle('is-active', active);
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      cards.forEach(function (card) {
        var show = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !show);
        if (show) visible += 1;
      });
      results.textContent = 'Đang hiện ' + visible + ' món';
    });
  });

  /* ---------- Theme lamp ---------- */
  var themeToggle = $('#theme-toggle');
  var themeMeta = $('meta[name="theme-color"]');

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    var night = theme === 'night';
    themeToggle.setAttribute('aria-pressed', night ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', night
      ? 'Tắt đèn bàn, chuyển sang giao diện ban ngày'
      : 'Bật đèn bàn, chuyển sang giao diện ban đêm');
    themeToggle.title = night ? 'Tắt đèn bàn' : 'Bật đèn bàn';
    if (themeMeta) themeMeta.content = night ? '#1C1E28' : '#F9ECE2';
    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (error) {}
    }
  }

  applyTheme(root.dataset.theme === 'night' ? 'night' : 'day', false);
  themeToggle.addEventListener('click', function () {
    applyTheme(root.dataset.theme === 'night' ? 'day' : 'night', true);
  });

  /* ---------- Mobile nav ---------- */
  var header = $('#site-header');
  var menuToggle = $('#menu-toggle');

  function closeNav() {
    header.classList.remove('nav-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Mở menu');
  }

  menuToggle.addEventListener('click', function () {
    var open = header.classList.toggle('nav-open');
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
  });

  $$('.main-nav a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('click', function (event) {
    if (!header.contains(event.target)) closeNav();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && header.classList.contains('nav-open')) closeNav();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 940) closeNav();
  });

  /* ---------- Cat easter egg ---------- */
  var cat = $('#hero-cat');
  var catBubble = $('#cat-bubble');
  var catPhrases = ['prrr…', 'meo meo ♥', 'ngủ thêm 5 phút…', 'cà phê chưa?', 'một chút nắng nhé'];
  var catTimer = null;

  cat.addEventListener('click', function () {
    cat.classList.remove('is-purring');
    void cat.offsetWidth;
    cat.classList.add('is-purring');
    catBubble.textContent = catPhrases[Math.floor(Math.random() * catPhrases.length)];
    catBubble.classList.add('is-show');
    window.clearTimeout(catTimer);
    catTimer = window.setTimeout(function () {
      catBubble.classList.remove('is-show');
      cat.classList.remove('is-purring');
    }, 1600);
  });

  /* ---------- Newsletter ---------- */
  var newsletterForm = $('#newsletter-form');
  var newsletterEmail = $('#newsletter-email');
  var newsletterMsg = $('#newsletter-msg');

  newsletterForm.addEventListener('submit', function (event) {
    event.preventDefault();
    newsletterMsg.classList.remove('is-ok', 'is-error');
    if (!newsletterEmail.value.trim() || !newsletterEmail.checkValidity()) {
      newsletterMsg.textContent = 'Bạn kiểm tra lại email giúp tiệm nhé.';
      newsletterMsg.classList.add('is-error');
      newsletterEmail.focus();
      return;
    }
    newsletterMsg.textContent = 'Đã ghi tên bạn vào sổ. Hẹn gặp thứ Sáu nhé!';
    newsletterMsg.classList.add('is-ok');
    newsletterForm.reset();
  });

  /* ---------- Reveal on scroll ---------- */
  var revealElements = $$('.reveal');
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -36px' });
    revealElements.forEach(function (element) { observer.observe(element); });
    window.setTimeout(function () {
      revealElements.forEach(function (element) { element.classList.add('is-in'); });
    }, 1400);
  } else {
    revealElements.forEach(function (element) { element.classList.add('is-in'); });
  }

  /* ---------- Misc ---------- */
  $('#year').textContent = new Date().getFullYear();
  updateCartUI();
  resetCartView();
})();
