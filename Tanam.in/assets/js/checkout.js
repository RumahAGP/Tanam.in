
// Store Location (Universitas Pamulang Viktor)
const STORE_LAT = -6.346286;
const STORE_LNG = 106.691763;

let map, marker;
let userLat = null;
let userLng = null;
let distanceKm = 0;

// Shipping Rates per KM
const RATES = {
    hemat: 500,
    express: 1000,
    instant: 2000
};

// Load Items
const checkoutItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];
const productListEl = document.getElementById("productList");
const subtotalEl = document.getElementById("subtotal");
const shippingCostEl = document.getElementById("shippingCost");
const totalPaymentEl = document.getElementById("totalPayment");
const distanceInfoEl = document.getElementById("distanceInfo");

function init() {
    if (checkoutItems.length === 0) {
        // alert("Tidak ada produk yang akan dibayar. Kembali ke keranjang.");
        // window.location.href = "keranjang.html";
        // return;
    }

    renderItems();
    initMap();
}

function renderItems() {
    let subtotal = 0;
    productListEl.innerHTML = "";

    checkoutItems.forEach(item => {
        const harga = parseInt(item.harga.replace(/\D/g, ''));
        const total = harga * item.jumlah;
        subtotal += total;

        const div = document.createElement("div");
        div.className = "checkout-item";
        div.innerHTML = `
            <img src="${item.gambar}" alt="${item.nama}">
            <div class="checkout-item-info">
                <h4>${item.nama}</h4>
                <p>${item.jumlah} x ${item.harga}</p>
            </div>
            <div class="checkout-item-price">
                Rp${total.toLocaleString("id-ID")}
            </div>
        `;
        productListEl.appendChild(div);
    });

    subtotalEl.textContent = "Rp" + subtotal.toLocaleString("id-ID");
    updateTotal();
}

function initMap() {
    // Initialize Leaflet Map
    map = L.map('map').setView([STORE_LAT, STORE_LNG], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add Store Marker
    L.marker([STORE_LAT, STORE_LNG]).addTo(map)
        .bindPopup("<b>Toko BenihKu</b><br>Universitas Pamulang Viktor").openPopup();

    // Click to set location
    map.on('click', function (e) {
        setUserLocation(e.latlng.lat, e.latlng.lng);
    });

    // Try HTML5 Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            setUserLocation(position.coords.latitude, position.coords.longitude);
        });
    }
}

function setUserLocation(lat, lng) {
    userLat = lat;
    userLng = lng;

    if (marker) {
        marker.setLatLng([lat, lng]);
    } else {
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.bindPopup("Lokasi Pengiriman").openPopup();

        marker.on('dragend', function (e) {
            const pos = e.target.getLatLng();
            setUserLocation(pos.lat, pos.lng);
        });
    }

    map.setView([lat, lng], 13);
    calculateDistance();
}

function calculateDistance() {
    // Haversine Formula
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(userLat - STORE_LAT);
    const dLon = deg2rad(userLng - STORE_LNG);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(STORE_LAT)) * Math.cos(deg2rad(userLat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceKm = R * c; // Distance in km

    distanceInfoEl.textContent = `Jarak: ${distanceKm.toFixed(2)} km dari toko`;
    updateShippingOptions();
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function updateShippingOptions() {
    document.querySelectorAll('input[name="shipping"]').forEach(radio => {
        const type = radio.value;
        const rate = RATES[type];
        const cost = Math.ceil(distanceKm * rate);

        const label = radio.closest('.shipping-option');
        label.querySelector('.ship-price').textContent = "Rp" + cost.toLocaleString("id-ID");
        radio.dataset.cost = cost;
    });

    // Trigger change to update total if one is selected
    const selected = document.querySelector('input[name="shipping"]:checked');
    if (selected) {
        updateTotal();
    }
}

function updateTotal() {
    const subtotal = parseInt(subtotalEl.textContent.replace(/\D/g, ''));
    const selectedShipping = document.querySelector('input[name="shipping"]:checked');
    let shippingCost = 0;

    if (selectedShipping && distanceKm > 0) {
        shippingCost = parseInt(selectedShipping.dataset.cost);
    }

    shippingCostEl.textContent = "Rp" + shippingCost.toLocaleString("id-ID");
    const total = subtotal + shippingCost;
    totalPaymentEl.textContent = "Rp" + total.toLocaleString("id-ID");
}

// Event Listeners for Shipping Selection
document.querySelectorAll('input[name="shipping"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        // Highlight active
        document.querySelectorAll('.shipping-option').forEach(el => el.classList.remove('active'));
        e.target.closest('.shipping-option').classList.add('active');

        if (distanceKm === 0) {
            alert("Silakan pilih lokasi pengiriman di peta terlebih dahulu.");
            e.target.checked = false;
            return;
        }
        updateTotal();
    });
});

document.getElementById("btnOrder").addEventListener("click", () => {
    const name = document.getElementById("inputName").value.trim();
    const phone = document.getElementById("inputPhone").value.trim();
    const address = document.getElementById("inputAddress").value.trim();

    if (!name || !phone || !address) {
        alert("Mohon lengkapi semua data alamat pengiriman (Nama, Telepon, Alamat).");
        return;
    }

    if (!userLat || !userLng) {
        alert("Mohon tentukan lokasi pengiriman di peta.");
        return;
    }
    if (!document.querySelector('input[name="shipping"]:checked')) {
        alert("Mohon pilih metode pengiriman.");
        return;
    }

    alert("Pesanan berhasil dibuat! Terima kasih telah berbelanja di BenihKu.");
    localStorage.removeItem("keranjang"); // Clear cart (or just checkout items)
    localStorage.removeItem("checkoutItems");
    window.location.href = "index.html";
});

init();
