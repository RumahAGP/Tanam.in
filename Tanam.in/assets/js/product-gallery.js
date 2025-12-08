/**
 * Product Gallery Management for Admin
 * Handle multiple images upload, delete, and set primary
 * Triggers 'galleryUpdated' event on changes
 */

function triggerGalleryUpdate() {
    window.dispatchEvent(new CustomEvent('galleryUpdated'));
}

// Load product gallery images
async function loadProductGallery(productId) {
    try {
        const response = await fetch(`../api/products/gallery.php?product_id=${productId}`);
        const data = await response.json();

        const container = document.getElementById('edit_gallery_container');
        if (!container) return;

        container.innerHTML = '';

        if (data.success && data.data.length > 0) {
            data.data.forEach(img => {
                const div = document.createElement('div');
                div.className = 'gallery-image-item' + (img.is_primary == 1 ? ' primary' : '');
                div.innerHTML = `
                    <img src="../${img.image_url}" alt="Product image">
                    <button type="button" class="delete-img" onclick="deleteGalleryImage(${img.image_id})" title="Hapus foto">×</button>
                    ${img.is_primary == 1 ? '<div class="primary-badge">UTAMA</div>' : `<button type="button" class="set-primary-btn" onclick="setPrimaryImage(${img.image_id})" title="Jadikan foto utama">⭐</button>`}
                `;
                container.appendChild(div);
            });
        } else {
            container.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">Belum ada foto. Upload foto baru di bawah (max 7 foto).</p>';
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
        alert('Gagal memuat gallery: ' + error.message);
    }
}

// Delete gallery image
async function deleteGalleryImage(imageId) {
    if (!confirm('Hapus foto ini? Foto yang sudah dihapus tidak bisa dikembalikan.')) {
        return;
    }

    try {
        const response = await fetch(`../api/products/gallery.php?image_id=${imageId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            const productId = document.getElementById('edit_product_id').value;
            await loadProductGallery(productId);
            showMessage('Foto berhasil dihapus', 'success');
            triggerGalleryUpdate();
        } else {
            alert('Gagal menghapus: ' + data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Set image as primary
async function setPrimaryImage(imageId) {
    try {
        const response = await fetch(`../api/products/gallery.php`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `image_id=${imageId}`
        });
        const data = await response.json();

        if (data.success) {
            const productId = document.getElementById('edit_product_id').value;
            await loadProductGallery(productId);
            showMessage('Foto utama berhasil diubah', 'success');
            triggerGalleryUpdate();
        } else {
            alert('Gagal mengubah foto utama: ' + data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Upload new gallery images - MAX 7 PHOTOS
function setupGalleryUpload() {
    const input = document.getElementById('edit_images');
    if (!input) return;

    input.addEventListener('change', async function (e) {
        const files = e.target.files;
        if (files.length === 0) return;

        const productId = document.getElementById('edit_product_id').value;
        if (!productId) {
            alert('Product ID tidak ditemukan');
            return;
        }

        // ⭐ Check current photo count - MAX 5 photos
        const maxPhotos = 5;
        const currentPhotos = document.querySelectorAll('#edit_gallery_container .gallery-image-item').length;
        const remainingSlots = maxPhotos - currentPhotos;

        if (remainingSlots <= 0) {
            alert(`Maksimal ${maxPhotos} foto per produk!\nHapus foto lama dulu jika ingin upload baru.`);
            e.target.value = '';
            return;
        }

        if (files.length > remainingSlots) {
            alert(`Hanya bisa upload ${remainingSlots} foto lagi.\nSaat ini: ${currentPhotos}/${maxPhotos} foto.`);
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('product_id', productId);

        for (let i = 0; i < files.length; i++) {
            formData.append('images[]', files[i]);
        }

        // Show uploading indicator
        const btn = document.querySelector('#editProductForm button[type="submit"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Uploading ' + files.length + ' foto...';

        try {
            const response = await fetch('../api/products/gallery.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                showMessage(data.message + '!', 'success');
                await loadProductGallery(productId);
                e.target.value = '';
            } else {
                alert('Gagal upload: ' + data.message);
                if (data.errors && data.errors.length > 0) {
                    console.error('Upload errors:', data.errors);
                }
            }
        } catch (error) {
            alert('Error uploading: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

// Show temporary message
function showMessage(text, type = 'info') {
    const existingMsg = document.querySelector('.gallery-message');
    if (existingMsg) existingMsg.remove();

    const msg = document.createElement('div');
    msg.className = 'gallery-message ' + type;
    msg.textContent = text;
    msg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(msg);

    setTimeout(() => {
        msg.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => msg.remove(), 300);
    }, 2500);
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGalleryUpload);
} else {
    setupGalleryUpload();
}

// Add styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .gallery-image-item {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid #ddd;
        transition: all 0.2s;
    }
    
    .gallery-image-item:hover {
        border-color: #999;
        transform: scale(1.02);
    }
    
    .gallery-image-item img {
        width: 100%;
        height: 120px;
        object-fit: cover;
        display: block;
    }
    
    .gallery-image-item .delete-img {
        position: absolute;
        top: 5px; right: 5px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 50%;
        width: 28px; height: 28px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: all 0.2s;
    }
    
    .gallery-image-item .delete-img:hover {
        background: #c82333;
        transform: scale(1.1);
    }
    
    .gallery-image-item.primary {
        border-color: #28a745;
        border-width: 3px;
    }
    
    .gallery-image-item .primary-badge {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        background: #28a745;
        color: white;
        text-align: center;
        padding: 4px;
        font-size: 11px;
        font-weight: bold;
    }
    
    .gallery-image-item .set-primary-btn {
        position: absolute;
        bottom: 5px; left: 5px;
        background: rgba(255, 193, 7, 0.9);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .gallery-image-item .set-primary-btn:hover {
        background: #ffc107;
        transform: scale(1.05);
    }
    
    #edit_gallery_container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
        margin-bottom: 15px;
        min-height: 140px;
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
    }
`;
document.head.appendChild(style);
