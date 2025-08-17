class GamesLoader {
    constructor() {
        this.games = [];
        this.highlight = null;
        this.init();
    }

    async init() {
        console.log('Initializing GamesLoader...');
        await this.loadGames();
        console.log('Games loaded in GamesLoader:', this.games.length);
        console.log('Highlight data in GamesLoader:', this.highlight);
        this.renderGames();
        console.log('GamesLoader initialized successfully');
    }

    async loadGames() {
        try {
            // Try to load from JSON file first
            const response = await fetch('games-data.json');
            const data = await response.json();
            this.games = data.games || [];
            this.highlight = data.highlight || null;
        } catch (error) {
            console.error('Error loading games from JSON:', error);

            // Fallback to localStorage
            try {
                const localData = localStorage.getItem('mainra-games');
                if (localData) {
                    const parsedData = JSON.parse(localData);
                    this.games = parsedData.games || [];
                    this.highlight = parsedData.highlight || null;
                } else {
                    // Default fallback data with new structure
                    this.games = [
                        {
                            id: 1,
                            title: "Adventure Quest",
                            description: "Game petualangan 2D dengan mekanika unik dan storyline yang menarik",
                            image: "https://placehold.co/600x400/8a2be2/ffffff?text=Adventure+Quest",
                            screenshots: [
                                "https://placehold.co/600x400/8a2be2/ffffff?text=Adventure+Quest+1",
                                "https://placehold.co/600x400/7c3aed/ffffff?text=Adventure+Quest+2"
                            ],
                            playLink: "#",
                            category: "Adventure",
                            status: "Released",
                            releaseDate: "2024-01-15",
                            featured: true,
                            platform: "PC, Mobile",
                            rating: "4.8"
                        },
                        {
                            id: 2,
                            title: "Space Defender",
                            description: "Game tembak-menembak luar angkasa dengan grafis yang memukau",
                            image: "https://placehold.co/600x400/ff6b6b/ffffff?text=Space+Defender",
                            screenshots: [
                                "https://placehold.co/600x400/ff6b6b/ffffff?text=Space+Defender+1",
                                "https://placehold.co/600x400/ef4444/ffffff?text=Space+Defender+2"
                            ],
                            playLink: "#",
                            category: "Shooter",
                            status: "Released",
                            releaseDate: "2024-02-20",
                            featured: true,
                            platform: "PC, Console",
                            rating: "4.9"
                        },
                        {
                            id: 3,
                            title: "Mystic Worlds",
                            description: "Game RPG dengan dunia fantasi yang luas dan karakter yang beragam",
                            image: "https://placehold.co/600x400/4cc9f0/ffffff?text=Mystic+Worlds",
                            screenshots: [
                                "https://placehold.co/600x400/4cc9f0/ffffff?text=Mystic+Worlds+1",
                                "https://placehold.co/600x400/0ea5e9/ffffff?text=Mystic+Worlds+2"
                            ],
                            playLink: "#",
                            category: "RPG",
                            status: "In Development",
                            releaseDate: "2024-06-01",
                            featured: true,
                            platform: "PC, Mobile",
                            rating: "4.7"
                        }
                    ];

                    // Default highlight data
                    this.highlight = {
                        gameId: 2,
                        customTitle: "",
                        customDescription: "",
                        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        stats: {
                            gameplay: "100+",
                            characters: "50+",
                            worlds: "10+"
                        },
                        active: true,
                        lastUpdated: "2024-01-15T10:00:00Z"
                    };
                }
            } catch (localError) {
                console.error('Error loading from localStorage:', localError);
                this.games = [];
                this.highlight = null;
            }
        }
    }

    renderGames() {
        console.log('Starting renderGames...');

        // Render games in homepage
        this.renderHomepageGames();

        // Render games in games page if exists
        if (window.location.pathname.includes('games.html') || document.querySelector('.games-list')) {
            console.log('Rendering games page...');
            this.renderGamesPage();
            this.renderHighlightGame();
        }

        console.log('renderGames completed');
    }

    renderHomepageGames() {
        const gamesGrid = document.querySelector('#games .games-grid');
        console.log('Homepage games grid found:', !!gamesGrid);

        if (!gamesGrid) return;

        // Show only featured games for homepage (max 3)
        const featuredGames = this.games.filter(game => game.featured).slice(0, 3);
        console.log('Featured games for homepage:', featuredGames.length);

        if (featuredGames.length === 0) {
            console.log('No featured games found, showing empty state');
            gamesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #999;">
                    <i class="fas fa-gamepad" style="font-size: 4rem; margin-bottom: 1rem;"></i>
                    <p>Belum ada game yang tersedia</p>
                </div>
            `;
            return;
        }

        gamesGrid.innerHTML = featuredGames.map(game => `
            <div class="game-item">
                <img src="${game.image}" alt="${this.escapeHtml(game.title)}" class="game-img" onerror="this.src='https://placehold.co/600x400/333/fff?text=No+Image'">
                <div class="game-overlay">
                    <h3>${this.escapeHtml(game.title)}</h3>
                    <p>${this.escapeHtml(game.description)}</p>
                    ${game.playLink && game.playLink !== '#' ? 
                        `<a href="${game.playLink}" target="_blank" class="btn btn-small" style="margin-top: 1rem;">
                            <i class="fas fa-play"></i> Main Sekarang
                        </a>` : ''
                    }
                </div>
            </div>
        `).join('');

        console.log('Homepage games rendered successfully');
    }

    renderHighlightGame() {
        const highlightText = document.querySelector('.highlight-text');
        const highlightImage = document.querySelector('.highlight-image .carousel-wrapper');

        // Use loaded highlight data
        const highlightData = this.highlight;

        if (!highlightData || !highlightData.active) {
            // Show no highlight message
            if (highlightText) {
                highlightText.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #999;">
                        <i class="fas fa-crown" style="font-size: 4rem; margin-bottom: 1rem;"></i>
                        <h2 style="color: #666; margin-bottom: 1rem;">Belum Ada Game Unggulan</h2>
                        <p>Kami sedang mempersiapkan game unggulan terbaik untuk Anda</p>
                    </div>
                `;
            }
            return;
        }

        // Find the highlighted game
        const highlightGame = this.games.find(game => game.id == highlightData.gameId);
        if (!highlightGame) {
            if (highlightText) {
                highlightText.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #999;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 4rem; margin-bottom: 1rem; color: var(--warning);"></i>
                        <h2 style="color: #666; margin-bottom: 1rem;">Game Tidak Ditemukan</h2>
                        <p>Game unggulan yang dipilih tidak tersedia</p>
                    </div>
                `;
            }
            return;
        }

        // Use custom title and description if available
        const displayTitle = highlightData.customTitle || highlightGame.title;
        const displayDescription = highlightData.customDescription || highlightGame.description;

        // Update highlight game content
        if (highlightText) {
            highlightText.innerHTML = `
                <h2>${this.escapeHtml(displayTitle)}</h2>
                <p>${this.escapeHtml(displayDescription)}</p>
                <p>Dengan gameplay yang menarik dan fitur-fitur inovatif, ${this.escapeHtml(displayTitle)} menawarkan pengalaman gaming yang tak terlupakan untuk semua kalangan.</p>
                <div class="highlight-stats">
                    <div class="stat-item">
                        <h3>${highlightData.stats?.gameplay || '50+'}</h3>
                        <p>Jam Gameplay</p>
                    </div>
                    <div class="stat-item">
                        <h3>${highlightData.stats?.characters || '25+'}</h3>
                        <p>Karakter Unik</p>
                    </div>
                    <div class="stat-item">
                        <h3>${highlightData.stats?.worlds || '5+'}</h3>
                        <p>Dunia Terpisah</p>
                    </div>
                    <div class="stat-item">
                        <h3>${highlightGame.rating || '4.5'}</h3>
                        <p>Rating User</p>
                    </div>
                </div>
                <div class="game-actions">
                    ${highlightGame.playLink && highlightGame.playLink !== '#' ? 
                        `<a href="${highlightGame.playLink}" target="_blank" class="btn btn-play">Mainkan Sekarang</a>` :
                        `<a href="#" class="btn btn-play">Segera Hadir</a>`
                    }
                    ${highlightData.youtubeUrl ? 
                        `<a href="${highlightData.youtubeUrl}" target="_blank" class="btn btn-details">Lihat Trailer</a>` :
                        `<a href="#" class="btn btn-details">Detail Game</a>`
                    }
                </div>
            `;
        }

        // Update carousel with game screenshots
        if (highlightImage && highlightGame.screenshots && highlightGame.screenshots.length > 0) {
            const slides = highlightGame.screenshots.map((screenshot, index) => `
                <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                    <img src="${screenshot}" alt="${this.escapeHtml(displayTitle)} Screenshot ${index + 1}" onerror="this.src='${highlightGame.image}'">
                </div>
            `).join('');

            const dots = highlightGame.screenshots.map((_, index) => `
                <span class="dot ${index === 0 ? 'active' : ''}" onclick="currentSlide(${index + 1})"></span>
            `).join('');

            highlightImage.innerHTML = slides;

            const dotsContainer = document.querySelector('.carousel-dots');
            if (dotsContainer) {
                dotsContainer.innerHTML = dots;
            }
        } else {
            // Use main game image as single slide
            if (highlightImage) {
                highlightImage.innerHTML = `
                    <div class="carousel-slide active">
                        <img src="${highlightGame.image}" alt="${this.escapeHtml(displayTitle)}" onerror="this.src='https://placehold.co/600x400/333/fff?text=No+Image'">
                    </div>
                `;
            }

            const dotsContainer = document.querySelector('.carousel-dots');
            if (dotsContainer) {
                dotsContainer.innerHTML = '<span class="dot active"></span>';
            }
        }
    }

    renderGamesPage() {
        const gamesList = document.querySelector('.games-list');
        if (!gamesList) return;

        if (this.games.length === 0) {
            gamesList.innerHTML = `
                <div class="no-games" style="text-align: center; padding: 3rem; color: #999;">
                    <i class="fas fa-gamepad" style="font-size: 4rem; margin-bottom: 1rem;"></i>
                    <h3>Belum Ada Game</h3>
                    <p>Kami sedang mengembangkan game-game menarik untuk Anda.</p>
                </div>
            `;
            return;
        }

        gamesList.innerHTML = this.games.map(game => `
            <div class="game-item">
                <div class="game-image">
                    <img src="${game.image}" alt="${this.escapeHtml(game.title)}" onerror="this.src='https://placehold.co/600x400/333/fff?text=No+Image'">
                </div>
                <div class="game-content">
                    <h3 class="game-title">${this.escapeHtml(game.title)}</h3>
                    <p class="game-description">${this.escapeHtml(game.description)}</p>
                    <div class="game-meta">
                        <span class="game-platform">${this.escapeHtml(game.platform || 'Multi Platform')}</span>
                        ${game.rating ? `<span class="game-rating">${'★'.repeat(Math.floor(game.rating))} ${game.rating}/5</span>` : ''}
                    </div>
                    <div class="game-actions">
                        ${game.playLink && game.playLink !== '#' ? 
                            `<a href="${game.playLink}" target="_blank" class="btn btn-play">Mainkan</a>` :
                            `<span class="btn" style="opacity: 0.5; cursor: not-allowed;">Segera Hadir</span>`
                        }
                        <a href="#" class="btn btn-details">Detail</a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize games loader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GamesLoader();
});
