// Order Success Page - JavaScript

// Format Rupiah
function formatRupiah(num) {
    return 'Rp' + num.toLocaleString('id-ID');
}

// Load order data from localStorage
const orderData = JSON.parse(localStorage.getItem('currentOrder'));

if (!orderData) {
    // No order data, redirect back to cart
    alert('Tidak ada data pesanan. Silakan buat pesanan terlebih dahulu.');
    window.location.href = 'keranjang.html';
} else {
    // Display order data
    displayOrder(orderData);

    // Save to order history (with status)
    if (!orderData.status) {
        orderData.status = 'pending';
    }

    const orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];

    // Check if already saved (prevent duplicates)
    const exists = orderHistory.some(o => o.orderNumber === orderData.orderNumber);
    if (!exists) {
        orderHistory.unshift(orderData); // Add to beginning
        localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    }
}

function displayOrder(order) {
    // Order Number and Date
    document.getElementById('orderNumber').textContent = `Order: #${order.orderNumber}`;
    document.getElementById('orderDate').textContent = formatDate(order.date);

    // Order Items
    const tbody = document.getElementById('orderItemsBody');
    tbody.innerHTML = '';

    order.items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.nama}</td>
            <td>${formatRupiah(item.harga)}</td>
            <td>${item.jumlah}</td>
            <td style="text-align: right; font-weight: 600;">${formatRupiah(item.harga * item.jumlah)}</td>
        `;
        tbody.appendChild(row);
    });

    // Order Summary
    document.getElementById('summarySubtotal').textContent = formatRupiah(order.subtotal);
    document.getElementById('summaryShipping').textContent = formatRupiah(order.shipping.cost);
    document.getElementById('shippingMethod').textContent = `Ongkir (${capitalizeFirst(order.shipping.method)} - ${order.distance.toFixed(1)} km)`;

    if (order.discount > 0) {
        document.getElementById('discountRow').style.display = 'flex';
        document.getElementById('summaryDiscount').textContent = '-' + formatRupiah(order.discount);
    }

    document.getElementById('summaryTotal').textContent = formatRupiah(order.total);

    // Shipping Address
    const addressBox = document.getElementById('addressBox');
    addressBox.innerHTML = `
        <p style="font-weight: 600; margin-bottom: 8px;">${order.address.name}</p>
        <p>${order.address.address}</p>
        ${order.address.landmark ? `<p style="color: #666;">📍 Patokan: ${order.address.landmark}</p>` : ''}
        <p style="margin-top: 8px; color: #666; font-size: 14px;">Jarak dari toko: ${order.distance.toFixed(2)} km</p>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('id-ID', options);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Payment Method Selection
const paymentOptions = document.querySelectorAll('.payment-option');
const transferDetails = document.getElementById('transferDetails');
const ewalletDetails = document.getElementById('ewalletDetails');

paymentOptions.forEach(option => {
    option.addEventListener('click', () => {
        // Remove selected class from all
        paymentOptions.forEach(opt => opt.classList.remove('selected'));

        // Add selected class to clicked
        option.classList.add('selected');

        // Check the radio button
        const radio = option.querySelector('input[type="radio"]');
        radio.checked = true;

        // Show/hide payment details
        const method = option.dataset.method;
        transferDetails.classList.remove('show');
        ewalletDetails.classList.remove('show');

        if (method === 'transfer') {
            transferDetails.classList.add('show');
        } else if (method === 'ewallet') {
            ewalletDetails.classList.add('show');
        }
    });
});

// WhatsApp Confirmation
document.getElementById('btnWhatsApp').addEventListener('click', () => {
    if (!orderData) {
        alert('Data pesanan tidak ditemukan');
        return;
    }

    const selectedPayment = document.querySelector('input[name="payment"]:checked').value;
    let paymentMethod = '';

    if (selectedPayment === 'cod') {
        paymentMethod = 'COD (Bayar di Tempat)';
    } else if (selectedPayment === 'transfer') {
        paymentMethod = 'Transfer Bank';
    } else if (selectedPayment === 'ewallet') {
        paymentMethod = 'E-Wallet (Gopay/OVO/Dana)';
    }

    // Generate WhatsApp message
    let message = `Halo Admin BenihKu! 🌱\n\n`;
    message += `*Pesanan Baru*\n`;
    message += `Order: #${orderData.orderNumber}\n`;
    message += `Tanggal: ${formatDate(orderData.date)}\n\n`;

    message += `*Produk:*\n`;
    orderData.items.forEach(item => {
        message += `- ${item.nama} x ${item.jumlah} = ${formatRupiah(item.harga * item.jumlah)}\n`;
    });

    message += `\n*Ringkasan:*\n`;
    message += `Subtotal: ${formatRupiah(orderData.subtotal)}\n`;
    message += `Ongkir (${capitalizeFirst(orderData.shipping.method)} - ${orderData.distance.toFixed(1)} km): ${formatRupiah(orderData.shipping.cost)}\n`;

    if (orderData.discount > 0) {
        message += `Diskon: -${formatRupiah(orderData.discount)}\n`;
    }

    message += `*TOTAL: ${formatRupiah(orderData.total)}*\n\n`;

    message += `*Alamat Pengiriman:*\n`;
    message += `${orderData.address.name}\n`;
    message += `${orderData.address.address}\n`;

    if (orderData.address.landmark) {
        message += `Patokan: ${orderData.address.landmark}\n`;
    }

    message += `\n*Metode Pembayaran:* ${paymentMethod}\n\n`;
    message += `Mohon dikonfirmasi. Terima kasih! 🙏`;

    // WhatsApp number (ganti dengan nomor toko)
    const waNumber = '6287714040944'; // Nomor WhatsApp toko
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp
    window.open(waUrl, '_blank');
});

// Mark as first time viewing (to prevent re-clearing cart)
if (!sessionStorage.getItem('orderViewed')) {
    sessionStorage.setItem('orderViewed', 'true');
}
