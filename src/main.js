class FlappyGestureGame {
    constructor() {
        this.engine = new GameEngine();
        this.handTracking = new HandTracking();
        this.gameLogic = null;
        this.renderer = null;
        this.lastTime = 0;
        this.isRunning = false;
        this.init();
    }

    async init() {
        // Show loading screen
        this.updateLoadingProgress(10, 'Initializing game engine...');
        // Load assets
        this.updateLoadingProgress(30, 'Loading game assets...');
        await this.engine.loadAssets();
        // Initialize hand tracking
        this.updateLoadingProgress(60, 'Setting up camera and hand tracking...');
        await this.handTracking.initialize();
        // Initialize game logic
        this.updateLoadingProgress(80, 'Setting up game logic...');
        this.gameLogic = new GameLogic(this.engine, this.handTracking);
        this.renderer = new GameRenderer(this.engine, this.gameLogic);
        // Complete loading
        this.updateLoadingProgress(100, 'Ready to play!');
        setTimeout(() => {
            this.hideLoadingScreen();
            this.start();
        }, 500);
    }

    updateLoadingProgress(percent, message) {
        const progressBar = document.querySelector('.loading-progress');
        const loadingMessage = document.querySelector('.loading-content h2');
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
        if (loadingMessage && message) {
            loadingMessage.textContent = message;
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }

    start() {
        this.isRunning = true;
        this.gameLoop();
    }

    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        // Update game logic
        this.gameLogic.update(deltaTime);
        // Render
        this.renderer.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    stop() {
        this.isRunning = false;
        this.handTracking.destroy();
    }
}

class GameRenderer {
    constructor(engine, gameLogic) {
        this.engine = engine;
        this.gameLogic = gameLogic;
    }
    render() {
        this.engine.clear();
        if (this.engine.gameState === this.engine.STATE_TUTORIAL) {
            this.renderTutorial();
        } else {
            this.renderGame();
        }
    }
    renderTutorial() {
        // Draw background
        this.drawScrollingBackground();
        // Calculate safe spacing for bird and hand
        const margin = Math.max(this.engine.width * 0.04, 12);
        const handSize = Math.floor(this.engine.height * 0.22);
        const birdW = this.engine.birdSize.width * this.gameLogic.tutBirdScale;
        const birdH = this.engine.birdSize.height * this.gameLogic.tutBirdScale;
        // Place bird on left, hand on right, with enough gap between
        let birdX = margin;
        let handX = this.engine.width - margin - handSize;
        // If window is very narrow, reduce hand size and margin
        let minGap = Math.max(this.engine.width * 0.06, 24);
        if (handX - (birdX + birdW) < minGap) {
            // Not enough space, shrink hand and move it closer to the right
            const available = this.engine.width - 2 * margin - birdW - minGap;
            const safeHandSize = Math.max(Math.min(handSize, available), 32);
            handX = this.engine.width - margin - safeHandSize;
        }
        const birdY = this.engine.height / 2 - birdH / 2;
        const scaledWidth = birdW;
        const scaledHeight = birdH;
        this.engine.drawImage(this.engine.assets.bird, birdX, birdY, scaledWidth, scaledHeight);
        // Improved instruction panel
        const panelW = Math.floor(this.engine.width * 0.38);
        const panelH = Math.floor(this.engine.height * 0.11);
        const panelX = this.engine.width / 2 - panelW / 2;
        const panelY = Math.floor(this.engine.height * 0.13);
        // Panel background (yellow)
        this.engine.fillRect('#FFD700', panelX, panelY, panelW, panelH, 24);
        // Panel border (white)
        this.engine.strokeRect('#FFFFFF', panelX, panelY, panelW, panelH, 4, 24);
        const innerPanel = panelX + 5, innerPanelY = panelY + 5, innerPanelW = panelW - 10, innerPanelH = panelH - 10;
        this.engine.fillRect('#FFF9C4', innerPanel, innerPanelY, innerPanelW, innerPanelH, 18);
        this.engine.fillText(
            'Move your hand up/down to play',
            this.engine.width / 2,
            panelY + panelH / 2,
            Math.floor(this.engine.height * 0.027) + 'px Arial bold',
            '#FFD700', // yellow text
            'center',
            'middle'
        );
        // Draw hand and yellow arrows
        const centerY = this.engine.height / 2;
        const arrowGap = Math.floor(handSize * 0.38);
        const animOffset = Math.floor(10 * Math.sin(Date.now() / 300.0));
        // Up arrow (yellow blink)
        const upY = centerY - handSize / 2 - arrowGap - animOffset;
        const arrowColor = this.gameLogic.blinkState ? '#FFD700' : '#FFF9C4';
        this.engine.ctx.fillStyle = arrowColor;
        this.engine.ctx.beginPath();
        this.engine.ctx.moveTo(handX + handSize / 2, upY - 30);
        this.engine.ctx.lineTo(handX + handSize / 2 - 20, upY + 20);
        this.engine.ctx.lineTo(handX + handSize / 2 + 20, upY + 20);
        this.engine.ctx.closePath();
        this.engine.ctx.fill();
        this.engine.fillRect(arrowColor, handX + handSize / 2 - 6, upY + 20, 12, 24, 4);
        // Hand
        this.engine.drawImage(this.engine.assets.hand, handX, centerY - handSize / 2, handSize, handSize);
        // Down arrow (yellow blink)
        const downY = centerY + handSize / 2 + arrowGap + animOffset;
        this.engine.ctx.fillStyle = arrowColor;
        this.engine.ctx.beginPath();
        this.engine.ctx.moveTo(handX + handSize / 2, downY + 30);
        this.engine.ctx.lineTo(handX + handSize / 2 - 20, downY - 20);
        this.engine.ctx.lineTo(handX + handSize / 2 + 20, downY - 20);
        this.engine.ctx.closePath();
        this.engine.ctx.fill();
        this.engine.fillRect(arrowColor, handX + handSize / 2 - 6, downY - 44, 12, 24, 4);
        // Only show the bottom line, with yellow color and smaller size
        this.engine.fillText(
            'Press any key to play',
            this.engine.width / 2,
            Math.floor(this.engine.height * 0.94),
            Math.floor(this.engine.height * 0.025) + 'px Verdana',
            '#FFD700', // yellow
            'center'
        );
    }
    renderGame() {
        // Draw background
        this.drawScrollingBackground();
        if (!this.gameLogic.showGameOver && !this.gameLogic.showMenu) {
            // Draw pipes
            this.drawPipes();
            // Draw bird with possible transition scale
            let birdScale = this.gameLogic.tutBirdScale || 1.0;
            let birdWidth = this.gameLogic.bird.width * birdScale;
            let birdHeight = this.gameLogic.bird.height * birdScale;
            let birdX = this.gameLogic.bird.x - (birdWidth - this.gameLogic.bird.width) / 2;
            let birdY = this.gameLogic.bird.y - (birdHeight - this.gameLogic.bird.height) / 2;
            this.engine.drawImage(
                this.engine.assets.bird,
                birdX,
                birdY,
                birdWidth,
                birdHeight
            );
            // Draw UI
            this.drawScore();
            this.drawLevelBar();
            this.drawLevelText();
            // Draw popup only if not showing the animated popup
            if (this.gameLogic.popupVisible && !this.gameLogic.levelUpPopupActive) {
                this.drawPopup(`LEVEL ${this.gameLogic.level}`);
            }
            // Draw level up popup animation
            if (this.gameLogic.levelUpPopupActive) {
                const popupDuration = 400; // ms
                const elapsed = Date.now() - this.gameLogic.levelUpPopupStart;
                let scale = 0.9 + 0.4 * (elapsed / popupDuration); // from 0.9x to 1.3x
                if (scale > 1.3) scale = 1.3;
                const text = this.gameLogic.levelUpPopupText;
                const fontSize = Math.floor(this.engine.height * 0.09 * scale);
                const font = `${fontSize}px Arial`;
                this.engine.fillText(
                    text,
                    this.engine.width / 2,
                    this.engine.height / 2,
                    font,
                    '#FFD700',
                    'center',
                    'middle'
                );
            }
        }
        // Draw pause button
        this.drawPauseButton();
        if (this.gameLogic.showGameOver) {
            this.drawGameOver();
        }
        if (this.gameLogic.showMenu) {
            this.drawPauseMenu();
        }
    }
    drawScrollingBackground() {
        let x = this.gameLogic.bgX % this.engine.width;
        if (x > 0) x -= this.engine.width;
        for (; x < this.engine.width; x += this.engine.width) {
            this.engine.drawImage(this.engine.assets.bg, x, 0, this.engine.width + 1, this.engine.height);
        }
    }
    drawPipes() {
        this.gameLogic.pipes.forEach(pipe => {
            const gapTop = Math.round(pipe.gapTop);
            const gapBottom = Math.round(gapTop + this.gameLogic.pipeGap);
            // Draw pipe segments
            this.engine.fillRect(this.engine.BROWN, pipe.x, 0, this.engine.pipeWidth, gapTop);
            const bottomPipeHeight = Math.max(0, this.engine.height - gapBottom);
            this.engine.fillRect(this.engine.BROWN, pipe.x, gapBottom, this.engine.pipeWidth, bottomPipeHeight);
            // Draw smaller, softer pipe caps
            const capHeight = 16;
            const capWidth = this.engine.pipeWidth + 16;
            const capRadius = 12;
            this.engine.fillRect(this.engine.PIPE_CAP_COLOR, pipe.x - 8, gapTop - capHeight, capWidth, capHeight, capRadius);
            this.engine.fillRect(this.engine.PIPE_CAP_COLOR, pipe.x - 8, gapBottom, capWidth, capHeight, capRadius);
            // Draw obstacles
            if (pipe.obstacle !== 'none') {
                const obsScale = 0.7;
                const obsSize = 80 * obsScale;
                const obsX = pipe.x + this.engine.pipeWidth / 2 - obsSize / 2;
                const obsY = gapBottom - obsSize;
                const obsImg = pipe.obstacle === 'snake' ? this.engine.assets.snake : this.engine.assets.cactus;
                this.engine.drawImage(obsImg, obsX, obsY, obsSize, obsSize);
            }
        });
    }
    drawScore() {
        // Responsive scoreboard (top right)
        const minBoardWidth = 90;
        const minBoardHeight = 38;
        const boardWidth = Math.max(this.engine.width * 0.16, minBoardWidth); // 16% of width, min 90px
        const boardHeight = Math.max(this.engine.height * 0.09, minBoardHeight); // 9% of height, min 38px
        const boardX = Math.max(8, this.engine.width - boardWidth - Math.max(this.engine.width * 0.025, 8));
        const boardY = Math.max(this.engine.height * 0.025, 8);
        this.engine.fillRect('#FFB43C', boardX, boardY, boardWidth, boardHeight, boardHeight * 0.34);
        this.engine.strokeRect('#FF8C1E', boardX, boardY, boardWidth, boardHeight, 0.08 * boardHeight, boardHeight * 0.34);
        this.engine.fillRect('#78C83C', boardX + boardWidth * 0.055, boardY + boardHeight * 0.11, boardWidth * 0.89, boardHeight * 0.78, boardHeight * 0.26);
        const scoreText = this.gameLogic.score.toString();
        const scoreCenterX = boardX + boardWidth / 2;
        const scoreCenterY = boardY + boardHeight / 2;
        const fontSize = Math.max(Math.floor(boardHeight * 0.54), 13);
        const font = `${fontSize}px Arial Black`;
        this.engine.fillText(scoreText, scoreCenterX + 2, scoreCenterY + 2, font, '#3C5028', 'center', 'middle');
        this.engine.fillText(scoreText, scoreCenterX, scoreCenterY, font, '#FFFFFF', 'center', 'middle');
    }
    drawLevelBar() {
        const barWidth = Math.max(this.engine.width * 0.38, 160);
        const barHeight = Math.max(this.engine.height * 0.025, 12);
        const progress = Math.min((Date.now() - this.gameLogic.levelStartTime) / this.engine.LEVEL_INTERVAL, 1);
        const x = this.engine.width / 2 - barWidth / 2;
        const y = Math.max(this.engine.height * 0.045, 12);
        this.engine.ctx.save();
        this.engine.ctx.beginPath();
        this.engine.ctx.moveTo(x + barHeight / 2, y);
        this.engine.ctx.lineTo(x + barWidth - barHeight / 2, y);
        this.engine.ctx.arc(x + barWidth - barHeight / 2, y + barHeight / 2, barHeight / 2, -Math.PI / 2, Math.PI / 2);
        this.engine.ctx.lineTo(x + barHeight / 2, y + barHeight);
        this.engine.ctx.arc(x + barHeight / 2, y + barHeight / 2, barHeight / 2, Math.PI / 2, -Math.PI / 2);
        this.engine.ctx.closePath();
        this.engine.ctx.fillStyle = '#222';
        this.engine.ctx.globalAlpha = 0.18;
        this.engine.ctx.fill();
        this.engine.ctx.globalAlpha = 1;
        const grad = this.engine.ctx.createLinearGradient(x, y, x + barWidth, y);
        grad.addColorStop(0, '#FFD700');
        grad.addColorStop(1, '#8BC34A');
        this.engine.ctx.save();
        this.engine.ctx.beginPath();
        this.engine.ctx.moveTo(x + barHeight / 2, y);
        this.engine.ctx.lineTo(x + barHeight / 2 + (barWidth - barHeight) * progress, y);
        this.engine.ctx.arc(x + barHeight / 2 + (barWidth - barHeight) * progress, y + barHeight / 2, barHeight / 2, -Math.PI / 2, Math.PI / 2);
        this.engine.ctx.lineTo(x + barHeight / 2, y + barHeight);
        this.engine.ctx.arc(x + barHeight / 2, y + barHeight / 2, barHeight / 2, Math.PI / 2, -Math.PI / 2);
        this.engine.ctx.closePath();
        this.engine.ctx.fillStyle = grad;
        this.engine.ctx.fill();
        this.engine.ctx.restore();
        this.engine.ctx.save();
        this.engine.ctx.beginPath();
        this.engine.ctx.moveTo(x + barHeight / 2, y);
        this.engine.ctx.lineTo(x + barWidth - barHeight / 2, y);
        this.engine.ctx.arc(x + barWidth - barHeight / 2, y + barHeight / 2, barHeight / 2, -Math.PI / 2, Math.PI / 2);
        this.engine.ctx.lineTo(x + barHeight / 2, y + barHeight);
        this.engine.ctx.arc(x + barHeight / 2, y + barHeight / 2, barHeight / 2, Math.PI / 2, -Math.PI / 2);
        this.engine.ctx.closePath();
        this.engine.ctx.strokeStyle = '#FFFFFF';
        this.engine.ctx.lineWidth = Math.max(barHeight * 0.18, 2);
        this.engine.ctx.stroke();
        this.engine.ctx.restore();
    }
    drawLevelText() {
        this.engine.fillText(
            `Level: ${this.gameLogic.level}`,
            this.engine.width / 2,
            70,
            this.engine.font,
            this.engine.YELLOW,
            'center'
        );
    }
    drawPopup(text) {
        this.engine.fillText(text, this.engine.width / 2 + 3, this.engine.height / 2 - 60 + 3, this.engine.bigFont, this.engine.RED, 'center');
        this.engine.fillText(text, this.engine.width / 2, this.engine.height / 2 - 60, this.engine.bigFont, this.engine.YELLOW, 'center');
    }
    drawPauseButton() {
        const btnRect = {
            x: this.engine.pauseBtnPos.x,
            y: this.engine.pauseBtnPos.y,
            width: this.engine.pauseBtnSize,
            height: this.engine.pauseBtnSize
        };
        this.engine.fillRect('rgba(20, 20, 20, 0.7)', btnRect.x + 3, btnRect.y + 3, btnRect.width, btnRect.height, 14);
        this.engine.fillRect('#FFCC00', btnRect.x, btnRect.y, btnRect.width, btnRect.height, 14);
        this.engine.fillRect('#FFE650', btnRect.x + 3, btnRect.y + 3, btnRect.width - 6, btnRect.height - 6, 10);
        const barWidth = 10;
        const barHeight = 32;
        const barGap = 12;
        const barX1 = btnRect.x + btnRect.width / 2 - barGap / 2 - barWidth;
        const barX2 = btnRect.x + btnRect.width / 2 + barGap / 2;
        const barY = btnRect.y + btnRect.height / 2 - barHeight / 2;
        this.engine.fillRect('#000000', barX1, barY, barWidth, barHeight, 4);
        this.engine.fillRect('#000000', barX2, barY, barWidth, barHeight, 4);
    }
    drawGameOver() {
        this.drawPopup('GAME OVER');
        const scoreText = `Score: ${this.gameLogic.score} | High Score: ${this.engine.loadHighScore()}`;
        const popupY = this.engine.height / 2 - Math.max(this.engine.height * 0.09, 38);
        const buttonsY = this.engine.height / 2 + Math.max(this.engine.height * 0.11, 38) + Math.max(this.engine.height * 0.03, 8);
        const scoreY = Math.floor((popupY + buttonsY) / 2);
        const scoreFontSize = Math.max(Math.floor(this.engine.height * 0.045), 12);
        const scoreFont = `${scoreFontSize}px Arial`;
        this.engine.fillText(scoreText, this.engine.width / 2, scoreY, scoreFont, this.engine.WHITE, 'center');
        // Responsive buttons
        const minBtnWidth = 80;
        const minBtnHeight = 28;
        const btnWidth = Math.max(this.engine.width * 0.16, minBtnWidth);
        const btnHeight = Math.max(this.engine.height * 0.09, minBtnHeight);
        const btnY = this.engine.height / 2 + Math.max(this.engine.height * 0.11, 38);
        const gap = Math.max(this.engine.width * 0.025, 8);
        const playAgainBtn = {
            x: this.engine.width / 2 - btnWidth - gap / 2,
            y: btnY,
            width: btnWidth,
            height: btnHeight
        };
        const quitBtn = {
            x: this.engine.width / 2 + gap / 2,
            y: btnY,
            width: btnWidth,
            height: btnHeight
        };
        this.engine.fillRect(this.engine.DARK_GRAY, playAgainBtn.x, playAgainBtn.y, playAgainBtn.width, playAgainBtn.height, btnHeight * 0.22);
        this.engine.fillRect(this.engine.DARK_GRAY, quitBtn.x, quitBtn.y, quitBtn.width, btnHeight, btnHeight * 0.22);
        // Responsive button text (shrink if needed)
        let btnFontSize = Math.max(Math.floor(btnHeight * 0.38), 11);
        let btnFont = `${btnFontSize}px Arial`;
        // If text is too wide, shrink font
        const ctx = this.engine.ctx;
        ctx.font = btnFont;
        let playAgainWidth = ctx.measureText('PLAY AGAIN').width;
        if (playAgainWidth > btnWidth - 12) {
            btnFontSize = Math.floor(btnFontSize * (btnWidth - 18) / playAgainWidth);
            btnFont = `${btnFontSize}px Arial`;
        }
        this.engine.fillText('PLAY AGAIN', playAgainBtn.x + playAgainBtn.width / 2, playAgainBtn.y + playAgainBtn.height / 2, btnFont, this.engine.WHITE, 'center', 'middle');
        this.engine.fillText('QUIT', quitBtn.x + quitBtn.width / 2, quitBtn.y + quitBtn.height / 2, btnFont, this.engine.WHITE, 'center', 'middle');
    }
    drawPauseMenu() {
        this.engine.fillRect('rgba(0, 0, 0, 0.7)', 0, 0, this.engine.width, this.engine.height);
        const resumeBtn = {
            x: this.engine.width / 2 - this.engine.menuBtnWidth / 2,
            y: this.engine.height / 2 - this.engine.menuBtnHeight - this.engine.menuBtnSpacing / 2,
            width: this.engine.menuBtnWidth,
            height: this.engine.menuBtnHeight
        };
        const quitMenuBtn = {
            x: this.engine.width / 2 - this.engine.menuBtnWidth / 2,
            y: this.engine.height / 2 + this.engine.menuBtnSpacing / 2,
            width: this.engine.menuBtnWidth,
            height: this.engine.menuBtnHeight
        };
        this.engine.fillRect(this.engine.DARK_GRAY, resumeBtn.x, resumeBtn.y, resumeBtn.width, resumeBtn.height, 12);
        this.engine.fillRect(this.engine.DARK_GRAY, quitMenuBtn.x, quitMenuBtn.y, quitMenuBtn.width, quitMenuBtn.height, 12);
        this.engine.fillText('RESUME', resumeBtn.x + resumeBtn.width / 2, resumeBtn.y + resumeBtn.height / 2, this.engine.buttonFont, this.engine.WHITE, 'center', 'middle');
        this.engine.fillText('QUIT', quitMenuBtn.x + quitMenuBtn.width / 2, quitMenuBtn.y + quitMenuBtn.height / 2, this.engine.buttonFont, this.engine.WHITE, 'center', 'middle');
    }
}

// Responsive minimums as a percentage of screen size
const MIN_WIDTH_PCT = 0.5; // 50% of screen width
const MIN_HEIGHT_PCT = 0.8; // 80% of screen height
let gameInstance = null;
let messageShown = false;

function meetsMinSize() {
    return window.innerWidth >= Math.floor(window.screen.width * MIN_WIDTH_PCT) &&
           window.innerHeight >= Math.floor(window.screen.height * MIN_HEIGHT_PCT);
}

function showSizeMessage() {
    if (messageShown) return;
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#111;color:#FFD700;font-size:1.5rem;text-align:center;">
        <p><b>This game uses webcam hand gesture controls and is best played on a desktop or laptop.</b></p>
        <p>Please open this page on a PC or Mac with a webcam to play!<br>Minimum window size: 50% width and nearly full height</p>
      </div>
    `;
    messageShown = true;
}

function restoreGameUI() {
    if (!messageShown) return;
    // Reload the page to restore the original HTML and scripts
    window.location.reload();
}

function handleResize() {
    if (!meetsMinSize()) {
        if (gameInstance && gameInstance.stop) gameInstance.stop();
        gameInstance = null;
        showSizeMessage();
    } else {
        restoreGameUI();
    }
}

window.addEventListener('load', () => {
    if (!meetsMinSize()) {
        showSizeMessage();
        return;
    }
    gameInstance = new FlappyGestureGame();
    // Fullscreen toggle logic
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const exitFullscreenBtn = document.getElementById('exitFullscreenBtn');
    const gameContainer = document.getElementById('gameContainer');
    function isFullscreen() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    }
    function enterFullscreen() {
        if (gameContainer.requestFullscreen) gameContainer.requestFullscreen();
        else if (gameContainer.webkitRequestFullscreen) gameContainer.webkitRequestFullscreen();
        else if (gameContainer.mozRequestFullScreen) gameContainer.mozRequestFullScreen();
        else if (gameContainer.msRequestFullscreen) gameContainer.msRequestFullscreen();
    }
    function exitFullscreen() {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
    function toggleFullscreen() {
        if (isFullscreen()) exitFullscreen();
        else enterFullscreen();
    }
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    exitFullscreenBtn.addEventListener('click', exitFullscreen);
    // Show/hide buttons on fullscreen change
    function updateFullscreenButtons() {
        if (isFullscreen()) {
            fullscreenBtn.style.display = 'none';
            exitFullscreenBtn.style.display = 'flex';
        } else {
            fullscreenBtn.style.display = 'flex';
            exitFullscreenBtn.style.display = 'none';
        }
    }
    document.addEventListener('fullscreenchange', updateFullscreenButtons);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButtons);
    document.addEventListener('mozfullscreenchange', updateFullscreenButtons);
    document.addEventListener('MSFullscreenChange', updateFullscreenButtons);
    // F11 key support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
    });
    // Initial state
    updateFullscreenButtons();
});

window.addEventListener('resize', handleResize);