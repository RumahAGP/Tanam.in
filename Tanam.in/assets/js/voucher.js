document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchVoucher");
  const searchBtn = document.getElementById("searchVoucherBtn");
  const vouchers = document.querySelectorAll(".voucher-card");

  if (!searchInput || !searchBtn) {
    console.error("Elemen input atau tombol pencarian voucher tidak ditemukan.");
    return;
  }

  function cariVoucher() {
    const keyword = searchInput.value.toLowerCase().trim();
    let ditemukan = false;

    vouchers.forEach((voucher) => {
      const title = voucher.querySelector("h3").textContent.toLowerCase();
      const desc = voucher.querySelector("p").textContent.toLowerCase();
      const code = voucher.querySelector("input").value.toLowerCase();

      // Cek apakah cocok dengan judul, deskripsi, atau kode
      if (title.includes(keyword) || desc.includes(keyword) || code.includes(keyword)) {
        voucher.style.display = "block";
        ditemukan = true;
      } else {
        voucher.style.display = "none";
      }
    });

    if (!ditemukan) {
      alert("Voucher tidak ditemukan untuk kata kunci: " + keyword);
    }
  }

  // Klik tombol
  searchBtn.addEventListener("click", cariVoucher);

  // Tekan Enter juga bisa
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") cariVoucher();
  });
});
