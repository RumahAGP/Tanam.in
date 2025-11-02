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