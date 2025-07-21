class GameLogic {
    constructor(engine, handTracking) {
        this.engine = engine;
        this.handTracking = handTracking;
        
        // Game state variables
        this.score = 0;
        this.level = 1;
        this.pipeGap = this.engine.pipeGapInitial;
        this.pipeSpeed = this.engine.pipeSpeedInitial;
        this.pipes = [];
        this.levelStartTime = Date.now();
        this.popupVisible = false;
        this.popupTimer = 0;
        this.showGameOver = false;
        this.showMenu = false;
        this.tutorialShown = false;
        this.transitionDone = false;
        this.tutorialStartTime = Date.now();
        
        // Bird physics
        this.bird = {
            x: this.engine.width / 4,
            y: this.engine.height / 2,
            width: this.engine.birdSize.width,
            height: this.engine.birdSize.height,
            velocity: 0
        };
        
        this.gravity = 1.2;
        this.birdLift = -18;
        this.ySmooth = this.engine.height / 2;
        
        // Background scrolling
        this.bgX = 0;
        
        // Animation states
        this.blinkTimer = 0;
        this.blinkState = true;
        this.arrowAnimPhase = 0;
        this.tutBirdScale = 2.2; // Make the tutorial bird even larger
        
        // Input handling
        this.engine.handleKeyPress = this.handleKeyPress.bind(this);
        this.engine.handleClick = this.handleClick.bind(this);
        
        this.resetGame();
        this.lastObstacleTime = 0;
        this.obstacleInterval = 3000; // Minimum ms between obstacles
        this.levelUpSlowdown = false;
        this.levelUpSlowdownTimer = 0;
        this.slowdownPipeSpeed = 0;
        this.truePipeSpeed = 0;
        this.levelUpPopupActive = false;
        this.levelUpPopupStart = 0;
        this.levelUpPopupText = '';
        this.nextPipeShouldSmooth = false;
    }
    
    resetGame() {
        this.score = 0;
        this.level = 1;
        this.pipeGap = this.engine.pipeGapInitial;
        this.pipeSpeed = this.engine.pipeSpeedInitial;
        this.ySmooth = this.engine.height / 2;
        this.pipes = [];
        this.bird.x = this.engine.width / 4;
        this.bird.y = this.engine.height / 2;
        this.bird.velocity = 0;
        this.levelStartTime = Date.now();
        this.popupVisible = false;
        this.popupTimer = 0;
        this.showGameOver = false;
        this.showMenu = false;
        this.bgX = 0;
        this.lastObstacleTime = 0;
        this.obstacleInterval = 3000;
        this.levelUpSlowdown = false;
        this.levelUpSlowdownTimer = 0;
        this.truePipeSpeed = this.pipeSpeed;
        this.levelUpPopupActive = false;
        this.levelUpPopupStart = 0;
        this.levelUpPopupText = '';
        this.nextPipeShouldSmooth = false;
        // Initialize ySmooth to current hand position for immediate control
        const camHeight = this.handTracking.getCameraHeight && this.handTracking.getCameraHeight();
        const y = this.handTracking.getHandY && this.handTracking.getHandY();
        if (camHeight && y !== null && y !== undefined) {
            const minY = 0.2;
            const maxY = 0.8;
            let normY = y / camHeight;
            normY = (normY - minY) / (maxY - minY);
            normY = Math.max(0, Math.min(normY, 1));
            this.ySmooth = normY;
            this.bird.y = Math.floor(normY * (this.engine.height - this.bird.height));
        } else {
            this.ySmooth = 0.5;
            this.bird.y = Math.floor(0.5 * (this.engine.height - this.bird.height));
        }
    }
    
    update(deltaTime) {
        const currentTime = Date.now();
        
        if (this.engine.gameState === this.engine.STATE_TUTORIAL) {
            this.updateTutorial(currentTime);
        } else if (this.engine.gameState === this.engine.STATE_PLAYING) {
            this.updateGame(currentTime, deltaTime);
        }
        
        // Removed: this.updateBackground();
    }
    
    updateTutorial(currentTime) {
        // Blinking logic for arrows
        if (currentTime - this.blinkTimer > 500) {
            this.blinkState = !this.blinkState;
            this.blinkTimer = currentTime;
        }
        // Check for hand input only (no auto-start)
        let tutorialHandRaised = false;
        const y = this.handTracking.getHandY();
        if (y !== null && y < this.handTracking.getCameraHeight() * 0.7) {
            tutorialHandRaised = true;
        }
        // Remove auto-start after 2 seconds
        // if (!this.transitionDone && (currentTime - this.tutorialStartTime > 2000)) {
        //     tutorialHandRaised = true;
        // }
        if (tutorialHandRaised && !this.transitionDone) {
            this.startGameTransition();
        }
    }
    
    async startGameTransition() {
        this.engine.sounds.gameStart.play();
        this.transitionDone = true;
        // Remove tutorial and start game logic immediately
        this.resetGame();
        this.tutorialShown = true;
        this.engine.gameState = this.engine.STATE_PLAYING;
        // Animate bird shrinking while keeping it centered
        const shrinkSteps = 18;
        const shrinkDuration = 380; // ms
        const startScale = 2.2;
        const endScale = 1.0;
        this.isBirdTransitioning = true;
        for (let i = 0; i < shrinkSteps; i++) {
            this.tutBirdScale = startScale - (startScale - endScale) * (i / (shrinkSteps - 1));
            // Keep bird centered vertically during transition
            this.bird.y = this.engine.height / 2 - this.bird.height / 2;
            await new Promise(res => setTimeout(res, shrinkDuration / shrinkSteps));
        }
        this.tutBirdScale = endScale;
        this.isBirdTransitioning = false;
        // Prevent bird from falling after transition
        this.bird.velocity = 0;
        // Instantly sync bird to hand after transition
        const camHeight = this.handTracking.getCameraHeight && this.handTracking.getCameraHeight();
        const y = this.handTracking.getHandY && this.handTracking.getHandY();
        if (camHeight && y !== null && y !== undefined) {
            let normY = y / camHeight;
            normY = Math.max(0, Math.min(normY, 1));
            const margin = this.engine.height * 0.07;
            this.ySmooth = normY;
            this.bird.y = Math.floor(margin + normY * (this.engine.height - 2 * margin));
        } else {
            this.ySmooth = 0.5;
            this.bird.y = Math.floor(0.5 * (this.engine.height - this.bird.height));
        }
        this.isBirdTransitioning = false;
        this.engine.gameState = this.engine.STATE_PLAYING;
        this.waitingForFirstHandInput = false;
        if (isNaN(this.bird.y)) {
            this.bird.y = Math.floor(0.5 * (this.engine.height - this.bird.height));
        }
        if (isNaN(this.ySmooth)) {
            this.ySmooth = 0.5;
        }
        console.log('Transition complete, game started:', this.bird.y, this.ySmooth, this.engine.gameState);
    }
    
    updateGame(currentTime, deltaTime) {
        if (this.showGameOver || this.showMenu) return;
        if (!this.isBirdTransitioning) {
            this.handleInput();
        }
        // Level progression
        if (currentTime - this.levelStartTime >= this.engine.LEVEL_INTERVAL && this.level < this.engine.MAX_LEVEL) {
            this.level++;
            // Speed curve: easy start, rapid ramp at 5-8
            if (this.level === 2) {
                this.pipeSpeed += 1;
            } else if (this.level === 3) {
                this.pipeSpeed += 2;
            } else if (this.level === 4) {
                this.pipeSpeed += 2;
            } else if (this.level === 5) {
                this.pipeSpeed += 4;
            } else if (this.level === 6) {
                this.pipeSpeed += 5;
            } else if (this.level === 7) {
                this.pipeSpeed += 5;
            } else if (this.level === 8) {
                this.pipeSpeed += 4;
            } else if (this.level >= 9) {
                this.pipeSpeed += 1;
            }
            this.pipeGap = Math.max(180, this.pipeGap - 20);
            // Update bird size to always fit through the gap
            const birdIdealHeight = Math.floor(this.pipeGap * 0.6); // 60% of current gap
            const birdAspectRatio = 1; // Assume 1:1 for now
            this.engine.birdSize = {
                height: birdIdealHeight,
                width: Math.floor(birdIdealHeight * birdAspectRatio)
            };
            this.levelStartTime = currentTime;
            // Remove: this.popupVisible = true; this.popupTimer = currentTime;
            // Juicy effect: slow down for 0.2s
            this.levelUpSlowdown = true;
            this.levelUpSlowdownTimer = Date.now();
            this.slowdownPipeSpeed = Math.max(2, Math.floor(this.pipeSpeed * 0.7)); // 70% slowdown
            this.truePipeSpeed = this.pipeSpeed;
            // Level up popup animation
            this.levelUpPopupActive = true;
            this.levelUpPopupStart = Date.now();
            this.levelUpPopupText = `LEVEL ${this.level}`;
            // Pipe gap smoothing for next pipe
            this.nextPipeShouldSmooth = true;
            // Play level up sound if available
            if (this.engine.sounds && this.engine.sounds.gameStart) {
                this.engine.sounds.gameStart.play();
            }
        }
        // Juicy slowdown effect
        let currentPipeSpeed = this.pipeSpeed;
        if (this.levelUpSlowdown) {
            currentPipeSpeed = this.slowdownPipeSpeed;
            if (Date.now() - this.levelUpSlowdownTimer > 200) { // 0.2s
                this.levelUpSlowdown = false;
                currentPipeSpeed = this.truePipeSpeed;
            }
        }
        // End popup after 0.4s
        if (this.levelUpPopupActive && Date.now() - this.levelUpPopupStart > 350) {
            this.levelUpPopupActive = false;
        }
        this.updatePipes(currentPipeSpeed);
        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.engine.width - this.engine.pipeSpacing) {
            this.spawnPipe();
        }
        this.checkCollisions();
        // Remove: if (this.popupVisible && currentTime - this.popupTimer > this.engine.POPUP_DURATION) { this.popupVisible = false; }
        this.updateBackground();
    }
    
    handleInput() {
        const y = this.handTracking.getHandY();
        // Wait for first hand input after transition
        if (this.waitingForFirstHandInput) {
            if (y !== null) {
                this.waitingForFirstHandInput = false;
            } else {
                // Keep bird at center line
                this.bird.y = this.engine.height / 2 - this.bird.height / 2;
                this.bird.velocity = 0;
                return;
            }
        }
        // Mobile controls
        if (this.engine.mobileControlUp || this.engine.mobileControlDown) {
            const targetY = this.engine.height * 0.2;
            if (this.engine.mobileControlUp) {
                this.bird.y = targetY;
            } else {
                this.bird.y = this.engine.height * 0.8;
            }
            this.bird.velocity = 0;
            return;
        }
        // Hand tracking
        if (y !== null) {
            const camHeight = this.handTracking.getCameraHeight();
            let normY = y / camHeight;
            normY = Math.max(0, Math.min(normY, 1));
            // Smoothing: 90% previous, 10% new
            this.ySmooth = 0.9 * (this.ySmooth ?? normY) + 0.1 * normY;
            let smoothNormY = this.ySmooth;
            smoothNormY = Math.max(0, Math.min(smoothNormY, 1));
            // Map to middle 86% of screen (7% margin)
            const margin = this.engine.height * 0.07;
            this.bird.y = Math.floor(margin + smoothNormY * (this.engine.height - 2 * margin));
            this.bird.y = Math.max(margin, Math.min(this.bird.y, this.engine.height - this.bird.height - margin));
            this.bird.velocity = 0;
        } else {
            // Do nothing: bird remains at its current position, no gravity
            return;
        }
    }
    
    updatePipes(pipeSpeedOverride) {
        const speed = pipeSpeedOverride !== undefined ? pipeSpeedOverride : this.pipeSpeed;
        this.pipes.forEach(pipe => {
            pipe.x -= speed;
        });
        
        // Remove pipes that are off screen and check for scoring
        this.pipes = this.pipes.filter(pipe => {
            if (!pipe.passed && pipe.x + this.engine.pipeWidth < this.bird.x) {
                pipe.passed = true;
                this.score++;
            }
            return pipe.x + this.engine.pipeWidth > 0;
        });
    }
    
    spawnPipe() {
        // Only allow obstacles after level 1 and if enough time has passed
        let now = Date.now();
        let allowObstacle = false;
        if (this.level >= 2 && (now - this.lastObstacleTime > this.obstacleInterval)) {
            allowObstacle = true;
            // Make interval shorter for higher scores (better performance)
            this.obstacleInterval = Math.max(1200, 3000 - this.score * 30);
            this.lastObstacleTime = now;
        }
        // Add margin so gap never goes too close to borders
        const margin = Math.floor(this.engine.height * 0.1); // 10% of screen height
        const maxGapTop = this.engine.height - this.pipeGap - margin;
        const minGapTop = margin;
        let gapTop;
        if (this.nextPipeShouldSmooth) {
            // Bias gap toward bird's current position
            const birdCenter = this.bird.y + this.bird.height / 2;
            let targetGapTop = birdCenter - this.pipeGap / 2;
            targetGapTop = Math.max(minGapTop, Math.min(targetGapTop, maxGapTop));
            // Add a little randomness
            gapTop = targetGapTop + (Math.random() - 0.5) * this.pipeGap * 0.3;
            gapTop = Math.max(minGapTop, Math.min(gapTop, maxGapTop));
            this.nextPipeShouldSmooth = false;
        } else {
            gapTop = Math.random() * (maxGapTop - minGapTop) + minGapTop;
            gapTop = Math.max(minGapTop, Math.min(gapTop, maxGapTop));
        }
        let obstacle = 'none';
        if (allowObstacle) {
            obstacle = this.getRandomObstacle();
        }
        this.pipes.push({
            x: this.engine.width + 100,
            gapTop: gapTop,
            obstacle: obstacle,
            passed: false
        });
    }
    
    getRandomObstacle() {
        const rand = Math.random();
        if (rand < 0.4) return 'snake';
        if (rand < 0.8) return 'cactus';
        return 'none';
    }
    
    checkCollisions() {
        this.pipes.forEach(pipe => {
            const gapTop = pipe.gapTop;
            const gapBottom = gapTop + this.pipeGap;
            // Bird hitbox (smaller than image)
            const birdHitbox = {
                x: this.bird.x + this.bird.width * 0.15,
                y: this.bird.y + this.bird.height * 0.15,
                width: this.bird.width * 0.7,
                height: this.bird.height * 0.7
            };

            if (
                birdHitbox.x + birdHitbox.width > pipe.x &&
                birdHitbox.x < pipe.x + this.engine.pipeWidth
            ) {
                // Top pipe
                if (birdHitbox.y < gapTop) {
                    this.gameOver();
                }
                // Bottom pipe
                if (birdHitbox.y + birdHitbox.height > gapBottom) {
                    this.gameOver();
                }
            }
            // Obstacle collision
            if (pipe.obstacle !== 'none') {
                const obsX = pipe.x + this.engine.pipeWidth / 2 - 40 * 0.7; // 0.7 for smaller obs
                const obsY = gapBottom - 80 * 0.7;
                const birdCenterX = this.bird.x + this.bird.width / 2;
                const birdCenterY2 = this.bird.y + this.bird.height / 2;
                const dist = Math.sqrt(Math.pow(birdCenterX - (obsX + 40 * 0.7), 2) + Math.pow(birdCenterY2 - (obsY + 40 * 0.7), 2));
                if (dist < 40) {
                    this.gameOver();
                }
            }
        });
    }
    
    gameOver() {
        this.engine.sounds.lose.play();
        this.showGameOver = true;
        this.engine.gameState = this.engine.STATE_GAMEOVER;
        // Update high score
        const currentHigh = this.engine.loadHighScore();
        if (this.score > currentHigh) {
            this.engine.saveHighScore(this.score);
        }
    }
    
    updateBackground() {
        this.bgX = (this.bgX - this.engine.bgSpeed) % this.engine.width;
    }
    
    handleKeyPress(event) {
        if (event.key === 'r' && this.showGameOver) {
            this.resetGame();
            if (!this.tutorialShown) {
                this.engine.gameState = this.engine.STATE_TUTORIAL;
            } else {
                this.engine.gameState = this.engine.STATE_PLAYING;
            }
        } else if (this.engine.gameState === this.engine.STATE_TUTORIAL) {
            if (!this.transitionDone) {
                this.startGameTransition();
            }
        }
    }
    
    handleClick(event) {
        const rect = this.engine.canvas.getBoundingClientRect();
        const x = (event.clientX || event.offsetX || 0) * (this.engine.width / rect.width);
        const y = (event.clientY || event.offsetY || 0) * (this.engine.height / rect.height);
        
        if (this.engine.gameState === this.engine.STATE_TUTORIAL && !this.transitionDone) {
            this.startGameTransition();
            return;
        }
        
        // Pause button
        const pauseBtnRect = {
            x: this.engine.pauseBtnPos.x,
            y: this.engine.pauseBtnPos.y,
            width: this.engine.pauseBtnSize,
            height: this.engine.pauseBtnSize
        };
        
        if (this.isPointInRect(x, y, pauseBtnRect) && !this.showMenu && this.engine.gameState === this.engine.STATE_PLAYING) {
            this.showMenu = true;
            return;
        }
        
        // Menu buttons
        if (this.showMenu) {
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
            
            if (this.isPointInRect(x, y, resumeBtn)) {
                this.showMenu = false;
            } else if (this.isPointInRect(x, y, quitMenuBtn)) {
                // Always close the game in any condition
                if (window.close) {
                    window.close();
                }
                window.location.href = 'about:blank';
            }
            return;
        }
        
        // Game over buttons
        if (this.showGameOver) {
            const playAgainBtn = {
                x: this.engine.width / 2 - this.engine.gameoverBtnWidth - 20,
                y: this.engine.height / 2 + Math.floor(this.engine.height * 0.11),
                width: this.engine.gameoverBtnWidth,
                height: this.engine.gameoverBtnHeight
            };
            
            const quitBtn = {
                x: this.engine.width / 2 + 20,
                y: this.engine.height / 2 + Math.floor(this.engine.height * 0.11),
                width: this.engine.gameoverBtnWidth,
                height: this.engine.gameoverBtnHeight
            };
            
            if (this.isPointInRect(x, y, playAgainBtn)) {
                this.resetGame();
                this.engine.gameState = this.engine.STATE_PLAYING;
            } else if (this.isPointInRect(x, y, quitBtn)) {
                window.location.reload();
            }
        }
    }
    
    isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }
}