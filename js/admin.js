class GameManager {
    constructor() {
        this.games = [];
        this.currentEditId = null;
        this.hasUnsavedChanges = false;
        this.init();
    }

    async init() {
        await this.loadGames();
        this.setupEventListeners();
        this.renderGames();
    }

    async loadGames() {
        try {
            const response = await fetch('games-data.json');
            const data = await response.json();
            this.games = data.games;
        } catch (error) {
            console.error('Error loading games:', error);
            this.showAlert('Error loading games data', 'danger');
            this.games = [];
        }
        this.renderHighlightSection();
        this.updateExportButton();
    }

    setupEventListeners() {
        const form = document.getElementById('game-form');
        const highlightForm = document.getElementById('highlight-form');
        const cancelBtn = document.getElementById('cancel-edit');
        const removeHighlightBtn = document.getElementById('remove-highlight-btn');
        const exportBtn = document.getElementById('export-json');

        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        if (highlightForm) {
            highlightForm.addEventListener('submit', (e) => this.handleHighlightFormSubmit(e));

            // Setup real-time preview
            const previewFields = ['highlight-title', 'highlight-description', 'highlight-youtube', 
                                   'highlight-stats-gameplay', 'highlight-stats-characters', 'highlight-stats-worlds'];
            previewFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.addEventListener('input', () => this.updateHighlightPreview());
                }
            });
        }

        cancelBtn.addEventListener('click', () => this.cancelEdit());
        if (removeHighlightBtn) {
            removeHighlightBtn.addEventListener('click', () => this.removeHighlight());
        }
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportJSON());
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();

        const formData = {
            title: document.getElementById('game-title').value,
            image: document.getElementById('game-image').value,
            playLink: document.getElementById('game-play-link').value || '#',
            featured: document.getElementById('game-featured').checked
        };

        if (this.currentEditId) {
            this.updateGame(this.currentEditId, formData);
        } else {
            this.addGame(formData);
        }
    }

    addGame(gameData) {
        const newGame = {
            id: Date.now(), // Simple ID generation
            ...gameData
        };

        this.games.push(newGame);
        this.saveGames();
        this.renderGames();
        this.resetForm();
        this.showAlert('Game added successfully! Don\'t forget to export the JSON to save changes.', 'success');
    }

    updateGame(id, gameData) {
        const index = this.games.findIndex(game => game.id == id);
        if (index !== -1) {
            this.games[index] = { ...this.games[index], ...gameData };
            this.saveGames();
            this.renderGames();
            this.cancelEdit();
            this.showAlert('Game updated successfully! Don\'t forget to export the JSON to save changes.', 'success');
        }
    }

    deleteGame(id) {
        if (confirm('Are you sure you want to delete this game?')) {
            this.games = this.games.filter(game => game.id != id);
            this.saveGames();
            this.renderGames();
            this.showAlert('Game deleted successfully! Don\'t forget to export the JSON to save changes.', 'success');
        }
    }

    editGame(id) {
        const game = this.games.find(game => game.id == id);
        if (game) {
            this.currentEditId = id;

            document.getElementById('game-id').value = game.id;
            document.getElementById('game-title').value = game.title;
            document.getElementById('game-image').value = game.image;
            document.getElementById('game-play-link').value = game.playLink;
            document.getElementById('game-featured').checked = game.featured || false;

            document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Edit Game';
            document.getElementById('cancel-edit').classList.remove('hidden');

            // Switch to games tab and scroll to form
            switchTab('games');
            setTimeout(() => {
                document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }

    // Removed old setHighlight and removeHighlight functions
    // New highlight system uses separate data structure

    renderHighlightSection() {
        this.renderCurrentHighlight();
        this.renderHighlightSelector();
        this.updateEditTabState();
    }

    renderCurrentHighlight() {
        const currentHighlight = document.getElementById('current-highlight');
        if (!currentHighlight) return;

        if (this.highlight && this.highlight.active) {
            const highlightGame = this.games.find(game => game.id == this.highlight.gameId);
            if (highlightGame) {
                const displayTitle = this.highlight.customTitle || highlightGame.title;
                const displayDescription = this.highlight.customDescription || highlightGame.description;

                currentHighlight.innerHTML = `
                    <div class="highlight-with-content">
                        <div class="highlight-content">
                            <h3>${this.escapeHtml(displayTitle)}</h3>
                            <p>${this.escapeHtml(displayDescription)}</p>
                        </div>

                        <div class="highlight-media">
                            <img src="${highlightGame.image}" alt="${this.escapeHtml(highlightGame.title)}" class="highlight-image" onerror="this.src='https://placehold.co/120x90/333/fff?text=No+Image'">

                            ${this.highlight.youtubeUrl ? `
                                <div class="highlight-video">
                                    <iframe src="${this.getYouTubeEmbedUrl(this.highlight.youtubeUrl)}" 
                                            allowfullscreen></iframe>
                                </div>
                            ` : `
                                <div style="flex: 1; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #666;">
                                    <i class="fab fa-youtube" style="font-size: 2rem;"></i>
                                    <span style="margin-left: 0.5rem;">No video available yet</span>
                                </div>
                            `}
                        </div>

                        <div class="highlight-stats">
                            <div class="highlight-stat">
                                <h4>${this.highlight.stats?.gameplay || '50+'}</h4>
                                <p>Gameplay Hours</p>
                            </div>
                            <div class="highlight-stat">
                                <h4>${this.highlight.stats?.characters || '25+'}</h4>
                                <p>Unique Characters</p>
                            </div>
                            <div class="highlight-stat">
                                <h4>${this.highlight.stats?.worlds || '5+'}</h4>
                                <p>Distinct Worlds</p>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                currentHighlight.innerHTML = `
                    <div class="no-highlight">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--warning);"></i>
                        <h3>Highlighted Game Not Found</h3>
                        <p>The game set as highlight may have been removed</p>
                    </div>
                `;
            }
        } else {
            currentHighlight.innerHTML = `
                <div class="no-highlight">
                    <i class="fas fa-crown" style="font-size: 4rem; color: #666; margin-bottom: 1rem;"></i>
                    <h3>No Featured Game Yet</h3>
                    <p>Select a game to set as featured</p>
                </div>
            `;
        }
    }

    renderHighlightSelector() {
        const highlightSelector = document.getElementById('highlight-selector');
        if (!highlightSelector) return;

        if (this.games.length === 0) {
            highlightSelector.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #999;">
                    <i class="fas fa-gamepad" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>No games available yet</p>
                </div>
            `;
            return;
        }

        highlightSelector.innerHTML = this.games.map(game => `
            <div class="highlight-option ${this.currentHighlightGameId == game.id ? 'selected' : ''}" 
                 onclick="gameManager.selectHighlightGame(${game.id})">
                <img src="${game.image}" alt="${this.escapeHtml(game.title)}" onerror="this.src='https://placehold.co/60x45/333/fff?text=No+Image'">
                <div class="highlight-info">
                    <h4>${this.escapeHtml(game.title)}</h4>
                    <p>${this.escapeHtml(game.description.substring(0, 80))}${game.description.length > 80 ? '...' : ''}</p>
                </div>
            </div>
        `).join('');
    }

    updateEditTabState() {
        const editTabBtn = document.getElementById('edit-tab-btn');
        if (editTabBtn) {
            if (this.currentHighlightGameId) {
                editTabBtn.disabled = false;
                editTabBtn.style.opacity = '1';
            } else {
                editTabBtn.disabled = true;
                editTabBtn.style.opacity = '0.5';
            }
        }
    }

    selectHighlightGame(gameId) {
        this.currentHighlightGameId = gameId;
        this.renderHighlightSelector();
        this.updateEditTabState();
        this.populateHighlightForm(gameId);

        // Auto switch to edit tab
        switchHighlightTab('edit');
    }

    populateHighlightForm(gameId) {
        const game = this.games.find(g => g.id == gameId);
        if (!game) return;

        // Populate form with current highlight data or defaults
        if (this.highlight && this.highlight.gameId == gameId) {
            document.getElementById('highlight-title').value = this.highlight.customTitle || '';
            document.getElementById('highlight-description').value = this.highlight.customDescription || '';
            document.getElementById('highlight-youtube').value = this.highlight.youtubeUrl || '';
            document.getElementById('highlight-stats-gameplay').value = this.highlight.stats?.gameplay || '';
            document.getElementById('highlight-stats-characters').value = this.highlight.stats?.characters || '';
            document.getElementById('highlight-stats-worlds').value = this.highlight.stats?.worlds || '';
        } else {
            // Clear form for new selection
            document.getElementById('highlight-title').value = '';
            document.getElementById('highlight-description').value = '';
            document.getElementById('highlight-youtube').value = '';
            document.getElementById('highlight-stats-gameplay').value = '';
            document.getElementById('highlight-stats-characters').value = '';
            document.getElementById('highlight-stats-worlds').value = '';
        }

        this.updateHighlightPreview();
    }

    updateHighlightPreview() {
        if (!this.currentHighlightGameId) return;

        const game = this.games.find(g => g.id == this.currentHighlightGameId);
        if (!game) return;

        const customTitle = document.getElementById('highlight-title').value;
        const customDescription = document.getElementById('highlight-description').value;
        const youtubeUrl = document.getElementById('highlight-youtube').value;
        const gameplay = document.getElementById('highlight-stats-gameplay').value;
        const characters = document.getElementById('highlight-stats-characters').value;
        const worlds = document.getElementById('highlight-stats-worlds').value;

        const displayTitle = customTitle || game.title;
        const displayDescription = customDescription || game.description;

        const previewContent = document.getElementById('highlight-preview-content');
        if (previewContent) {
            previewContent.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <h5 style="color: var(--accent); margin-bottom: 0.5rem;">${this.escapeHtml(displayTitle)}</h5>
                    <p style="color: #ccc; font-size: 0.9rem; line-height: 1.4;">${this.escapeHtml(displayDescription.substring(0, 100))}${displayDescription.length > 100 ? '...' : ''}</p>
                </div>

                ${youtubeUrl ? `
                    <div style="margin-bottom: 1rem;">
                        <div style="aspect-ratio: 16/9; background: rgba(255,255,255,0.1); border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                            <i class="fab fa-youtube" style="color: var(--secondary); font-size: 1.5rem;"></i>
                            <span style="margin-left: 0.5rem; color: #ccc;">Video Preview</span>
                        </div>
                    </div>
                ` : ''}

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; font-size: 0.8rem;">
                    <div style="text-align: center; padding: 0.5rem; background: rgba(255,255,255,0.1); border-radius: 4px;">
                        <div style="color: var(--accent); font-weight: bold;">${gameplay || '50+'}</div>
                        <div style="color: #999;">Gameplay</div>
                    </div>
                    <div style="text-align: center; padding: 0.5rem; background: rgba(255,255,255,0.1); border-radius: 4px;">
                        <div style="color: var(--accent); font-weight: bold;">${characters || '25+'}</div>
                        <div style="color: #999;">Karakter</div>
                    </div>
                    <div style="text-align: center; padding: 0.5rem; background: rgba(255,255,255,0.1); border-radius: 4px;">
                        <div style="color: var(--accent); font-weight: bold;">${worlds || '5+'}</div>
                        <div style="color: #999;">Dunia</div>
                    </div>
                </div>
            `;
        }
    }

    handleHighlightFormSubmit(e) {
        e.preventDefault();

        if (!this.currentHighlightGameId) {
            this.showAlert('Pilih game terlebih dahulu!', 'danger');
            return;
        }

        const highlightData = {
            gameId: this.currentHighlightGameId,
            customTitle: document.getElementById('highlight-title').value.trim(),
            customDescription: document.getElementById('highlight-description').value.trim(),
            youtubeUrl: document.getElementById('highlight-youtube').value.trim(),
            stats: {
                gameplay: document.getElementById('highlight-stats-gameplay').value.trim() || '50+',
                characters: document.getElementById('highlight-stats-characters').value.trim() || '25+',
                worlds: document.getElementById('highlight-stats-worlds').value.trim() || '5+'
            },
            active: true,
            lastUpdated: new Date().toISOString()
        };

        this.highlight = highlightData;
        this.saveGames();
        this.renderCurrentHighlight();

        const game = this.games.find(g => g.id == this.currentHighlightGameId);
        this.showAlert(`${game.title} berhasil dijadikan game unggulan! Jangan lupa export JSON.`, 'success');
    }

    removeHighlight() {
        if (!this.highlight || !this.highlight.active) {
            this.showAlert('Tidak ada highlight yang perlu dihapus.', 'warning');
            return;
        }

        if (confirm('Apakah Anda yakin ingin menghapus game unggulan?')) {
            this.highlight = null;
            this.currentHighlightGameId = null;
            this.saveGames();
            this.renderHighlightSection();

            // Reset form
            document.getElementById('highlight-form').reset();
            document.getElementById('highlight-preview-content').innerHTML = `
                <p style="color: #999; text-align: center; padding: 2rem;">
                    Preview akan muncul setelah mengisi form
                </p>
            `;

            // Switch back to select tab
            switchHighlightTab('select');

            this.showAlert('Game unggulan berhasil dihapus! Jangan lupa export JSON.', 'success');
        }
    }

    getYouTubeEmbedUrl(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
        return null;
    }

    cancelEdit() {
        this.currentEditId = null;
        this.resetForm();
        document.getElementById('form-title').innerHTML = '<i class="fas fa-plus"></i> Tambah Game Baru';
        document.getElementById('cancel-edit').classList.add('hidden');
    }

    resetForm() {
        document.getElementById('game-form').reset();
        document.getElementById('game-id').value = '';
    }

    saveGames() {
        // In a real application, this would send data to a server
        // For local development, we'll use localStorage as backup
        const gamesData = { 
            games: this.games,
            highlight: this.highlight
        };
        localStorage.setItem('mainra-games', JSON.stringify(gamesData));

        // Mark that there are unsaved changes
        this.hasUnsavedChanges = true;
        this.updateExportButton();
    }

    exportJSON() {
        const gamesData = { 
            games: this.games,
            highlight: this.highlight
        };
        const dataStr = JSON.stringify(gamesData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // Create a temporary download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'games-data.json';

        // Download the file
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Mark changes as exported
        this.hasUnsavedChanges = false;
        this.updateExportButton();

        this.showAlert('File games-data.json berhasil diexport! Ganti file lama dengan yang baru di project Anda.', 'success');
    }

    updateExportButton() {
        const exportBtn = document.getElementById('export-json');
        if (exportBtn) {
            if (this.hasUnsavedChanges) {
                exportBtn.classList.remove('btn-disabled');
                exportBtn.classList.add('btn-warning');
                exportBtn.innerHTML = '<i class="fas fa-download"></i> Export JSON (Ada Perubahan)';
                exportBtn.disabled = false;
            } else {
                exportBtn.classList.remove('btn-warning');
                exportBtn.classList.add('btn-disabled');
                exportBtn.innerHTML = '<i class="fas fa-download"></i> Export JSON';
                exportBtn.disabled = true;
            }
        }
    }

    renderGames() {
        const container = document.getElementById('games-container');

        if (this.games.length === 0) {
            container.innerHTML = `
                <div class="game-card" style="text-align: center; color: #999;">
                    <i class="fas fa-gamepad" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>Belum ada game yang ditambahkan</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.games.map(game => `
            <div class="game-card">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <h3>${this.escapeHtml(game.title)}</h3>
                    <div style="display: flex; gap: 0.5rem;">
                        ${game.featured ? '<span class="status-badge status-released" style="font-size: 0.7rem;"><i class="fas fa-star"></i> Featured</span>' : ''}
                        ${this.highlight && this.highlight.gameId == game.id && this.highlight.active ? '<span class="status-badge" style="background: var(--accent); color: var(--dark); font-size: 0.7rem;"><i class="fas fa-crown"></i> Highlight</span>' : ''}
                    </div>
                </div>
                <p>${this.escapeHtml(game.description)}</p>

                <div class="game-meta">
                    <div><span>Status:</span> <span class="status-badge status-${game.status.toLowerCase().replace(' ', '')}">${this.escapeHtml(game.status)}</span></div>
                    <div><span>Platform:</span> ${this.escapeHtml(game.platform || 'N/A')}</div>
                    <div><span>Screenshots:</span> ${game.screenshots ? game.screenshots.length : 1} gambar</div>
                </div>

                <div style="margin: 1rem 0;">
                    <img src="${game.image}" alt="${this.escapeHtml(game.title)}" style="width: 100%; max-width: 200px; height: 120px; object-fit: cover; border-radius: 8px;">
                </div>

                <div class="game-actions">
                    <button class="btn btn-warning btn-small" onclick="gameManager.editGame(${game.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-small" onclick="gameManager.deleteGame(${game.id})">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                    ${game.playLink && game.playLink !== '#' ? 
                        `<a href="${game.playLink}" target="_blank" class="btn btn-small" style="background: var(--accent);">
                            <i class="fas fa-play"></i> Main
                        </a>` : ''
                    }
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

    showAlert(message, type = 'success') {
        const alertContainer = document.getElementById('alert-container');
        const alertId = 'alert-' + Date.now();

        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                ${message}
            </div>
        `;

        alertContainer.insertAdjacentHTML('beforeend', alertHtml);

        // Auto-remove alert after 5 seconds
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.remove();
            }
        }, 5000);
    }
}

// Initialize the game manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameManager = new GameManager();
});
