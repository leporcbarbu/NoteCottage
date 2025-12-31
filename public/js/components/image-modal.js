// Image Modal Component - handles upload/link UI

class ImageModal {
    constructor() {
        this.currentTab = 'upload';
        this.selectedFile = null;
        this.callback = null;
        this.init();
    }

    init() {
        // Create modal HTML
        const modalHTML = `
            <div class="image-modal" id="imageModal">
                <div class="image-modal-content">
                    <div class="image-modal-header">
                        <h2>Insert Image</h2>
                        <button class="image-modal-close" id="imageModalClose">&times;</button>
                    </div>

                    <div class="image-modal-tabs">
                        <button class="image-modal-tab active" data-tab="upload">Upload File</button>
                        <button class="image-modal-tab" data-tab="link">Link URL</button>
                    </div>

                    <!-- Upload Tab -->
                    <div class="image-tab-content active" id="uploadTab">
                        <div class="upload-zone" id="uploadZone">
                            <div class="upload-zone-icon">📷</div>
                            <div class="upload-zone-text">Click to upload or drag and drop</div>
                            <div class="upload-zone-subtext">JPEG, PNG, GIF, WebP, SVG (max 10MB)</div>
                        </div>
                        <input type="file" id="imageFileInput" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" style="display: none;">

                        <div class="form-group">
                            <label for="uploadAltText">Alt Text (optional)</label>
                            <input type="text" id="uploadAltText" placeholder="Describe this image">
                        </div>

                        <div class="image-preview" id="imagePreview">
                            <img id="imagePreviewImg" alt="Preview">
                        </div>

                        <div class="upload-status" id="uploadStatus"></div>

                        <div class="modal-actions">
                            <button class="btn btn-secondary" id="uploadCancelBtn">Cancel</button>
                            <button class="btn btn-primary" id="uploadSubmitBtn" disabled>Insert Image</button>
                        </div>
                    </div>

                    <!-- Link Tab -->
                    <div class="image-tab-content" id="linkTab">
                        <div class="form-group">
                            <label for="imageUrl">Image URL</label>
                            <input type="url" id="imageUrl" placeholder="https://example.com/image.jpg">
                        </div>

                        <div class="form-group">
                            <label for="linkAltText">Alt Text (optional)</label>
                            <input type="text" id="linkAltText" placeholder="Describe this image">
                        </div>

                        <div class="upload-status" id="linkStatus"></div>

                        <div class="modal-actions">
                            <button class="btn btn-secondary" id="linkCancelBtn">Cancel</button>
                            <button class="btn btn-primary" id="linkSubmitBtn" disabled>Insert Link</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Get elements
        this.modal = document.getElementById('imageModal');
        this.closeBtn = document.getElementById('imageModalClose');
        this.tabBtns = document.querySelectorAll('.image-modal-tab');
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('imageFileInput');
        this.uploadAltText = document.getElementById('uploadAltText');
        this.uploadSubmitBtn = document.getElementById('uploadSubmitBtn');
        this.uploadCancelBtn = document.getElementById('uploadCancelBtn');
        this.imagePreview = document.getElementById('imagePreview');
        this.imagePreviewImg = document.getElementById('imagePreviewImg');
        this.uploadStatus = document.getElementById('uploadStatus');

        this.imageUrl = document.getElementById('imageUrl');
        this.linkAltText = document.getElementById('linkAltText');
        this.linkSubmitBtn = document.getElementById('linkSubmitBtn');
        this.linkCancelBtn = document.getElementById('linkCancelBtn');
        this.linkStatus = document.getElementById('linkStatus');

        // Bind events
        this.bindEvents();
    }

    bindEvents() {
        // Close modal
        this.closeBtn.addEventListener('click', () => this.close());
        this.uploadCancelBtn.addEventListener('click', () => this.close());
        this.linkCancelBtn.addEventListener('click', () => this.close());

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Upload zone click
        this.uploadZone.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Drag and drop on upload zone
        this.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadZone.classList.add('drag-over');
        });

        this.uploadZone.addEventListener('dragleave', () => {
            this.uploadZone.classList.remove('drag-over');
        });

        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleFileSelect(files[0]);
            }
        });

        // Submit handlers
        this.uploadSubmitBtn.addEventListener('click', () => this.handleUploadSubmit());
        this.linkSubmitBtn.addEventListener('click', () => this.handleLinkSubmit());

        // URL input validation
        this.imageUrl.addEventListener('input', () => {
            const valid = this.imageUrl.value.trim().length > 0;
            this.linkSubmitBtn.disabled = !valid;
        });
    }

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        this.tabBtns.forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.image-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        if (tab === 'upload') {
            document.getElementById('uploadTab').classList.add('active');
        } else {
            document.getElementById('linkTab').classList.add('active');
        }

        // Reset status messages
        this.hideStatus();
    }

    handleFileSelect(file) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            this.showStatus('upload', 'error', 'Invalid file type. Please select a JPEG, PNG, GIF, WebP, or SVG image.');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showStatus('upload', 'error', 'File too large. Maximum size is 10MB.');
            return;
        }

        this.selectedFile = file;
        this.uploadSubmitBtn.disabled = false;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreviewImg.src = e.target.result;
            this.imagePreview.classList.add('active');
        };
        reader.readAsDataURL(file);

        // Auto-fill alt text with filename
        if (!this.uploadAltText.value) {
            this.uploadAltText.value = file.name.replace(/\.[^/.]+$/, '');
        }

        this.hideStatus();
    }

    async handleUploadSubmit() {
        if (!this.selectedFile || !this.callback) return;

        this.uploadSubmitBtn.disabled = true;
        this.showStatus('upload', 'loading', 'Uploading image...');

        try {
            const altText = this.uploadAltText.value.trim();
            await this.callback('upload', this.selectedFile, altText);
            this.showStatus('upload', 'success', 'Image uploaded successfully!');
            setTimeout(() => this.close(), 1000);
        } catch (error) {
            this.showStatus('upload', 'error', error.message || 'Failed to upload image');
            this.uploadSubmitBtn.disabled = false;
        }
    }

    async handleLinkSubmit() {
        if (!this.imageUrl.value.trim() || !this.callback) return;

        this.linkSubmitBtn.disabled = true;
        this.showStatus('link', 'loading', 'Linking image...');

        try {
            const url = this.imageUrl.value.trim();
            const altText = this.linkAltText.value.trim();
            await this.callback('external', url, altText);
            this.showStatus('link', 'success', 'Image linked successfully!');
            setTimeout(() => this.close(), 1000);
        } catch (error) {
            this.showStatus('link', 'error', error.message || 'Failed to link image');
            this.linkSubmitBtn.disabled = false;
        }
    }

    showStatus(tab, type, message) {
        const statusEl = tab === 'upload' ? this.uploadStatus : this.linkStatus;
        statusEl.textContent = message;
        statusEl.className = `upload-status active ${type}`;
    }

    hideStatus() {
        this.uploadStatus.className = 'upload-status';
        this.linkStatus.className = 'upload-status';
    }

    open(callback) {
        this.callback = callback;
        this.modal.classList.add('active');

        // Reset form
        this.selectedFile = null;
        this.fileInput.value = '';
        this.uploadAltText.value = '';
        this.imageUrl.value = '';
        this.linkAltText.value = '';
        this.uploadSubmitBtn.disabled = true;
        this.linkSubmitBtn.disabled = true;
        this.imagePreview.classList.remove('active');
        this.hideStatus();

        // Switch to upload tab
        this.switchTab('upload');
    }

    close() {
        this.modal.classList.remove('active');
        this.callback = null;
        this.selectedFile = null;
    }
}

// Create global instance
window.imageModal = new ImageModal();
