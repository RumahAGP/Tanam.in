document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");
  const products = document.querySelectorAll(".product-card");

  // Function to perform search
  function performSearch(keyword) {
    if (!keyword) {
      products.forEach((product) => (product.style.display = "block"));
      return;
    }

    let adaHasil = false;
    products.forEach((product) => {
      const title = product.querySelector("h3") ? product.querySelector("h3").textContent.toLowerCase() : product.querySelector(".product-title").textContent.toLowerCase();
      // Handle different card structures (h3 vs .product-title)

      const desc = product.querySelector("p") ? product.querySelector("p").textContent.toLowerCase() : "";

      if (title.includes(keyword) || desc.includes(keyword)) {
        product.style.display = "block";
        adaHasil = true;
      } else {
        product.style.display = "none";
      }
    });

    if (!adaHasil) {
      // Optional: Show a message or just hide everything
      // alert("Produk tidak ditemukan untuk kata kunci: " + keyword);
    }
  }

  // Check URL params on load
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');

  if (query) {
    if (searchInput) searchInput.value = query;
    performSearch(query.toLowerCase().trim());
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", function (e) {
      // If inside a form, let the form submit naturally for URL update
      // But if we want instant client-side search without reload (if on products page):
      // e.preventDefault(); 
      // const keyword = searchInput.value.toLowerCase().trim();
      // performSearch(keyword);

      // For now, let's allow form submission to update URL, 
      // unless we want to prevent reload on the same page.
      // If we are on products.html, we can prevent default.
      if (window.location.pathname.includes("products.html")) {
        // e.preventDefault(); // Uncomment to stop reload
        // performSearch(searchInput.value.toLowerCase().trim());
        // Update URL without reload?
        // const newUrl = new URL(window.location);
        // newUrl.searchParams.set('q', searchInput.value);
        // window.history.pushState({}, '', newUrl);
      }
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        // searchBtn.click();
      }
    });

    // Real-time search (optional)
    searchInput.addEventListener("input", (e) => {
      performSearch(e.target.value.toLowerCase().trim());
    });
  }
});
