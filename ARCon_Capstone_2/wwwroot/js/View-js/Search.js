let currentPage = 1;
let totalPages = 1;
let initialSearch = "";
let debounceTimer;
let activePreset = "";

/* =========================
   DOM READY
========================= */

document.addEventListener("DOMContentLoaded", () => {



    /* =========================
   PRESET BUTTONS
========================= */

    document.getElementById("b1")
        ?.addEventListener("click", () => {

            activePreset = "newest";

            currentPage = 1;

            loadProducts();
        });

    document.getElementById("b2")
        ?.addEventListener("click", () => {

            activePreset = "best-deals";

            currentPage = 1;

            loadProducts();
        });

    document.getElementById("b3")
        ?.addEventListener("click", () => {

            activePreset = "special-picks";

            currentPage = 1;

            loadProducts();
        });

    document.getElementById("b4")
        ?.addEventListener("click", () => {

            activePreset = "favorites";

            currentPage = 1;

            loadProducts();
        });





    /* =========================
       INITIAL URL SEARCH
    ========================= */

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    initialSearch =
        urlParams.get("search") || "";

    const globalSearchInput =
        document.getElementById(
            "globalSearchInput"
        );

    if (
        initialSearch &&
        globalSearchInput
    ) {
        globalSearchInput.value =
            initialSearch;
    }

    /* =========================
       INITIAL LOAD
    ========================= */

    loadProducts();

    /* =========================
       FILTER EVENTS
    ========================= */

    const filtersContainer =
        document.querySelector(".filters");

    if (filtersContainer) {

        filtersContainer.addEventListener("change", () => {

            currentPage = 1;

            loadProducts();

        });
    }

    /* =========================
       PRICE INPUT EVENTS
    ========================= */

    const minPriceInput =
        document.getElementById(
            "minPrice"
        );

    const maxPriceInput =
        document.getElementById(
            "maxPrice"
        );

    [minPriceInput, maxPriceInput]
        .forEach(input => {

            if (!input) return;

            input.addEventListener("input", () => {

                clearTimeout(
                    debounceTimer
                );

                debounceTimer = setTimeout(() => {

                    currentPage = 1;

                    loadProducts();

                }, 500);

            });

        });

    /* =========================
       SORT EVENT
    ========================= */

    const sortSelect =
        document.getElementById(
            "sortSelect"
        );

    if (sortSelect) {

        sortSelect.addEventListener("change", () => {

            currentPage = 1;

            loadProducts();

        });
    }

    /* =========================
       SEARCH INPUT
    ========================= */

    if (globalSearchInput) {

        globalSearchInput.addEventListener("input", () => {

            clearTimeout(
                debounceTimer
            );

            debounceTimer = setTimeout(() => {

                currentPage = 1;

                updateUrl();

                loadProducts();

            }, 400);

        });
    }

});

