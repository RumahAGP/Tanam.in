document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");
  const products = document.querySelectorAll(".product-card");

  // Helper function to perform search
  function performSearch(keyword) {
    keyword = keyword.toLowerCase().trim();
    let adaHasil = false;

    products.forEach((product) => {
      // Selector updated: Title is usually in .product-title or h3
      const titleEl = product.querySelector(".product-title") || product.querySelector("h3");
      const title = titleEl ? titleEl.textContent.toLowerCase() : "";

      // Optional: Search in category too
      const catEl = product.querySelector(".product-category");
      const category = catEl ? catEl.textContent.toLowerCase() : "";

      if (title.includes(keyword) || category.includes(keyword)) {
        product.style.display = "block";
        adaHasil = true;
      } else {
        product.style.display = "none";
      }
    });

    // Optional: Show "No Results" message if needed
    // if (!adaHasil && keyword !== "") { ... }
  }

  // 1. Check URL for search query (e.g., from Navbar search)
  const urlParams = new URLSearchParams(window.location.search);
  const queryParam = urlParams.get('q');

  if (queryParam) {
    if (searchInput) searchInput.value = queryParam;
    performSearch(queryParam);
  }

  if (!searchBtn || !searchInput) {
    return;
  }

  // 2. Click Event
  searchBtn.addEventListener("click", function () {
    performSearch(searchInput.value);
  });

  // 3. Enter Key Event
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch(searchInput.value);
    }
  });

  // 4. Real-time Search (Optional, if desired)
  searchInput.addEventListener("input", (e) => {
    performSearch(e.target.value);
  });
});
