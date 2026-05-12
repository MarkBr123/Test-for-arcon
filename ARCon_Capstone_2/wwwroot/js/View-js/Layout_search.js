/* =========================
   GLOBAL NAVBAR SEARCH
========================= */

document.addEventListener("DOMContentLoaded", () => {

    const searchForm =
        document.querySelector(".search-form");

    const searchInput =
        document.getElementById("globalSearchInput");

    if (!searchForm || !searchInput)
        return;

    /* 
       SUBMIT SEARCH */

    searchForm.addEventListener("submit", e => {

        e.preventDefault();

        const searchValue =
            searchInput.value.trim();

        /* EMPTY SEARCH */

        if (!searchValue) {

            window.location.href =
                "/Shop/Home/Search";

            return;
        }

        /* REDIRECT */

        const encodedSearch =

            encodeURIComponent(
                searchValue
            );

        window.location.href =

            `/Shop/Home/Search?search=${encodedSearch}`;
    });

});