/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {

    try {

        const params =
            new URLSearchParams();

        /* =========================
           URL PARAMS
        ========================= */

        const urlParams =
            new URLSearchParams(
                window.location.search
            );

        /* =========================
           SEARCH
        ========================= */

        const inputSearch =
            document.getElementById(
                "globalSearchInput"
            )
                ?.value
                ?.trim();

        const urlSearch =
            urlParams.get("search");

        const search =
            inputSearch ||
            urlSearch ||
            initialSearch;

        if (search) {

            params.append(
                "search",
                search
            );
        }

        /* =========================
           PRESET
        ========================= */

        const preset =
            urlParams.get("preset");

        if (preset) {

            params.append(
                "preset",
                preset
            );
        }

        /* =========================
           BRANDS
        ========================= */

        const urlBrand =
            urlParams.get("brands");

        if (urlBrand) {

            params.append(
                "brands",
                urlBrand
            );
        }

        document.querySelectorAll(
            ".filters input[id$='-brand']:checked"
        )

            .forEach(cb => {

                params.append(
                    "brands",
                    cb.value
                );

            });

        /* =========================
           HP
        ========================= */

        const urlHp =
            urlParams.get("hp");

        if (urlHp) {

            params.append(
                "hp",
                urlHp
            );
        }

        document.querySelectorAll(
            ".filters input[id$='-hp']:checked"
        )

            .forEach(cb => {

                params.append(
                    "hp",
                    cb.value
                );

            });

        /* =========================
           FORM FACTORS
        ========================= */

        const urlFormFactor =
            urlParams.get(
                "formFactors"
            );

        if (urlFormFactor) {

            params.append(
                "formFactors",
                urlFormFactor
            );
        }

        document.querySelectorAll(
            ".filters input[id$='-ff']:checked"
        )

            .forEach(cb => {

                params.append(
                    "formFactors",
                    cb.value
                );

            });

        /* =========================
           STOCK
        ========================= */

        const inStock =
            document.getElementById(
                "in-stock"
            )?.checked;

        const outStock =
            document.getElementById(
                "out-stock"
            )?.checked;

        if (inStock && !outStock) {

            params.append(
                "stock",
                "IN_STOCK"
            );
        }

        if (!inStock && outStock) {

            params.append(
                "stock",
                "OUT_OF_STOCK"
            );
        }

        /* =========================
           PRICE RANGE
        ========================= */

        const minPrice =
            document.getElementById(
                "minPrice"
            )?.value;

        const maxPrice =
            document.getElementById(
                "maxPrice"
            )?.value;

        if (minPrice) {

            params.append(
                "minPrice",
                minPrice
            );
        }

        if (maxPrice) {

            params.append(
                "maxPrice",
                maxPrice
            );
        }


        /* TAGS */

        const urlTag =
            urlParams.get("tags");

        if (urlTag) {

            params.append(
                "tags",
                urlTag
            );
        }

        /* =========================
           SORT
        ========================= */

        const sort =
            document.getElementById(
                "sortSelect"
            )?.value;

        if (sort) {

            params.append(
                "sort",
                sort
            );
        }

        /* =========================
           PAGINATION
        ========================= */

        params.append(
            "page",
            currentPage
        );

        params.append(
            "pageSize",
            18
        );

        /* =========================
           API CALL
        ========================= */

        const response = await fetch(

            `/api/shop/home_product_cards/search-products?${params.toString()}`
        );

        if (!response.ok) {

            throw new Error(
                "Failed to load products"
            );
        }

        const data =
            await response.json();

        /* =========================
           CLEAR INITIAL SEARCH
        ========================= */

        initialSearch = "";

        /* =========================
           PAGINATION DATA
        ========================= */

        totalPages =

            data.totalPages ??

            data.TotalPages ??

            1;

        totalProductCount =

            data.totalCount ??

            data.TotalCount ??

            0;

        /* =========================
           RENDER
        ========================= */

        renderProducts(

            data.items ??

            data.Items ??

            []

        );

        renderPagination();

    }
    catch (err) {

        console.error(
            "Error loading products:",
            err
        );
    }
}
/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts(products) {

    const grid =
        document.getElementById("productGrid");

    const resultsCount =
        document.getElementById("resultsCount");

    grid.innerHTML = "";

    /* NO RESULTS */

    if (!products.length) {

        grid.innerHTML = `

            <p class="no-results">
                No products found
            </p>

        `;

        resultsCount.innerText =
            "Showing 0 Results";

        return;
    }

    /* PRODUCT LOOP */

    products.forEach(p => {

        const image =

            p.primaryImageUrl ||

            "/images/no-image.png";

        const price =

            Number(
                p.actualSellingPrice ?? 0
            );

        const hpDisplay =

            p.horsePower
                ? `${p.horsePower} HP`
                : "-";

        let stockBadge = "";

        /* STOCK BADGES */

        if (!p.inStock) {

            stockBadge = `

            <span class="badge bg-danger">
                OUT OF STOCK
            </span>

        `;
        }
        else if (
            p.availableStock <= 3
        ) {

            stockBadge = `

            <span class="badge bg-warning text-dark">

                Only ${p.availableStock} left

            </span>

        `;
        }
        else {

            stockBadge = `

            <span class="badge stock">
                IN STOCK
            </span>

        `;
        }

        /* CARD */

        grid.innerHTML += `

        <div class="product-card">

            <a href="/Shop/Product/Details/${p.id}">

                ${stockBadge}

                <img src="${image}"
                     alt="${p.productModel}">

                <h4>

                    ${p.brandName ?? "-"}

                    ${p.productModel ?? "-"}

                </h4>

                <p class="description">

                    ${p.productSeries ?? "-"}

                    |

                    ${hpDisplay}

                </p>

                <p class="price">

                    ₱${price.toLocaleString(
            "en-PH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )}

                </p>

            </a>

            <a href="/Shop/Product/Details/${p.id}"
               class="btn btn-primary view-product-btn">

                View Product

            </a>

        </div>
    `;
    });

    resultsCount.innerText =

        `Showing ${products.length} Results`;
}

/* =========================
   PAGINATION
========================= */

function renderPagination() {

    const pagination =
        document.getElementById(
            "paginationContainer"
        );

    if (!pagination) return;

    pagination.innerHTML = "";

    /* PREV */

    pagination.innerHTML += `

        <button
            ${currentPage === 1
            ? "disabled"
            : ""
        }
            onclick="changePage(${currentPage - 1})">

            Prev

        </button>

    `;

    /* PAGE NUMBERS */

    for (
        let i = 1;
        i <= totalPages;
        i++
    ) {

        pagination.innerHTML += `

            <button
                class="${currentPage === i
                ? "active-page"
                : ""
            }"
                onclick="changePage(${i})">

                ${i}

            </button>

        `;
    }

    /* NEXT */

    pagination.innerHTML += `

        <button
            ${currentPage === totalPages
            ? "disabled"
            : ""
        }
            onclick="changePage(${currentPage + 1})">

            Next

        </button>

    `;
}

/* =========================
   CHANGE PAGE
========================= */

function changePage(page) {

    if (
        page < 1 ||
        page > totalPages
    ) {
        return;
    }

    currentPage = page;

    loadProducts();

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });
}