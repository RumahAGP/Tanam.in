const container = document.getElementById("keranjangContent");
const totalItemsTopEl = document.getElementById("totalItemsTop");
const selectAllHeader = document.getElementById("selectAllHeader");
const selectAllTop = document.getElementById("selectAllTop");
const hapusSelectedTopBtn = document.getElementById("hapusSelectedTop");

// Summary Elements
const summarySubtotalEl = document.getElementById("summarySubtotal");
const summaryShippingEl = document.getElementById("summaryShipping");
const summaryTotalEl = document.getElementById("summaryTotal");

let keranjang = JSON.parse(localStorage.getItem("keranjang")) || [];

// Store Location (Universitas Pamulang Viktor)
const STORE_LAT = -6.346286;
const STORE_LNG = 106.691763;
let map, marker, autocomplete;
let userLat = null;
let userLng = null;
let distanceKm = 0;

const RATES = {
    hemat: { perKm: 1000, flatUnder4km: 8000 },
    express: { perKm: 2000, flatUnder4km: 11000 },
    instant: { perKm: 3000, flatUnder4km: 15000 }
};

// Voucher System
const VOUCHERS = {
    'BENIH10': { type: 'percentage', value: 10, minPurchase: 0, desc: 'Diskon 10%' },
    'ONGKIRFREE': { type: 'free_shipping', value: 0, minPurchase: 100000, desc: 'Gratis Ongkir (min Rp100.000)' },
    'CASHBACK15': { type: 'percentage', value: 15, minPurchase: 0, desc: 'Cashback 15%' },
    'BENIH20': { type: 'percentage', value: 20, minPurchase: 200000, desc: 'Diskon 20% (min Rp200.000)' },
    'B2G1BENIH': { type: 'info', value: 0, minPurchase: 0, desc: 'Beli 2 Gratis 1 (manual)' },
    'MEMBER25': { type: 'percentage', value: 25, minPurchase: 0, desc: 'Diskon Member 25%' },
    'HBD50K': { type: 'fixed', value: 50000, minPurchase: 0, desc: 'Potongan Rp50.000' },
    'FLASH40': { type: 'percentage', value: 40, minPurchase: 0, desc: 'Flash Sale 40%' },
    'WEEKEND30': { type: 'percentage', value: 30, minPurchase: 0, desc: 'Weekend 30%' },
    'NEWUSER20': { type: 'percentage', value: 20, minPurchase: 0, desc: 'New User 20%' }
};

let appliedVoucher = null;
let voucherDiscount = 0;

// Helper: Parse harga string "Rp 5.000" -> 5000
function parseHarga(hargaStr) {
    if (typeof hargaStr === 'number') return hargaStr;
    return parseInt(hargaStr.replace(/[^0-9]/g, '')) || 0;
}

// Helper: Format to Rupiah
function formatRupiah(num) {
    return 'Rp' + num.toLocaleString('id-ID');
}

