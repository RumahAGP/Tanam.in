const dataProduk = {
    cabai: {
        nama: "Benih Cabai",
        harga: "Rp 500",
        hargaLama: "Rp 1.500",
        deskripsi: " Benih cabai berkualitas tinggi dengan daya tumbuh di atas 90% cocok untuk ditanam di dataran rendah maupun tinggi, tahan penyakit,dan menghasilkan buah pedas aromatik",

        
        gambar: [
            "assets/Chili.jpg",
            "assets/Chili2.jpg",
            "assets/Chili3.jpg"
        ]
    },
 bayem: {
        nama: "Benih bayem",
        harga: "Rp 250",
        hargaLama: "Rp 500",
        deskripsi: "Benih bayam berkualitas tinggi dengan daya tumbuh di atas 90% cocok untuk ditanam di dataran rendah maupun tinggi, tahan penyakit,dan menghasilkan daun bayam hijau yang berkualitas",

        
        gambar: [
            "assets/bayem cover yang ini aja.jpeg",
            "assets/Chili2.jpg",
            "assets/Chili3.jpg"
        ]
    },
      jagung: {
        nama: "Benih jagung",
        harga: "Rp 500",
        hargaLama: "Rp 750",
        deskripsi: "Benih Jagung berkualitas tinggi dengan daya tumbuh di atas 90% tahan penyakit,dan menghasilkan jagung yang berkualitas",

        
        gambar: [
            "assets/cover.jpeg",
            "assets/Chili2.jpg",
            "assets/Chili3.jpg"
        ]
    },


    sawi: {
    nama: "Benih Sawi",
    harga: "Rp 1.500",
    hargaLama: "Rp 2.000",
    deskripsi: "Bibit Sawi unggul dengan daya tumbuh di atas 90%, tahan terhadap hama dan penyakit, serta menghasilkan daun yang hijau segar, tebal, dan bernutrisi tinggi.",
    gambar: [
        "assets/sawi.jpeg",
        "assets/sawi2.jpeg",
        "assets/sawi3.jpeg"
    ]
},

pare: {
    nama: "Benih pare",
    harga: "Rp 1.500",
    hargaLama: "Rp 2.000",
    deskripsi: "Bibit pare unggul dengan daya tumbuh di atas 90%, tahan terhadap hama dan penyakit, serta menghasilkan daun yang hijau segar, tebal, dan bernutrisi tinggi.",
    gambar: [
        "assets/cover pare.jpeg",
        "assets/sawi2.jpeg",
        "assets/sawi3.jpeg"
    ]
},



    Kangkung: {
        nama: "Benih kangkung",
        harga: "Rp 500",
        hargaLama: "Rp 750",
        deskripsi: "Bibit Kangkung unggul dengan daya tumbuh tinggi di atas 90%, tahan terhadap hama dan cuaca ekstrem, serta menghasilkan daun yang hijau segar dan lebat.",

        
        gambar: [
            "assets/cover.jpeg",
            "assets/Chili2.jpg",
            "assets/Chili3.jpg"
        ]
    },

    tomat: {
        nama: "Benih Tomat",
        harga: "Rp 1.000",
        hargaLama: "Rp 1.500",
        deskripsi: "Benih tomat unggul yang cepat tumbuh, tahan penyakit, dan menghasilkan buah merah segar dengan rasa manis alami.",
        gambar: [
            "assets/tomat cover.jpeg",
            "assets/tomat2.jpeg",
            "assets/tomat3.jpeg"
        ]
    },

    terong: {
        nama: "Benih Terong",
        harga: "Rp 1.000",
        hargaLama: "Rp 1.500",
        deskripsi: "Benih terong unggul dengan daya tumbuh tinggi, tahan cuaca ekstrem, dan menghasilkan buah besar serta mengkilap.",
        gambar: [
            "assets/cover terong.jpeg",
            "assets/terong2.jpeg",
            "assets/terong3.jpeg"
        ]
    },

    mentimun: {
        nama: "Benih Mentimun",
        harga: "Rp 800",
        hargaLama: "Rp 1.200",
        deskripsi: "Benih mentimun unggul dengan hasil panen tinggi, tahan penyakit, dan menghasilkan buah renyah serta segar.",
        gambar: [
            "assets/ cover mentimun.jpeg",
            "assets/mentimun2.jpeg",
            "assets/mentimun3.jpeg"
        ]
    },

    kacangpanjang: {
        nama: "Benih Kacang Panjang",
        harga: "Rp 1.000",
        hargaLama: "Rp 1.500",
        deskripsi: "Benih kacang panjang unggul dengan daya tumbuh tinggi, tahan penyakit, dan menghasilkan polong panjang serta renyah.",
        gambar: [
            "assets/ cover_kacang.jpeg",
            "assets/kacangpanjang2.jpeg",
            "assets/kacangpanjang3.jpeg"
        ]
    },





};

const url = new URLSearchParams(window.location.search);
const idProduk = url.get("id");
const produk = dataProduk[idProduk];

if (!produk) {
    document.body.innerHTML = "<h1>beloman lih</h1>";
}

document.getElementById("namaProduk").textContent = produk.nama;
document.getElementById("hargaProduk").textContent = produk.harga;
document.getElementById("deskripsiProduk").textContent = produk.deskripsi;

if (produk.hargaLama) {
    document.getElementById("hargaLama").textContent = produk.hargaLama;
    document.getElementById("hargaLama").style.display = "inline-block";
}

document.getElementById("gambarUtama").src = produk.gambar[0];

produk.gambar.forEach(src => {
    let thumb = document.createElement("img");
    thumb.src = src;
    thumb.className = "thumb";
    thumb.onclick = () => document.getElementById("gambarUtama").src = src;
    document.querySelector(".daftar-thumbnail").appendChild(thumb);
});

// Ambil elemen tombol dan input jumlah
const btnKeranjang = document.getElementById("btnKeranjang");
const jumlahInput = document.getElementById("jumlah");

// Event klik tombol tambah ke keranjang
btnKeranjang.addEventListener("click", () => {
    const jumlah = parseInt(jumlahInput.value);

    // Ambil keranjang dari localStorage atau buat baru
    let keranjang = JSON.parse(localStorage.getItem("keranjang")) || [];

    // Cek apakah produk sudah ada di keranjang
    const index = keranjang.findIndex(item => item.id === idProduk);
    if (index !== -1) {
        keranjang[index].jumlah += jumlah; // tambahkan jumlah
    } else {
        keranjang.push({
            id: idProduk,
            nama: produk.nama,
            harga: produk.harga,
            jumlah: jumlah,
            gambar: produk.gambar[0]
        });
    }

    // Simpan kembali ke localStorage
    localStorage.setItem("keranjang", JSON.stringify(keranjang));

    // Feedback ke user tanpa pindah halaman
    alert(`${produk.nama} berhasil ditambahkan ke keranjang!`);
});

