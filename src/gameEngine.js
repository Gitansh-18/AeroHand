class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Game constants
        this.PIPE_SPEED_INITIAL = 11;
        this.PIPE_GAP_INITIAL = 250;
        this.LEVEL_INTERVAL = Math.floor(15000 * 0.8);
        this.MAX_LEVEL = 10;
        this.POPUP_DURATION = 2000;
        this.FPS = 60;
        
        // Colors
        this.WHITE = '#FFFFFF';
        this.RED = '#FF0000';
        this.YELLOW = '#FFD700';
        this.BLUE = '#1E90FF';
        this.GREEN = '#00FF00';
        this.BROWN = '#8B4513';
        this.PIPE_CAP_COLOR = '#643200';
        this.DARK_GRAY = '#282828';
        
        // Responsive setup
        this.setupResponsiveElements();
        
        // Assets
        this.assets = {};
        this.sounds = {};
        this.assetsLoaded = false;
        
        // Game state
        this.STATE_TUTORIAL = 0;
        this.STATE_PLAYING = 1;
        this.STATE_GAMEOVER = 2;
        this.gameState = this.STATE_TUTORIAL;
        
        this.setupEventListeners();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Setup canvas for high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.width = rect.width;
        this.height = rect.height;
    }
    
    setupResponsiveElements() {
        // Set bird size based on pipe gap for ideal fit
        const pipeGap = Math.floor(this.height * 0.28);
        const birdIdealHeight = Math.floor(pipeGap * 0.6); // 60% of pipe gap
        const birdAspectRatio = 1; // Assume 1:1 for now, adjust if needed
        this.birdSize = {
            height: birdIdealHeight,
            width: Math.floor(birdIdealHeight * birdAspectRatio)
        };
        // Background speed
        this.bgSpeed = Math.max(1, Math.floor(this.width * 0.0006));
        // Fonts
        this.font = Math.floor(this.height * 0.055) + 'px Arial';
        this.bigFont = Math.floor(this.height * 0.11) + 'px Arial';
        this.buttonFont = Math.floor(this.height * 0.027) + 'px Arial';
        // Game variables
        this.pipeGapInitial = pipeGap;
        this.pipeSpeedInitial = Math.max(7, Math.floor(this.width * 0.0069));
        this.pipeWidth = Math.floor(this.width * 0.075);
        this.pipeSpacing = Math.floor(this.width * 0.44);
        // Button sizes
        this.pauseBtnSize = Math.floor(Math.min(this.width, this.height) * 0.06);
        this.pauseBtnPos = {
            x: Math.floor(this.width * 0.0125),
            y: Math.floor(this.height * 0.022)
        };
        // Menu buttons
        this.menuBtnWidth = Math.floor(this.width * 0.15);
        this.menuBtnHeight = Math.floor(this.height * 0.09);
        this.menuBtnSpacing = Math.floor(this.height * 0.04);
        // Game over buttons
        this.gameoverBtnWidth = Math.floor(this.width * 0.125);
        this.gameoverBtnHeight = Math.floor(this.height * 0.067);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.setupResponsiveElements();
        });
        
        // Touch controls for mobile
        const upBtn = document.getElementById('upBtn');
        const downBtn = document.getElementById('downBtn');
        
        if (upBtn && downBtn) {
            upBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileControlUp = true;
            });
            
            upBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileControlUp = false;
            });
            
            downBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileControlDown = true;
            });
            
            downBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileControlDown = false;
            });
        }
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // Mouse controls
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Touch controls for canvas
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.handleClick({ clientX: x, clientY: y });
        });
    }
    
    async loadAssets() {
        const loadImage = (src, fallback) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.error('Failed to load image:', src);
                    resolve(fallback());
                };
                img.src = src;
            });
        };
        const createColoredImage = (width, height, color) => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, width, height);
            const img = new Image();
            img.src = canvas.toDataURL();
            return img;
        };
        const loadSound = (src) => {
            return new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.oncanplaythrough = () => resolve(audio);
                audio.onerror = reject;
                audio.src = src;
            });
        };
        // Load images with individual fallback
        this.assets.bird = await loadImage('assets/bird.png', () => createColoredImage(this.birdSize.width, this.birdSize.height, '#FFD700'));
        this.assets.bg = await loadImage('assets/bg.png', () => createColoredImage(this.width, this.height, '#87CEEB'));
        this.assets.snake = await loadImage('assets/snake.png', () => createColoredImage(50, 80, '#228B22'));
        this.assets.cactus = await loadImage('assets/cactus.png', () => createColoredImage(50, 80, '#228B22'));
        this.assets.hand = await loadImage('assets/hand.png', () => createColoredImage(100, 100, '#FDBCB4'));
        // Load sounds (keep as before)
        try {
            this.sounds.gameStart = await loadSound('assets/sounds/game-start.wav');
        } catch (e) {
            this.sounds.gameStart = { play: () => {} };
        }
        try {
            this.sounds.lose = await loadSound('assets/sounds/lose.wav');
        } catch (e) {
            this.sounds.lose = { play: () => {} };
        }
        this.assetsLoaded = true;
        return true;
    }
    
    createFallbackAssets() {
        // Create colored rectangles as fallbacks
        const createColoredImage = (width, height, color) => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, width, height);
            const img = new Image();
            img.src = canvas.toDataURL();
            return img;
        };
        
        this.assets.bird = createColoredImage(this.birdSize.width, this.birdSize.height, '#FFD700');
        this.assets.bg = createColoredImage(this.width, this.height, '#87CEEB');
        this.assets.snake = createColoredImage(50, 80, '#228B22');
        this.assets.cactus = createColoredImage(50, 80, '#228B22');
        this.assets.hand = createColoredImage(100, 100, '#FDBCB4');
        
        // Create silent audio contexts for fallback
        this.sounds.gameStart = { play: () => {} };
        this.sounds.lose = { play: () => {} };
    }
    
    drawImage(img, x, y, width, height) {
        if (img && img.complete) {
            if (width && height) {
                this.ctx.drawImage(img, x, y, width, height);
            } else {
                this.ctx.drawImage(img, x, y);
            }
        }
    }
    
    fillRect(color, x, y, width, height, borderRadius = 0) {
        this.ctx.fillStyle = color;
        if (borderRadius > 0) {
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, width, height, borderRadius);
            this.ctx.fill();
        } else {
            this.ctx.fillRect(x, y, width, height);
        }
    }
    
    strokeRect(color, x, y, width, height, lineWidth = 1, borderRadius = 0) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        if (borderRadius > 0) {
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, width, height, borderRadius);
            this.ctx.stroke();
        } else {
            this.ctx.strokeRect(x, y, width, height);
        }
    }
    
    fillText(text, x, y, font, color, align = 'left', baseline = 'top') {
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        this.ctx.fillText(text, x, y);
    }
    
    measureText(text, font) {
        this.ctx.font = font;
        return this.ctx.measureText(text);
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    handleKeyPress(event) {
        // Will be implemented by game logic
    }
    
    handleClick(event) {
        // Will be implemented by game logic
    }
    
    loadHighScore() {
        try {
            return parseInt(localStorage.getItem('flappyGestureHighScore') || '0');
        } catch {
            return 0;
        }
    }
    
    saveHighScore(score) {
        try {
            localStorage.setItem('flappyGestureHighScore', score.toString());
        } catch (error) {
            console.error('Could not save high score:', error);
        }
    }
}