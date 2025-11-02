document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");
  const products = document.querySelectorAll(".product-card");

  if (!searchBtn || !searchInput) {
    console.error("Elemen pencarian tidak ditemukan di halaman ini.");
    return;
  }

  // Saat tombol diklik
  searchBtn.addEventListener("click", function () {
    const keyword = searchInput.value.toLowerCase().trim();

    // Jika input kosong, tampilkan semua produk
    if (keyword === "") {
      products.forEach((product) => (product.style.display = "block"));
      return;
    }

    let adaHasil = false;

    products.forEach((product) => {
      const title = product.querySelector("h3").textContent.toLowerCase();
      const desc = product.querySelector("p").textContent.toLowerCase();

      if (title.includes(keyword) || desc.includes(keyword)) {
        product.style.display = "block";
        adaHasil = true;
      } else {
        product.style.display = "none";
      }
    });

    if (!adaHasil) {
      alert("Produk tidak ditemukan untuk kata kunci: " + keyword);
    }
  });

  // Bonus: tekan Enter juga bisa mencari
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchBtn.click();
    }
  });
});
