// Orders Page - JavaScript

// Format Rupiah
function formatRupiah(num) {
    return 'Rp' + num.toLocaleString('id-ID');
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('id-ID', options);
}

// Get Status Info
function getStatusInfo(status) {
    const statusMap = {
        'pending': { label: 'Menunggu', class: 'status-pending' },
        'processing': { label: 'Diproses', class: 'status-processing' },
        'shipped': { label: 'Dikirim', class: 'status-shipped' },
        'delivered': { label: 'Selesai', class: 'status-delivered' },
        'cancelled': { label: 'Dibatalkan', class: 'status-cancelled' }
    };
    return statusMap[status] || statusMap['pending'];
}

// Capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Load orders from API or localStorage
let allOrders = [];

// Fetch orders from database
fetch('api/orders/read.php')
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            allOrders = data.data;
            allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
            renderOrders(allOrders);
        } else {
            throw new Error('Failed to load orders');
        }
    })
    .catch(error => {
        console.error('Error loading from API:', error);
        // Fallback to localStorage
        allOrders = JSON.parse(localStorage.getItem('orderHistory')) || [];
        allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
        renderOrders(allOrders);
    });

// Render orders
function renderOrders(orders) {
    const ordersGrid = document.getElementById('ordersGrid');
    const emptyState = document.getElementById('emptyState');
    const orderCount = document.getElementById('orderCount');

    // Update count
    orderCount.textContent = orders.length;

    if (orders.length === 0) {
        ordersGrid.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }

    emptyState.classList.remove('show');
    ordersGrid.innerHTML = '';

    orders.forEach(order => {
        const statusInfo = getStatusInfo(order.status || 'pending');
        const itemsCount = order.items.length;
        const itemsText = itemsCount === 1 ? '1 item' : `${itemsCount} items`;

        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <div class="order-card-header">
                <div>
                    <div class="order-number">#${order.orderNumber}</div>
                    <div class="order-date">${formatDate(order.date)}</div>
                </div>
                <span class="status-badge ${statusInfo.class}">${statusInfo.label}</span>
            </div>
            
            <div class="order-items-summary">
                <p><strong>${itemsText}</strong></p>
                ${order.items.slice(0, 2).map(item => `
                    <p style="color: #666; font-size: 13px;">• ${item.nama} (${item.jumlah}x)</p>
                `).join('')}
                ${order.items.length > 2 ? `<p style="color: #999; font-size: 12px;">...dan ${order.items.length - 2} item lainnya</p>` : ''}
            </div>
            
            <div class="order-total">
                ${formatRupiah(order.total)}
            </div>
            
            <div class="order-actions">
                <button class="btn-detail" onclick="viewOrderDetail('${order.orderNumber}')">
                    <ion-icon name="eye-outline" style="vertical-align: middle;"></ion-icon> Lihat Detail
                </button>
                <button class="btn-whatsapp" onclick="contactWhatsApp('${order.orderNumber}')">
                    <ion-icon name="logo-whatsapp" style="vertical-align: middle;"></ion-icon> Hubungi
                </button>
            </div>
        `;

        ordersGrid.appendChild(card);
    });
}

// View Order Detail
function viewOrderDetail(orderNumber) {
    // Save the order number to view
    localStorage.setItem('viewingOrder', orderNumber);
    // Redirect to order success page with the specific order
    window.location.href = `order-success.html?order=${orderNumber}`;
}

// Contact WhatsApp
function contactWhatsApp(orderNumber) {
    const order = allOrders.find(o => o.orderNumber === orderNumber);
    if (!order) return;

    const statusInfo = getStatusInfo(order.status || 'pending');

    let message = `Halo Admin BenihKu! 🌱\n\n`;
    message += `Saya ingin tanya tentang pesanan:\n`;
    message += `Order: #${order.orderNumber}\n`;
    message += `Tanggal: ${formatDate(order.date)}\n`;
    message += `Status: ${statusInfo.label}\n`;
    message += `Total: ${formatRupiah(order.total)}\n\n`;
    message += `Mohon infonya. Terima kasih!`;

    const waNumber = '6287714040944';
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
}

// Search functionality
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();

    if (searchTerm === '') {
        renderOrders(allOrders);
        return;
    }

    const filtered = allOrders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm)
    );

    renderOrders(filtered);
});

// Note: Initial render happens in fetch callback
