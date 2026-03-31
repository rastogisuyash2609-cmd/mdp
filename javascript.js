let currentStream;
let useRearCamera = true;
const video = document.getElementById('webcam');
const canvas = document.getElementById('overlay');
const statusField = document.getElementById('status');
const bestLabel = document.getElementById('best-label');

async function startCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: {
            facingMode: useRearCamera ? "environment" : "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
        }
    };

    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        statusField.innerText = "Camera Active";
        
        // Match canvas size to video
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        };
    } catch (err) {
        statusField.innerText = "Camera Error: " + err.message;
    }
}

// Switch camera button
document.getElementById('switchBtn').addEventListener('click', () => {
    useRearCamera = !useRearCamera;
    startCamera();
});

// Edge Impulse Inference
async function initInference() {
    const classifier = new EdgeImpulseClassifier();
    await classifier.init();
    
    setInterval(async () => {
        if (!video.videoWidth) return;

        const results = await classifier.classify(video);
        
        // Update UI
        if (results.bounding_boxes && results.bounding_boxes.length > 0) {
            const top = results.bounding_boxes[0];
            bestLabel.innerText = `${top.label} (${(top.value * 100).toFixed(0)}%)`;
            drawBoxes(results.bounding_boxes);
        } else {
            bestLabel.innerText = "Nothing detected";
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, 150);
}

function drawBoxes(boxes) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 4;
    ctx.font = '20px Arial';
    ctx.fillStyle = '#00ff88';

    boxes.forEach(box => {
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.fillText(box.label, box.x, box.y - 10);
    });
}

// Run
startCamera();
initInference();