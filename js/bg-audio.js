const audioFile = 'audio/rain-loop.ogg';

const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const numBars = 128;
const barWidth = Math.ceil(canvas.width / numBars);
const barHeight = canvas.height / 8;
const barSpacing = barWidth / 4;
const barColor = 'rgba(255, 255, 255, 0.15)';
const audioContext = new AudioContext();
let sourceNode = audioContext.createBufferSource();
sourceNode.isPlaying = false;
const analyserNode = audioContext.createAnalyser();
const button = document.getElementById('button');
const video = document.querySelector('video');
const canvasContext = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let maxLow = 0.01;

function movingAverage(n) {
    const movingValues = Array(n).fill(0);

    return (val) => {
        movingValues.shift();
        movingValues.push(val);
        return movingValues.reduce((acc, curr) => acc + curr, 0) / movingValues.length;
    }
}

const averages = movingAverage(12);

function draw() {
    requestAnimationFrame(draw);
    if (!sourceNode.isPlaying) {
        return;
    }

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(dataArray);

    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    // Check for low rumbling in the FFT
    const lowRumbling = dataArray.slice(0, numBars / 8).reduce((acc, val) => acc + val, 0) / (numBars / 8) / 255;

    const avg = averages(lowRumbling);

    maxLow = lowRumbling > maxLow ? lowRumbling : maxLow;

    if (lowRumbling >= avg) {
        brightness = 75 + (lowRumbling / maxLow * 50.0);
    } else {
        brightness = 75
    }

    const bg = document.querySelector('.bg');
    bg.style.filter = `brightness(${brightness}%)`;

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
                    button.textContent = 'Play';
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
                    button.textContent = 'Pause';
                }
            }
        });

        sourceNode.onended = () => {
            sourceNode.isPlaying = false;
            button.textContent = 'Play';
        };
    });

draw();
