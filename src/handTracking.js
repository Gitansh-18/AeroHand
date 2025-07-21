class HandTracking {
    constructor() {
        this.video = document.getElementById('videoElement');
        this.hands = null;
        this.camera = null;
        this.isInitialized = false;
        this.lastY = null;
        this.smoothY = null;
        this.camHeight = 240;
        this.camWidth = 320;
    }
    
    async initialize() {
        try {
            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
                }
            });
            
            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7
            });
            
            this.hands.onResults(this.onResults.bind(this));
            
            // Initialize camera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: this.camWidth,
                    height: this.camHeight,
                    facingMode: 'user'
                }
            });
            
            this.video.srcObject = stream;
            this.video.addEventListener('loadedmetadata', () => {
                this.camWidth = this.video.videoWidth;
                this.camHeight = this.video.videoHeight;
            });
            
            // Setup camera utils
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    if (this.hands) {
                        await this.hands.send({ image: this.video });
                    }
                },
                width: this.camWidth,
                height: this.camHeight
            });
            
            await this.camera.start();
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing hand tracking:', error);
            this.isInitialized = false;
            return false;
        }
    }
    
    onResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            // Get index finger tip (landmark 8)
            const indexTip = landmarks[8];
            this.lastY = Math.floor(indexTip.y * this.camHeight);
            
            // Smooth the Y coordinate
            if (this.smoothY === null) {
                this.smoothY = this.lastY;
            } else {
                this.smoothY = Math.floor(0.9 * this.smoothY + 0.1 * this.lastY);
            }
        } else {
            this.lastY = null;
        }
    }
    
    getHandY() {
        return this.lastY;
    }
    
    getSmoothHandY() {
        return this.smoothY;
    }
    
    getCameraHeight() {
        return this.camHeight;
    }
    
    isHandDetected() {
        return this.lastY !== null;
    }
    
    destroy() {
        if (this.camera) {
            this.camera.stop();
        }
        if (this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
        }
    }
}