function renderKeranjang() {
    try {
        container.innerHTML = "";
        keranjang = keranjang.filter(item => item && item.harga && item.nama);
        localStorage.setItem("keranjang", JSON.stringify(keranjang));

        if (keranjang.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <img src="assets/img/keranjang.png" alt="Keranjang Kosong">
                    <p>Wah, keranjang belanjamu kosong!</p>
                    <a href="products.html" class="btn-shop">Mulai Belanja</a>
                </div>
            `;
            updateSummary();
            return;
        }

        keranjang.forEach((item, index) => {
            const hargaSatuan = parseHarga(item.harga);
            const totalItem = hargaSatuan * item.jumlah;

            const itemDiv = document.createElement("div");
            itemDiv.className = "cart-item";
            itemDiv.style.cssText = "margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; border: none !important;";
            itemDiv.innerHTML = `
                <div class="cart-col-check">
                    <input type="checkbox" class="item-checkbox" data-index="${index}" ${item.selected ? 'checked' : ''} style="width: 20px !important; height: 20px !important; display: block !important; visibility: visible !important; opacity: 1 !important; cursor: pointer;">
                </div>
                <div class="cart-col-product">
                    <div class="product-details">
                        <img src="${item.gambar || 'assets/img/logo.jpeg'}" alt="${item.nama}">
                        <div class="product-info">
                            <h4>${item.nama}</h4>
                            <span class="variant">Variasi: Default</span>
                            <div style="margin-top: 8px;">
                                <input type="text" class="item-note" data-index="${index}" placeholder="Catatan untuk penjual (opsional)" value="${item.catatan || ''}" style="width: 100%; padding: 6px 10px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px; color: #666;">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="cart-col-price">
                    <span class="unit-price">${item.harga}</span>
                </div>
                <div class="cart-col-qty">
                    <div class="qty-selector">
                        <button class="qty-btn minus" data-index="${index}">-</button>
                        <input type="number" class="qty-input" data-index="${index}" value="${item.jumlah}" min="1" style="text-align: center;">
                        <button class="qty-btn plus" data-index="${index}">+</button>
                    </div>
                </div>
                <div class="cart-col-total">
                    <span class="total-price">${formatRupiah(totalItem)}</span>
                </div>
                <div class="cart-col-action">
                    <button class="btn-delete" data-index="${index}">Hapus</button>
                </div>
            `;
            container.appendChild(itemDiv);
        });

        attachEvents();
        updateSummary();
    } catch (error) {
        console.error("Error rendering cart:", error);
        container.innerHTML = "<p>Terjadi kesalahan. Silakan hapus data dan coba lagi.</p>";
    }
}

function attachEvents() {
    document.querySelectorAll(".qty-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = e.target.dataset.index;
            if (e.target.classList.contains("minus")) {
                if (keranjang[index].jumlah > 1) keranjang[index].jumlah--;
            } else {
                keranjang[index].jumlah++;
            }
            saveAndRender();
        });
    });

    document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = e.target.dataset.index;
            if (confirm("Hapus produk ini dari keranjang?")) {
                keranjang.splice(index, 1);
                saveAndRender();
            }
        });
    });

    document.querySelectorAll(".item-checkbox").forEach(box => {
        box.addEventListener("change", (e) => {
            const index = e.target.dataset.index;
            keranjang[index].selected = e.target.checked;
            saveAndRender();
        });
    });

    document.querySelectorAll(".item-note").forEach(input => {
        input.addEventListener("input", (e) => {
            const index = e.target.dataset.index;
            keranjang[index].catatan = e.target.value;
            localStorage.setItem("keranjang", JSON.stringify(keranjang));
        });
    });

    // Manual Quantity Input
    document.querySelectorAll(".qty-input").forEach(input => {
        input.addEventListener("change", (e) => {
            const index = e.target.dataset.index;
            let newQty = parseInt(e.target.value);

            if (isNaN(newQty) || newQty < 1) {
                newQty = 1;
            }

            keranjang[index].jumlah = newQty;
            saveAndRender();
        });
    });
}

function updateSummary() {
    const allSelected = keranjang.length > 0 && keranjang.every(item => item.selected);
    selectAllHeader.checked = allSelected;
    selectAllTop.checked = allSelected;

    let total = 0;
    keranjang.forEach(item => {
        if (item.selected) {
            total += parseHarga(item.harga) * item.jumlah;
        }
    });

    totalItemsTopEl.textContent = keranjang.length;
    summarySubtotalEl.textContent = formatRupiah(total);
    updateTotalPayment();
}

function saveAndRender() {
    localStorage.setItem("keranjang", JSON.stringify(keranjang));
    renderKeranjang();
}

function toggleAll(checked) {
    keranjang.forEach(item => item.selected = checked);
    saveAndRender();
}

selectAllHeader.addEventListener("change", (e) => toggleAll(e.target.checked));
selectAllTop.addEventListener("change", (e) => toggleAll(e.target.checked));

hapusSelectedTopBtn.addEventListener("click", () => {
    const hasSelected = keranjang.some(item => item.selected);
    if (!hasSelected) return alert("Pilih produk yang ingin dihapus.");
    if (confirm("Hapus produk yang dipilih?")) {
        keranjang = keranjang.filter(item => !item.selected);
        saveAndRender();
    }
});

// Initialize Map
setTimeout(() => {
    if (keranjang.length > 0) {
        initMap();
    }
}, 1000);

function initMap() {
    if (map) return;

    map = L.map('map').setView([STORE_LAT, STORE_LNG], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    }).addTo(map);

    // Geocoder search - di dalam map
    const geocoder = L.Control.geocoder({
        defaultMarkGeocode: false,
        position: 'topleft',
        placeholder: 'Ketik alamat: Jl. Raya, Kelurahan...',
        errorMessage: 'Alamat tidak ditemukan',
        collapsed: false,
        geocoder: L.Control.Geocoder.nominatim({
            geocodingQueryParams: {
                countrycodes: 'id',
                limit: 10
            }
        })
    })
        .on('markgeocode', function (e) {
            setUserLocation(e.geocode.center.lat, e.geocode.center.lng);
        })
        .addTo(map);

    // Store marker
    L.marker([STORE_LAT, STORE_LNG], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map)
        .bindPopup("<b>🏪 Toko BenihKu</b><br>Universitas Pamulang Viktor").openPopup();

    map.on('click', function (e) {
        setUserLocation(e.latlng.lat, e.latlng.lng);
    });
}

// Current Location
document.getElementById('btnCurrentLocation').addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Geolocation tidak didukung');
        return;
    }

    const btn = document.getElementById('btnCurrentLocation');
    btn.textContent = 'Mencari...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            setUserLocation(position.coords.latitude, position.coords.longitude);
            btn.innerHTML = '<ion-icon name="navigate-outline" style="vertical-align: middle;"></ion-icon> Gunakan Lokasi Saat Ini';
            btn.disabled = false;
        },
        (error) => {
            alert('Gagal mendapatkan lokasi. Pastikan GPS diizinkan.');
            btn.innerHTML = '<ion-icon name="navigate-outline" style="vertical-align: middle;"></ion-icon> Gunakan Lokasi Saat Ini';
            btn.disabled = false;
        }
    );
});

function setUserLocation(lat, lng) {
    userLat = lat;
    userLng = lng;

    if (marker) {
        map.removeLayer(marker);
    }

    marker = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map)
        .bindPopup("📍 Lokasi Pengiriman Anda").openPopup();

    map.setView([lat, lng], 17);
    calculateDistance();
}

function calculateDistance() {
    const R = 6371;
    const dLat = deg2rad(userLat - STORE_LAT);
    const dLon = deg2rad(userLng - STORE_LNG);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(STORE_LAT)) * Math.cos(deg2rad(userLat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceKm = R * c;

    document.getElementById("distanceInfo").innerHTML = `
        <ion-icon name="information-circle-outline" style="vertical-align: middle; color: #ee4d2d; margin-right: 5px;"></ion-icon>
        Jarak: ${distanceKm.toFixed(2)} km dari toko
    `;
    updateShippingOptions();
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function updateShippingOptions() {
    document.querySelectorAll('input[name="shipping"]').forEach(radio => {
        const type = radio.value;
        const rateConfig = RATES[type];

        let cost = distanceKm < 4 ? rateConfig.flatUnder4km : Math.ceil(distanceKm * rateConfig.perKm);

        const label = radio.closest('.shipping-option');
        label.querySelector('.ship-price').textContent = formatRupiah(cost);
        radio.dataset.cost = cost;
    });

    const selected = document.querySelector('input[name="shipping"]:checked');
    if (selected) updateTotalPayment();
}

function updateTotalPayment() {
    const subtotal = parseHarga(summarySubtotalEl.textContent);
    const selectedShipping = document.querySelector('input[name="shipping"]:checked');
    let shippingCost = 0;

    if (selectedShipping && distanceKm > 0) {
        shippingCost = parseInt(selectedShipping.dataset.cost);
    }

    voucherDiscount = 0;
    if (appliedVoucher) {
        const voucher = VOUCHERS[appliedVoucher];
        if (voucher.type === 'percentage') {
            voucherDiscount = Math.floor(subtotal * voucher.value / 100);
        } else if (voucher.type === 'fixed') {
            voucherDiscount = voucher.value;
        } else if (voucher.type === 'free_shipping') {
            voucherDiscount = shippingCost;
        }
    }

    summaryShippingEl.textContent = formatRupiah(shippingCost);

    if (voucherDiscount > 0) {
        document.getElementById('discountRow').style.display = 'flex';
        document.getElementById('summaryDiscount').textContent = '-' + formatRupiah(voucherDiscount);
    } else {
        document.getElementById('discountRow').style.display = 'none';
    }

    const total = subtotal + shippingCost - voucherDiscount;
    summaryTotalEl.textContent = formatRupiah(Math.max(0, total));
}

document.querySelectorAll('input[name="shipping"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        document.querySelectorAll('.shipping-option').forEach(el => {
            el.style.borderColor = '#ddd';
            el.style.background = '#fff';
        });

        const label = e.target.closest('.shipping-option');
        label.style.borderColor = '#ee4d2d';
        label.style.background = '#fef6f5';

        if (distanceKm === 0) {
            alert("Silakan pilih lokasi pengiriman di peta terlebih dahulu.");
            e.target.checked = false;
            return;
        }
        updateTotalPayment();
    });
});

// Voucher
document.getElementById('btnApplyVoucher').addEventListener('click', () => {
    const code = document.getElementById('voucherInput').value.trim().toUpperCase();
    const statusEl = document.getElementById('voucherStatus');

    if (!code) {
        statusEl.style.display = 'block';
        statusEl.style.background = '#fff3cd';
        statusEl.style.color = '#856404';
        statusEl.textContent = 'Masukkan kode voucher terlebih dahulu';
        return;
    }

    const voucher = VOUCHERS[code];
    if (!voucher) {
        statusEl.style.display = 'block';
        statusEl.style.background = '#f8d7da';
        statusEl.style.color = '#721c24';
        statusEl.textContent = 'Kode voucher tidak valid';
        appliedVoucher = null;
        document.getElementById('voucherCode').textContent = '';
        updateTotalPayment();
        return;
    }

    const subtotal = parseHarga(summarySubtotalEl.textContent);
    if (voucher.minPurchase > 0 && subtotal < voucher.minPurchase) {
        statusEl.style.display = 'block';
        statusEl.style.background = '#fff3cd';
        statusEl.style.color = '#856404';
        statusEl.textContent = `Minimal belanja ${formatRupiah(voucher.minPurchase)} untuk voucher ini`;
        appliedVoucher = null;
        document.getElementById('voucherCode').textContent = '';
        updateTotalPayment();
        return;
    }

    appliedVoucher = code;
    document.getElementById('voucherCode').textContent = code;
    statusEl.style.display = 'block';
    statusEl.style.background = '#d4edda';
    statusEl.style.color = '#155724';
    statusEl.textContent = `✓ Voucher "${voucher.desc}" berhasil diterapkan!`;
    updateTotalPayment();
});

document.getElementById("btnPlaceOrder").addEventListener("click", () => {
    // Validation
    if (!userLat || !userLng) {
        alert("Mohon tentukan lokasi pengiriman di peta.");
        return;
    }
    if (!document.querySelector('input[name="shipping"]:checked')) {
        alert("Pilih metode pengiriman.");
        return;
    }

    const selectedItems = keranjang.filter(item => item.selected);
    if (selectedItems.length === 0) {
        alert("Pilih minimal satu produk untuk checkout.");
        return;
    }

    // Get form data
    const nameInput = document.getElementById('inputName') || document.querySelector('input[placeholder="Nama Lengkap"]');
    const phoneInput = document.getElementById('inputPhone');
    const addressInput = document.querySelector('input[placeholder="Jalan, No. Rumah, RT/RW"]');
    const landmarkInput = document.querySelector('input[placeholder*="Patokan"]');

    if (!nameInput || !nameInput.value.trim()) {
        alert("Mohon isi Nama Penerima.");
        return;
    }
    if (!phoneInput || !phoneInput.value.trim()) {
        alert("Mohon isi Nomor Telepon / WhatsApp.");
        return;
    }
    if (!addressInput || !addressInput.value.trim()) {
        alert("Mohon isi Alamat Lengkap.");
        return;
    }

    // Generate order number
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 900) + 100;
    const orderNumber = `ORD-${dateStr}-${randomNum}`;

    // Get shipping info
    const selectedShipping = document.querySelector('input[name="shipping"]:checked');
    const shippingMethod = selectedShipping.value;
    const shippingCost = parseInt(selectedShipping.dataset.cost);

    // Calculate totals
    const subtotal = parseHarga(summarySubtotalEl.textContent);
    const discount = voucherDiscount;
    const total = Math.max(0, subtotal + shippingCost - discount);

    // Prepare order object for API
    const orderData = {
        orderNumber: orderNumber,
        date: now.toISOString(),
        items: selectedItems.map(item => ({
            product_id: item.id || null,
            nama: item.nama,
            harga: parseHarga(item.harga),
            jumlah: item.jumlah,
            catatan: item.catatan || ''
        })),
        subtotal: subtotal,
        shipping: {
            method: shippingMethod,
            cost: shippingCost
        },
        discount: discount,
        voucherCode: appliedVoucher || '',
        total: total,
        address: {
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            address: addressInput.value.trim(),
            landmark: landmarkInput ? landmarkInput.value.trim() : '',
            latitude: userLat,
            longitude: userLng
        },
        distance: distanceKm,
        paymentMethod: 'cod' // Default, will be selected on order success page
    };

    // Show loading
    const btn = document.getElementById('btnPlaceOrder');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Memproses...';

    // Send to API
    fetch('api/orders/create.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Save to localStorage for order success page
                localStorage.setItem('currentOrder', JSON.stringify(orderData));

                // Clear cart
                localStorage.setItem('keranjang', JSON.stringify([]));

                // Redirect to order success page
                window.location.href = 'order-success.html';
            } else {
                throw new Error(data.message || 'Gagal membuat pesanan');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // REMOVED FALLBACK to force user to see API error
            alert('Gagal membuat pesanan: ' + error.message + '\n\nMohon periksa: \n1. Koneksi Internet\n2. Hapus isi keranjang dan pilih ulang produk (data lama mungkin error).');
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
        });
});

// Initialize
keranjang = keranjang.map(item => ({ ...item, selected: true }));
localStorage.setItem("keranjang", JSON.stringify(keranjang));
renderKeranjang();
