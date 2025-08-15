/**
 * Aevra - E-commerce Script
 * Fitur lengkap dengan keranjang belanja, ukuran produk, dan checkout WhatsApp
 */

const PRODUCTS = [
  {
    id: "p1",
    name: "Kaos Hitam Aevra",
    price: 120000,
    desc: "Kaos katun premium nyaman dipakai sehari-hari.",
    img: "images/baju.png",
  },
  {
    id: "p2",
    name: "COMING SOON",
    price: 1,
    desc: "Hoodie hangat dengan desain simpel.",
    img: "images/baju2.png",
  },
  {
    id: "p3",
    name: "COMING SOON",
    price: 1,
    desc: "kaos  berbahan ringan katun.",
    img: "images/baju1.jpg",
  },
  {
    id: "p4",
    name: "COMING SOON",
    price: 1,
    desc: "kaos nyaman buat kemana-mana.",
    img: "images/baju4.png",
  },
];

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format angka ke Rupiah
 * @param {number} n - Jumlah uang
 * @returns {string} Format Rupiah (contoh: Rp 100.000)
 */
function formatRupiah(n) {
  return "Rp " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Mendapatkan produk berdasarkan ID
 * @param {string} id - ID produk
 * @returns {object} Data produk
 */
window.getProductById = function (id) {
  return (
    PRODUCTS.find((p) => p.id === id) || {
      id: id,
      name: "Produk " + id,
      price: 0,
      img: "images/placeholder.png",
    }
  );
};

// ==================== PRODUCT RENDERING ====================

/**
 * Render daftar produk ke halaman
 */
window.renderProducts = function () {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = PRODUCTS.map(
    (product) => `
    <article class="card">
      <div class="img-wrap">
        <img class="product-image" src="${product.img}" alt="${product.name}">
      </div>
      <div class="card-body">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${formatRupiah(product.price)}</p>
        <p class="product-desc">${product.desc}</p>
        
        <select class="size-select" id="size-${product.id}">
          <option value="">Pilih Ukuran</option>
          <option value="M">M</option>
          <option value="L">L</option>
        </select>

        <div class="card-actions">
          <button class="btn" onclick="addToCart('${product.id}')">
            Tambah ke Keranjang
          </button>
          <button class="btn btn-wa" onclick="orderSingleViaWA('${
            product.id
          }')">
            Pesan via WhatsApp
          </button>
        </div>
      </div>
    </article>
  `
  ).join("");
};

// ==================== CART MANAGEMENT ====================

const CART_KEY = "aevera_cart_v2"; // Diubah ke v2 untuk migrasi data
const BUSINESS_WA = "6282266517859"; // Ganti dengan nomor WA bisnis Anda

/**
 * Mendapatkan isi keranjang dari localStorage
 * @returns {object} Keranjang belanja
 */
function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || {};

    // Migrasi dari format lama (jika ada)
    Object.keys(cart).forEach((id) => {
      if (typeof cart[id] === "number") {
        cart[id] = { qty: cart[id], size: "" };
      } else if (!cart[id].size) {
        cart[id].size = "";
      }
    });

    return cart;
  } catch (e) {
    return {};
  }
}

/**
 * Menyimpan keranjang ke localStorage
 * @param {object} cart - Keranjang belanja
 */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/**
 * Menambahkan produk ke keranjang
 * @param {string} id - ID produk
 */
window.addToCart = function (id) {
  const sizeSelect = document.getElementById(`size-${id}`);
  const size = sizeSelect ? sizeSelect.value : "";

  if (!size) {
    alert("Silakan pilih ukuran terlebih dahulu.");
    return;
  }

  const cart = getCart();

  if (cart[id]) {
    cart[id].qty += 1;
  } else {
    cart[id] = { qty: 1, size: size };
  }

  saveCart(cart);
  updateCartBadge();

  // Reset pilihan ukuran
  if (sizeSelect) sizeSelect.value = "";

  alert("Produk berhasil ditambahkan ke keranjang");
};

/**
 * Memperbarui tampilan badge keranjang
 */
window.updateCartBadge = function () {
  const cart = getCart();
  const total = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll("#cartCount").forEach((el) => {
    el.textContent = total;
  });
};

/**
 * Mengubah jumlah produk dalam keranjang
 * @param {string} id - ID produk
 * @param {number} qty - Jumlah baru
 */
window.changeQty = function (id, qty) {
  const cart = getCart();

  if (qty <= 0) {
    delete cart[id];
  } else {
    cart[id].qty = qty;
  }

  saveCart(cart);
  renderCartPage();
  updateCartBadge();
};

/**
 * Menghapus produk dari keranjang
 * @param {string} id - ID produk
 */
window.removeItem = function (id) {
  if (confirm("Apakah Anda yakin ingin menghapus produk ini dari keranjang?")) {
    const cart = getCart();
    delete cart[id];
    saveCart(cart);
    renderCartPage();
    updateCartBadge();
  }
};

/**
 * Render halaman keranjang belanja
 */
