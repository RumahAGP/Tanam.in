const tbody = document.getElementById("keranjangContent");
let keranjang = JSON.parse(localStorage.getItem("keranjang")) || [];

function parseHarga(hargaStr) {
    return parseInt(hargaStr.replace(/\D/g, ''));
}

function tampilkanKeranjang() {
    tbody.innerHTML = "";
    let total = 0;

    if (keranjang.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Keranjangmu kosong.</td></tr>`;
    } else {
        keranjang.forEach((item, index) => {
            const hargaAngka = parseHarga(item.harga);
            const totalItem = hargaAngka * item.jumlah;
            total += totalItem;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <img src="${item.gambar}" alt="${item.nama}" style="width:70px; border-radius:8px; vertical-align:middle;">
                    <span style="margin-left:10px;">${item.nama}</span>
                </td>
                <td>${item.harga}</td>
                <td>
                    <input type="number" min="1" value="${item.jumlah}" data-index="${index}" class="input-jumlah" style="width:60px; text-align:center;">
                </td>
                <td class="subtotal">Rp ${totalItem.toLocaleString()}</td>
                <td><button data-index="${index}" class="hapus-item">Hapus</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Update total harga
    updateTotal();

    // Event listener untuk input jumlah
    document.querySelectorAll(".input-jumlah").forEach(input => {
        input.addEventListener("input", (e) => {
            const idx = e.target.dataset.index;
            let value = parseInt(e.target.value);
            if (isNaN(value) || value < 1) value = 1;
            keranjang[idx].jumlah = value;
            localStorage.setItem("keranjang", JSON.stringify(keranjang));
            // Update subtotal baris itu
            const tr = e.target.closest("tr");
            const hargaAngka = parseHarga(keranjang[idx].harga);
            tr.querySelector(".subtotal").textContent = `Rp ${(hargaAngka * value).toLocaleString()}`;
            // Update total keseluruhan
            updateTotal();
        });
    });

    // Event listener untuk hapus item
    document.querySelectorAll(".hapus-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = e.target.dataset.index;
            keranjang.splice(idx, 1);
            localStorage.setItem("keranjang", JSON.stringify(keranjang));
            tampilkanKeranjang();
        });
    });
}

// Fungsi update total
function updateTotal() {
    const total = keranjang.reduce((sum, item) => sum + parseHarga(item.harga) * item.jumlah, 0);
    document.getElementById("totalHarga").textContent = total.toLocaleString();
}

// Jalankan pertama kali
tampilkanKeranjang();
