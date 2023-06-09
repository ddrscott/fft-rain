const audioFile = 'audio/rain-loop.ogg';

const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const numBars = 128;
const barWidth = Math.ceil(canvas.width / numBars);
const barHeight = canvas.height / 8;
const barSpacing = barWidth / 4;
const barColor = 'rgba(255, 255, 255, 0.15)';
const fftSize = numBars * 2;
const audioContext = new AudioContext();
let sourceNode = audioContext.createBufferSource();
sourceNode.isPlaying = false;
const analyserNode = audioContext.createAnalyser();
const button = document.getElementById('button');
const video = document.querySelector('video');
const canvasContext = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function draw__old() {
    requestAnimationFrame(draw);

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(dataArray);

    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numBars; i++) {
        const barX = i * barWidth + barSpacing;
        //const barY = canvas.height - barHeight - (dataArray[i] / 255 * barHeight);
        const barY = canvas.height - (dataArray[i] / 255 * barHeight);

        canvasContext.fillStyle = barColor;
        canvasContext.fillRect(barX, barY, barWidth, barHeight);
    }
}

function draw() {
    requestAnimationFrame(draw);

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(dataArray);

    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    // Check for low rumbling in the FFT
    const lowRumbling = dataArray.slice(0, numBars / 4).reduce((acc, val) => acc + val, 0) / (numBars / 4) / 255;

    const minRumbling = 0.2; // Adjust this value to change the minimum rumbling threshold
    const expFactor = 2; // Adjust this value to change the exponential factor
    const brightness = Math.round(255 * Math.pow(Math.max(lowRumbling - minRumbling, 0), expFactor));

    // Adjust the background color based on the low rumbling level, but only if it's above the minimum threshold
    const bgColor = `rgba(${brightness}, ${brightness}, ${brightness}, 1)`;

    const bg = document.querySelector('.bg');
    bg.style.filter = `brightness(${brightness}%)`;
    // document.body.style.backgroundColor = bgColor;

    for (let i = 0; i < numBars; i++) {
        const barX = i * barWidth + barSpacing;
        const barY = canvas.height - (dataArray[i] / 255 * barHeight);
        canvasContext.fillStyle = barColor;
        canvasContext.fillRect(barX, barY, barWidth - barSpacing * 2, barHeight);
    }
}


fetch(audioFile)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
        sourceNode.buffer = audioBuffer;
        sourceNode.loop = true;
        sourceNode.connect(analyserNode);
        analyserNode.connect(audioContext.destination);

        sourceNode.isPlaying = false;

        button.addEventListener('click', () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            if (sourceNode.buffer) {
                if (sourceNode.isPlaying) {
                    sourceNode.stop();
                    sourceNode.isPlaying = false;
                    button.textContent = 'Start Loop';
                } else {
                    if (sourceNode.state === 'suspended') {
                        sourceNode.resume();
                    } else {
                        sourceNode = audioContext.createBufferSource(); // create a new sourceNode
                        sourceNode.buffer = audioBuffer;
                        sourceNode.loop = true;
                        sourceNode.connect(analyserNode);
                        analyserNode.connect(audioContext.destination);
                        sourceNode.start();
                        sourceNode.isPlaying = true;
                    }
                    button.textContent = 'Stop Loop';
                }
            }
        });

        sourceNode.onended = () => {
            sourceNode.isPlaying = false;
            button.textContent = 'Start Loop';
        };
    });

draw();
