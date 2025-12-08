document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get Product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        document.body.innerHTML = '<div style="text-align:center;margin-top:50px;"><h1>Produk tidak ditemukan</h1><a href="products.html">Kembali ke Katalog</a></div>';
        return;
    }

    try {
        // 2. Fetch Product Data
        const productResponse = await fetch(`api/products/read.php?product_id=${productId}&t=${new Date().getTime()}`);
        const productResult = await productResponse.json();

        if (!productResult.success || productResult.data.length === 0) {
            document.body.innerHTML = '<div style="text-align:center;margin-top:50px;"><h1>Produk tidak ditemukan</h1><a href="products.html">Kembali ke Katalog</a></div>';
            return;
        }

        const product = productResult.data[0];

        // 3. Populate Basic Info
        document.getElementById('namaProduk').textContent = product.nama;
        document.getElementById('hargaProduk').textContent = product.harga;
        document.getElementById('deskripsiProduk').textContent = product.deskripsi || 'Tidak ada deskripsi.';
        document.title = `${product.nama} - BenihKu`;

        // 4. Handle Images (Main + Gallery)
        const mainImageEl = document.getElementById('gambarUtama');
        const thumbnailContainer = document.querySelector('.daftar-thumbnail');

        // Default main image from product table
        let mainImageSrc = product.gambar ? product.gambar : 'assets/img/placeholder.svg';
        mainImageEl.src = mainImageSrc;

        // Fetch Gallery Images
        try {
            const galleryResponse = await fetch(`api/products/gallery.php?product_id=${productId}&t=${new Date().getTime()}`);
            const galleryResult = await galleryResponse.json();

            // Clear existing thumbnails (if any)
            thumbnailContainer.innerHTML = '';

            let allImages = [];

            // If we have gallery images, use them
            if (galleryResult.success && galleryResult.data.length > 0) {
                galleryResult.data.forEach(img => {
                    allImages.push(img.image_url);
                });
            } else {
                // If no gallery, at least use the main image as a thumbnail? 
                // Or just keep the main image.
                if (product.gambar) allImages.push(product.gambar);
            }

            // If we found images, render thumbnails
            if (allImages.length > 0) {
                // Use the first image as main if not already set (or purely from gallery logic)
                // If gallery exists, the first one is likely primary.
                if (galleryResult.success && galleryResult.data.length > 0) {
                    mainImageEl.src = allImages[0];
                }

                allImages.forEach(src => {
                    const thumb = document.createElement('img');
                    thumb.src = src;
                    thumb.className = 'thumb';
                    thumb.alt = product.nama;
                    thumb.onclick = () => {
                        mainImageEl.src = src;
                        // Highlight active thumb logic could be added here
                    };
                    thumbnailContainer.appendChild(thumb);
                });
            }

        } catch (galleryError) {
            console.error('Error loading gallery:', galleryError);
        }

        // 5. Add to Cart Logic
        const btnKeranjang = document.getElementById('btnKeranjang');
        const jumlahInput = document.getElementById('jumlah');

        btnKeranjang.addEventListener('click', () => {
            // Auth check (optional here, usually cart is public but checkout needs login)
            // But let's check basic validity
            let jumlah = parseInt(jumlahInput.value);
            if (isNaN(jumlah) || jumlah < 1) jumlah = 1;

            // Add to LocalStorage Cart
            let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
            if (!Array.isArray(keranjang)) keranjang = [];

            const existingItemIndex = keranjang.findIndex(item => item.id == product.id);

            if (existingItemIndex !== -1) {
                keranjang[existingItemIndex].jumlah += jumlah;
            } else {
                keranjang.push({
                    id: product.id,
                    nama: product.nama,
                    harga: product.harga_raw, // Use raw numeric price
                    jumlah: jumlah,
                    gambar: mainImageEl.src, // Use current main image
                    selected: true
                });
            }

            localStorage.setItem('keranjang', JSON.stringify(keranjang));

            // Simple feedback
            const originalText = btnKeranjang.textContent;
            btnKeranjang.textContent = 'Berhasil Ditambahkan!';
            btnKeranjang.style.backgroundColor = '#28a745';

            setTimeout(() => {
                window.location.href = 'keranjang.html';
            }, 800);
        });

    } catch (error) {
        console.error('Error loading product detail:', error);
        document.body.innerHTML = '<div style="text-align:center;margin-top:50px;"><h1>Terjadi kesalahan</h1><p>Gagal memuat data produk.</p></div>';
    }
});