window.renderCartPage = function () {
  const cartArea = document.getElementById("cartArea");
  if (!cartArea) return;

  const cart = getCart();
  const entries = Object.entries(cart);

  if (entries.length === 0) {
    cartArea.innerHTML = `
      <div style="text-align: center; padding: 40px 0;">
        <p style="margin-bottom: 20px;">Keranjang belanja Anda kosong</p>
        <a href="index.html" class="btn">Kembali Berbelanja</a>
      </div>
    `;
    return;
  }

  let subtotal = 0;
  const itemsHTML = entries
    .map(([id, item]) => {
      const product = getProductById(id);
      const totalPrice = product.price * item.qty;
      subtotal += totalPrice;

      return `
      <div class="cart-item">
        <img src="${product.img}" alt="${product.name}">
        <div class="cart-item-details">
          <h4>${product.name}</h4>
          <p>Ukuran: ${item.size || "Tidak ditentukan"}</p>
          <p>${formatRupiah(product.price)} × ${item.qty} = ${formatRupiah(
        totalPrice
      )}</p>
          <div class="cart-item-actions">
            <button class="btn" onclick="changeQty('${id}', ${
        item.qty - 1
      })">-</button>
            <span>${item.qty}</span>
            <button class="btn" onclick="changeQty('${id}', ${
        item.qty + 1
      })">+</button>
            <button class="btn ghost" onclick="removeItem('${id}')">Hapus</button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  cartArea.innerHTML = `
    <div class="cart-items">${itemsHTML}</div>
    <div class="cart-summary">
      <h3>Total: ${formatRupiah(subtotal)}</h3>
      <button class="btn" onclick="startCheckout()">Proses Checkout</button>
    </div>
  `;
};

// ==================== CHECKOUT SYSTEM ====================

/**
 * Memulai proses checkout
 */
window.startCheckout = function () {
  const checkoutArea = document.getElementById("checkoutArea");
  if (checkoutArea) checkoutArea.classList.remove("hidden");
  window.scrollTo(0, document.body.scrollHeight);
};

/**
 * Membuat pesan untuk WhatsApp
 * @param {object} buyer - Data pembeli
 * @param {object} [customCart] - Keranjang custom (opsional)
 * @returns {string} Pesan yang diformat
 */
function composeOrderMessage(buyer = {}, customCart = null) {
  const cart = customCart || getCart();
  const entries = Object.entries(cart);

  if (entries.length === 0) return null;

  let message = "📦 *PESANAN DARI AEVERA* 📦\n\n";
  let total = 0;

  // Daftar produk
  message += "🛒 *Daftar Pesanan:*\n";
  entries.forEach(([id, item], index) => {
    const product = getProductById(id);
    const itemTotal = product.price * item.qty;
    total += itemTotal;

    message += `${index + 1}. ${product.name} (${item.size})\n`;
    message += `   ${formatRupiah(product.price)} × ${
      item.qty
    } = ${formatRupiah(itemTotal)}\n\n`;
  });

  // Total
  message += `💵 *Total Pesanan:* ${formatRupiah(total)}\n\n`;

  // Data pembeli
  if (buyer.name || buyer.address || buyer.payment) {
    message += "👤 *Data Pembeli*\n";
    message += `Nama: ${buyer.name || "-"}\n`;
    message += `Alamat: ${buyer.address || "-"}\n`;
    message += `Metode Pembayaran: ${buyer.payment || "-"}\n\n`;
  }

  // Catatan
  message +=
    "Terima kasih telah berbelanja di Aevra. Pesanan Anda akan segera kami proses setelah konfirmasi pembayaran.";

  return message;
}

/**
 * Checkout produk tunggal via WhatsApp
 * @param {string} id - ID produk
 */
window.orderSingleViaWA = function (id) {
  const sizeSelect = document.getElementById(`size-${id}`);
  const size = sizeSelect ? sizeSelect.value : "";

  if (!size) {
    alert("Silakan pilih ukuran terlebih dahulu.");
    return;
  }

  const product = getProductById(id);
  const tempCart = { [id]: { qty: 1, size: size } };
  const message = composeOrderMessage({}, tempCart);

  window.open(
    `https://wa.me/${BUSINESS_WA}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
};

/**
 * Mengirim pesanan via WhatsApp
 */
window.sendOrderViaWhatsApp = function () {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  const formData = new FormData(form);
  const buyer = {
    name: formData.get("name"),
    address: formData.get("address"),
    payment: formData.get("payment"),
  };

  const message = composeOrderMessage(buyer);
  if (!message) {
    alert("Keranjang belanja kosong.");
    return;
  }

  window.open(
    `https://wa.me/${BUSINESS_WA}?text=${encodeURIComponent(message)}`,
    "_blank"
  );

  // Reset keranjang setelah checkout
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
  renderCartPage();

  // Tampilkan pesan sukses
  const successMsg = document.getElementById("orderSuccess");
  if (successMsg) successMsg.classList.remove("hidden");
};

// ==================== INITIALIZATION ====================

/**
 * Inisialisasi saat halaman dimuat
 */
document.addEventListener("DOMContentLoaded", function () {
  // Render produk di halaman katalog
  renderProducts();

  // Render keranjang jika di halaman keranjang
  if (document.getElementById("cartArea")) {
    renderCartPage();
  }

  // Setup form checkout
  const checkoutForm = document.getElementById("checkoutForm");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", function (e) {
      e.preventDefault();
      sendOrderViaWhatsApp();
    });
  }

  // Setup tombol cancel checkout
  const cancelCheckout = document.getElementById("cancelCheckout");
  if (cancelCheckout) {
    cancelCheckout.addEventListener("click", function () {
      const checkoutArea = document.getElementById("checkoutArea");
      if (checkoutArea) checkoutArea.classList.add("hidden");
    });
  }

  // Update cart badge
  updateCartBadge();

  // Update tahun di footer
  document.querySelectorAll("#year").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
});
