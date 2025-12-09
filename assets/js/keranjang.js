const tbody = document.getElementById("keranjangContent");
const btnPesan = document.getElementById("btnPesan");
const btnPakaiVoucher = document.getElementById("btnPakaiVoucher");
const inputVoucher = document.getElementById("kodeVoucher");
const subtotalEl = document.getElementById("subtotalHarga");
const diskonEl = document.getElementById("diskonHarga");
const diskonRow = document.getElementById("diskonRow");
const totalEl = document.getElementById("totalHarga");

let keranjang = JSON.parse(localStorage.getItem("keranjang")) || [];
let activeVoucher = null; // { code: "ABC", type: "percent/flat", value: 10 }

// Daftar Voucher (Bisa dipindah ke database/API nantinya)
const VOUCHERS = {
    "BENIH10": { type: "percent", value: 10 },
    "ONGKIRFREE": { type: "flat", value: 10000 },
    "CASHBACK15": { type: "percent", value: 15 },
    "BENIH20": { type: "percent", value: 20 },
    "MEMBER25": { type: "percent", value: 25 },
    "HBD50K": { type: "flat", value: 50000 },
    "FLASH40": { type: "percent", value: 40 },
    "WEEKEND30": { type: "percent", value: 30 },
    "NEWUSER20": { type: "percent", value: 20 },
    "B2G1BENIH": { type: "flat", value: 0 }, // Logic 'Buy 2 Get 1' agak kompleks, kita skip dulu atau anggap diskon 0 utk sekarang
};

function parseHarga(hargaStr) {
    if (!hargaStr) return 0;
    return parseInt(hargaStr.replace(/\D/g, ''));
}

function formatRupiah(number) {
    return "Rp " + number.toLocaleString('id-ID');
}

function hitungTotal() {
    let subtotal = 0;
    keranjang.forEach(item => {
        subtotal += parseHarga(item.harga) * item.jumlah;
    });
    return subtotal;
}

function updateSummary() {
    const subtotal = hitungTotal();
    let discountAmount = 0;

    if (activeVoucher) {
        if (activeVoucher.type === "percent") {
            discountAmount = subtotal * (activeVoucher.value / 100);
        } else if (activeVoucher.type === "flat") {
            discountAmount = activeVoucher.value;
        }
        // Pastikan diskon tidak melebihi subtotal
        if (discountAmount > subtotal) discountAmount = subtotal;
    }

    const finalTotal = subtotal - discountAmount;

    // Update UI
    if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);

    if (activeVoucher && diskonRow && diskonEl) {
        diskonRow.style.display = "flex"; // Show discount row
        diskonEl.textContent = "-" + formatRupiah(discountAmount);
    } else if (diskonRow) {
        diskonRow.style.display = "none";
    }

    if (totalEl) totalEl.textContent = formatRupiah(finalTotal);
}

function tampilkanKeranjang() {
    tbody.innerHTML = "";

    if (keranjang.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 30px;">Keranjangmu kosong. <a href="products.html" style="color:#2ecc71;">Belanja sekarang</a></td></tr>`;
    } else {
        keranjang.forEach((item, index) => {
            const hargaAngka = parseHarga(item.harga);
            const totalItem = hargaAngka * item.jumlah;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <div class="cart-product-info">
                        <img src="${item.gambar}" alt="${item.nama}" class="cart-product-img">
                        <div class="cart-product-details">
                            <span class="cart-product-name">${item.nama}</span>
                            <span class="cart-product-variant">Variasi: Default</span>
                        </div>
                    </div>
                </td>
                <td class="cart-price">${item.harga}</td>
                <td>
                    <div class="qty-control">
                        <button class="qty-btn minus" data-index="${index}">-</button>
                        <input type="number" min="1" value="${item.jumlah}" data-index="${index}" class="qty-input">
                        <button class="qty-btn plus" data-index="${index}">+</button>
                    </div>
                </td>
                <td class="cart-total-price">Rp ${totalItem.toLocaleString('id-ID')}</td>
                <td><button data-index="${index}" class="btn-delete">Hapus</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    updateSummary();
    setupEventListeners();
}

function setupEventListeners() {
    // Quantity Input Change
    document.querySelectorAll(".qty-input").forEach(input => {
        input.addEventListener("change", (e) => {
            updateQuantity(e.target.dataset.index, parseInt(e.target.value));
        });
    });

    // Plus Button
    document.querySelectorAll(".qty-btn.plus").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = e.target.dataset.index;
            updateQuantity(idx, keranjang[idx].jumlah + 1);
        });
    });

    // Minus Button
    document.querySelectorAll(".qty-btn.minus").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = e.target.dataset.index;
            updateQuantity(idx, keranjang[idx].jumlah - 1);
        });
    });

    // Delete Button
    document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = e.target.dataset.index;
            if (confirm("Hapus item ini dari keranjang?")) {
                keranjang.splice(idx, 1);
                saveAndRender();
            }
        });
    });
}

