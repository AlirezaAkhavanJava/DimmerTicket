document.addEventListener('DOMContentLoaded', () => {
    
    const mainPage = document.getElementById('main-page');
    const detailsPage = document.getElementById('details-page');
    const backBtn = document.getElementById('back-btn');
    const movieGrid = document.getElementById('movie-grid');
    const topList = document.getElementById('top-list');

    // --- SMART YOUTUBE URL CONVERTER ---
    // This prevents the broken image/blank box issue if you accidentally use a 'watch?v=' link
    function getEmbedUrl(url) {
        if (!url) return "";
        // If it's already an embed link, return it
        if (url.includes('/embed/')) return url;
        
        // Extract video ID from standard links
        let videoId = "";
        if (url.includes('watch?v=')) {
            videoId = url.split('watch?v=')[1].split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        }
        
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    // --- 1. FETCH DATA AND RENDER MOVIES ---
    async function fetchAndRenderMovies() {
        try {
            const response = await fetch('data/movies.json');
            if (!response.ok) throw new Error("Could not fetch movies.json");
            const movies = await response.json();

            movieGrid.innerHTML = '';
            topList.innerHTML = '';

            movies.forEach((movie, index) => {
                // Grid Card
                const cardHTML = `
                    <div class="movie-card" onclick="openMovieDetails(${movie.id})">
                        <div class="poster-wrapper">
                            <img src="${movie.poster}" alt="${movie.title}" class="movie-poster" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500&auto=format&fit=crop'">
                        </div>
                        <span class="movie-title">${movie.title}</span>
                        <span class="movie-rating-small">⭐ ${movie.rating}</span>
                    </div>
                `;
                movieGrid.innerHTML += cardHTML;

                // Sidebar List (Limit to top 5)
                if (index < 5) {
                    const listHTML = `
                        <a class="top-list-item" onclick="openMovieDetails(${movie.id})">
                            <span class="rank">${index + 1}</span>
                            <div class="list-info">
                                <h4>${movie.title}</h4>
                                <p>${movie.director}</p>
                            </div>
                            <img src="${movie.poster}" alt="${movie.title}" class="list-img" loading="lazy">
                        </a>
                    `;
                    topList.innerHTML += listHTML;
                }
            });

            window.moviesData = movies;

        } catch (error) {
            console.error("Error loading movies:", error);
            movieGrid.innerHTML = `<p style="color:var(--primary-color); grid-column: 1/-1;">Error loading movies. Please ensure you are running a local server.</p>`;
        }
    }

    // --- 2. NAVIGATION LOGIC ---
    window.openMovieDetails = function(movieId) {
        const movie = window.moviesData.find(m => m.id === movieId);
        if (!movie) return;

        // Populate Text
        document.getElementById('detail-title').innerText = movie.title;
        document.getElementById('detail-director').innerText = `Director: ${movie.director}`;
        document.getElementById('detail-rating').innerText = `⭐ ${movie.rating}`;
        document.getElementById('detail-duration').innerText = movie.duration;
        document.getElementById('detail-genre').innerText = movie.genre;
        document.getElementById('detail-synopsis').innerText = movie.synopsis;
        
        // Populate Poster
        const posterImg = document.getElementById('detail-poster');
        posterImg.src = movie.poster;
        posterImg.onerror = function() {
            this.src = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500&auto=format&fit=crop';
        };

        // Populate Trailer (Using the smart converter)
        const trailerIframe = document.getElementById('detail-trailer');
        trailerIframe.src = getEmbedUrl(movie.trailer);

        // Switch views
        mainPage.style.display = 'none';
        detailsPage.style.display = 'block';
        window.scrollTo(0, 0);
    };

    // Go Back Button
    backBtn.addEventListener('click', () => {
        // Stop the video when going back
        document.getElementById('detail-trailer').src = ""; 
        detailsPage.style.display = 'none';
        mainPage.style.display = 'block';
        window.scrollTo(0, 0);
    });

    // --- 3. ACCORDION LOGIC ---
    window.toggleAccordion = function(id) {
        const content = document.getElementById(id);
        const btnText = content.previousElementSibling.querySelector('.showtimes-btn');
        
        if (content.style.display === 'block') {
            content.style.display = 'none';
            btnText.innerHTML = 'Showtimes ▼';
        } else {
            content.style.display = 'block';
            btnText.innerHTML = 'Showtimes ▲';
        }
    };

    // Initialize
    fetchAndRenderMovies();
});