function updateQuantity(index, newQty) {
    if (isNaN(newQty) || newQty < 1) newQty = 1;
    keranjang[index].jumlah = newQty;
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem("keranjang", JSON.stringify(keranjang));
    tampilkanKeranjang();
}

// Voucher Logic
if (btnPakaiVoucher) {
    btnPakaiVoucher.addEventListener("click", () => {
        const code = inputVoucher.value.toUpperCase().trim();
        if (!code) {
            alert("Masukkan kode voucher terlebih dahulu.");
            return;
        }

        if (VOUCHERS[code]) {
            activeVoucher = { code: code, ...VOUCHERS[code] };
            alert(`Voucher ${code} berhasil dipasang!`);
            updateSummary();
        } else {
            alert("Kode voucher tidak valid atau kedaluwarsa.");
            activeVoucher = null;
            updateSummary();
        }
    });
}

// Checkout Logic (WhatsApp)
if (btnPesan) {
    btnPesan.addEventListener("click", () => {
        if (keranjang.length === 0) {
            alert("Keranjang belanja masih kosong!");
            return;
        }

        const nama = document.getElementById("nama").value;
        const telepon = document.getElementById("telepon").value;
        const alamat = document.getElementById("alamat").value;
        const patokan = document.getElementById("patokan").value;

        if (!nama || !telepon || !alamat) {
            alert("Mohon lengkapi Nama, Telepon, dan Alamat Pengiriman.");
            return;
        }

        let message = `*Halo BenihKu, Saya ingin memesan:*\n\n`;
        let subtotal = 0;

        keranjang.forEach(item => {
            const harga = parseHarga(item.harga);
            const itemTotal = harga * item.jumlah;
            subtotal += itemTotal;
            message += `- ${item.nama} (${item.jumlah}x) = ${formatRupiah(itemTotal)}\n`;
        });

        message += `\nSubtotal: ${formatRupiah(subtotal)}\n`;

        if (activeVoucher) {
            // Recalculate discount for message
            let discountAmount = 0;
            if (activeVoucher.type === "percent") {
                discountAmount = subtotal * (activeVoucher.value / 100);
            } else if (activeVoucher.type === "flat") {
                discountAmount = activeVoucher.value;
            }
            if (discountAmount > subtotal) discountAmount = subtotal;

            message += `Voucher (${activeVoucher.code}): -${formatRupiah(discountAmount)}\n`;
            subtotal -= discountAmount;
        }

        message += `*Total Bayar: ${formatRupiah(subtotal)}*\n\n`;
        message += `*Data Pengiriman:*\n`;
        message += `Nama: ${nama}\n`;
        message += `Telepon: ${telepon}\n`;
        message += `Alamat: ${alamat}\n`;
        if (patokan) message += `Patokan: ${patokan}\n`;

        const waUrl = `https://wa.me/6287714040944?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
    });
}

tampilkanKeranjang();
