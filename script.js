class HearingTest {
    constructor() {
        this.audioContext = null;
        this.currentOscillator = null;
        this.currentGain = null;
        this.isPlaying = false;
        this.currentVolume = 0;
        this.maxVolume = 0.3; // Safety limit - 30% of max volume
        this.volumeStep = 0.001;
        this.volumeInterval = null;
        
        this.testFrequencies = [125, 250, 500, 1000, 2000, 4000, 8000];
        this.currentTestIndex = 0;
        this.currentEar = 'left'; // 'left' or 'right'
        this.testResults = {
            left: {},
            right: {}
        };
        
        this.isTestActive = false;
        this.testStartTime = 0;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.setupScreen = document.getElementById('setup-screen');
        this.testScreen = document.getElementById('test-screen');
        this.resultsScreen = document.getElementById('results-screen');
        
        this.volumeTestBtn = document.getElementById('volume-test-btn');
        this.startTestBtn = document.getElementById('start-test-btn');
        this.hearButton = document.getElementById('hear-button');
        this.restartBtn = document.getElementById('restart-test-btn');
        this.saveResultsBtn = document.getElementById('save-results-btn');
        
        this.currentEarDisplay = document.getElementById('current-ear');
        this.currentFrequencyDisplay = document.getElementById('current-frequency');
        this.testProgressDisplay = document.getElementById('test-progress');
        this.progressFill = document.getElementById('progress-fill');
        this.volumeLevel = document.getElementById('volume-level');
        this.statusText = document.getElementById('status-text');
        
        this.resultsChart = document.getElementById('results-chart');
        this.leftEarSummary = document.getElementById('left-ear-summary');
        this.rightEarSummary = document.getElementById('right-ear-summary');
        this.detailedTable = document.getElementById('detailed-table');
    }

    setupEventListeners() {
        this.volumeTestBtn.addEventListener('click', () => this.playVolumeTest());
        this.startTestBtn.addEventListener('click', () => this.startHearingTest());
        this.hearButton.addEventListener('click', () => this.recordResponse());
        this.restartBtn.addEventListener('click', () => this.restartTest());
        this.saveResultsBtn.addEventListener('click', () => this.saveResults());
    }

    async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            return true;
        } catch (error) {
            console.error('Audio initialization failed:', error);
            alert('Audio initialization failed. Please ensure your browser supports Web Audio API.');
            return false;
        }
    }

    createTone(frequency, ear = 'both') {
        if (!this.audioContext) return null;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const merger = this.audioContext.createChannelMerger(2);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        
        oscillator.connect(gainNode);
        
        if (ear === 'left') {
            gainNode.connect(merger, 0, 0);
        } else if (ear === 'right') {
            gainNode.connect(merger, 0, 1);
        } else {
            gainNode.connect(merger, 0, 0);
            gainNode.connect(merger, 0, 1);
        }
        
        merger.connect(this.audioContext.destination);
        
        return { oscillator, gainNode };
    }

    async playVolumeTest() {
        if (!await this.initializeAudio()) return;
        
        this.stopCurrentTone();
        
        const { oscillator, gainNode } = this.createTone(1000, 'both');
        this.currentOscillator = oscillator;
        this.currentGain = gainNode;
        
        oscillator.start();
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        
        setTimeout(() => {
            this.stopCurrentTone();
            this.startTestBtn.disabled = false;
        }, 2000);
    }

    stopCurrentTone() {
        if (this.volumeInterval) {
            clearInterval(this.volumeInterval);
            this.volumeInterval = null;
        }
        
        if (this.currentOscillator) {
            try {
                this.currentOscillator.stop();
            } catch (e) {
                // Oscillator might already be stopped
            }
            this.currentOscillator = null;
        }
        
        this.currentGain = null;
        this.isPlaying = false;
        this.currentVolume = 0;
        this.updateVolumeDisplay(0);
    }

    updateVolumeDisplay(volume) {
        const percentage = (volume / this.maxVolume) * 100;
        this.volumeLevel.style.width = `${percentage}%`;
    }

    async startHearingTest() {
        if (!await this.initializeAudio()) return;
        
        this.showScreen('test');
        this.currentTestIndex = 0;
        this.currentEar = 'left';
        this.testResults = { left: {}, right: {} };
        
        setTimeout(() => {
            this.startNextTest();
        }, 1000);
    }

    startNextTest() {
        if (this.currentTestIndex >= this.testFrequencies.length) {
            if (this.currentEar === 'left') {
                this.currentEar = 'right';
                this.currentTestIndex = 0;
            } else {
                this.showResults();
                return;
            }
        }
        
        const frequency = this.testFrequencies[this.currentTestIndex];
        const totalTests = this.testFrequencies.length * 2;
        const currentTest = (this.currentEar === 'left' ? 0 : this.testFrequencies.length) + this.currentTestIndex + 1;
        
        this.updateTestDisplay(frequency, currentTest, totalTests);
        
        setTimeout(() => {
            this.playTestTone(frequency);
        }, 2000);
    }

    updateTestDisplay(frequency, currentTest, totalTests) {
        this.currentEarDisplay.textContent = `${this.currentEar.charAt(0).toUpperCase() + this.currentEar.slice(1)} Ear`;
        this.currentFrequencyDisplay.textContent = `${frequency} Hz`;
        this.testProgressDisplay.textContent = `Test ${currentTest} of ${totalTests}`;
        
        const progressPercentage = ((currentTest - 1) / totalTests) * 100;
        this.progressFill.style.width = `${progressPercentage}%`;
        
        this.statusText.textContent = 'Listen carefully and click when you hear the tone...';
        this.hearButton.disabled = true;
    }

    playTestTone(frequency) {
        this.stopCurrentTone();
        
        const { oscillator, gainNode } = this.createTone(frequency, this.currentEar);
        this.currentOscillator = oscillator;
        this.currentGain = gainNode;
        
        oscillator.start();
        this.isPlaying = true;
        this.isTestActive = true;
        this.testStartTime = Date.now();
        this.currentVolume = 0;
        
        this.hearButton.disabled = false;
        this.statusText.textContent = 'Click "I Can Hear It" as soon as you detect the sound';
        
        this.volumeInterval = setInterval(() => {
            if (this.currentVolume < this.maxVolume && this.isPlaying) {
                this.currentVolume += this.volumeStep;
                this.currentGain.gain.setValueAtTime(this.currentVolume, this.audioContext.currentTime);
                this.updateVolumeDisplay(this.currentVolume);
            } else if (this.currentVolume >= this.maxVolume) {
                this.handleNoResponse();
            }
        }, 10);
    }

    recordResponse() {
        if (!this.isTestActive) return;
        
        const responseTime = Date.now() - this.testStartTime;
        const frequency = this.testFrequencies[this.currentTestIndex];
        const volumeAtResponse = this.currentVolume;
        
        this.testResults[this.currentEar][frequency] = {
            volume: volumeAtResponse,
            responseTime: responseTime,
            decibelLevel: this.volumeToDecibel(volumeAtResponse)
        };
        
        this.stopCurrentTone();
        this.isTestActive = false;
        this.hearButton.disabled = true;
        this.statusText.textContent = 'Response recorded! Preparing next test...';
        
        this.currentTestIndex++;
        
        setTimeout(() => {
            this.startNextTest();
        }, 1500);
    }

    handleNoResponse() {
        if (!this.isTestActive) return;
        
        const frequency = this.testFrequencies[this.currentTestIndex];
        
        this.testResults[this.currentEar][frequency] = {
            volume: this.maxVolume,
            responseTime: null,
            decibelLevel: this.volumeToDecibel(this.maxVolume),
            noResponse: true
        };
        
        this.stopCurrentTone();
        this.isTestActive = false;
        this.hearButton.disabled = true;
        this.statusText.textContent = 'No response detected. Moving to next test...';
        
        this.currentTestIndex++;
        
        setTimeout(() => {
            this.startNextTest();
        }, 2000);
    }

    volumeToDecibel(volume) {
        if (volume <= 0) return -Infinity;
        // Convert volume (0-1) to approximate dB HL (hearing level)
        // This is a simplified conversion for demonstration
        const minDb = 0;
        const maxDb = 90;
        return minDb + (volume / this.maxVolume) * (maxDb - minDb);
    }

    showResults() {
        this.showScreen('results');
        this.generateResultsSummary();
        this.drawResultsChart();
        this.generateDetailedTable();
    }

    generateResultsSummary() {
        const leftAvg = this.calculateAverageHearing('left');
        const rightAvg = this.calculateAverageHearing('right');
        
        this.leftEarSummary.innerHTML = `
            <div class="avg-threshold">Average Threshold: ${leftAvg.toFixed(1)} dB HL</div>
            <div class="hearing-status ${this.getHearingStatus(leftAvg)}">${this.getHearingDescription(leftAvg)}</div>
        `;
        
        this.rightEarSummary.innerHTML = `
            <div class="avg-threshold">Average Threshold: ${rightAvg.toFixed(1)} dB HL</div>
            <div class="hearing-status ${this.getHearingStatus(rightAvg)}">${this.getHearingDescription(rightAvg)}</div>
        `;
    }

    calculateAverageHearing(ear) {
        const results = this.testResults[ear];
        const values = Object.values(results).map(result => result.decibelLevel);
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    getHearingStatus(avgDb) {
        if (avgDb <= 25) return 'normal';
        if (avgDb <= 40) return 'mild';
        if (avgDb <= 55) return 'moderate';
        if (avgDb <= 70) return 'severe';
        return 'profound';
    }

    getHearingDescription(avgDb) {
        if (avgDb <= 25) return 'Normal Hearing';
        if (avgDb <= 40) return 'Mild Hearing Loss';
        if (avgDb <= 55) return 'Moderate Hearing Loss';
        if (avgDb <= 70) return 'Severe Hearing Loss';
        return 'Profound Hearing Loss';
    }

    drawResultsChart() {
        const canvas = this.resultsChart;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const padding = 60;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        
        // Draw grid and labels
        this.drawChartGrid(ctx, padding, chartWidth, chartHeight);
        
        // Draw data lines
        this.drawEarData(ctx, 'left', '#2196F3', padding, chartWidth, chartHeight);
        this.drawEarData(ctx, 'right', '#F44336', padding, chartWidth, chartHeight);
    }

    drawChartGrid(ctx, padding, chartWidth, chartHeight) {
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        
        // Y-axis (dB levels)
        const dbLevels = [0, 20, 40, 60, 80, 100];
        dbLevels.forEach((db, index) => {
            const y = padding + (index / (dbLevels.length - 1)) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();
            
            // Y-axis labels
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`${db} dB`, padding - 10, y + 4);
        });
        
        // X-axis (frequencies)
        this.testFrequencies.forEach((freq, index) => {
            const x = padding + (index / (this.testFrequencies.length - 1)) * chartWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, padding + chartHeight);
            ctx.stroke();
            
            // X-axis labels
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${freq}`, x, padding + chartHeight + 20);
        });
        
        // Axis labels
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Frequency (Hz)', padding + chartWidth / 2, padding + chartHeight + 45);
        
        ctx.save();
        ctx.translate(20, padding + chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Hearing Threshold (dB HL)', 0, 0);
        ctx.restore();
    }

    drawEarData(ctx, ear, color, padding, chartWidth, chartHeight) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        let isFirst = true;
        
        this.testFrequencies.forEach((freq, index) => {
            const result = this.testResults[ear][freq];
            const x = padding + (index / (this.testFrequencies.length - 1)) * chartWidth;
            const y = padding + (result.decibelLevel / 100) * chartHeight;
            
            if (isFirst) {
                ctx.moveTo(x, y);
                isFirst = false;
            } else {
                ctx.lineTo(x, y);
            }
            
            // Draw point
            ctx.fillRect(x - 3, y - 3, 6, 6);
        });
        
        ctx.stroke();
    }

    generateDetailedTable() {
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Frequency (Hz)</th>
                        <th>Left Ear (dB HL)</th>
                        <th>Right Ear (dB HL)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.testFrequencies.forEach(freq => {
            const leftResult = this.testResults.left[freq];
            const rightResult = this.testResults.right[freq];
            
            tableHTML += `
                <tr>
                    <td>${freq}</td>
                    <td class="${this.getHearingStatus(leftResult.decibelLevel)}">${leftResult.decibelLevel.toFixed(1)}${leftResult.noResponse ? '*' : ''}</td>
                    <td class="${this.getHearingStatus(rightResult.decibelLevel)}">${rightResult.decibelLevel.toFixed(1)}${rightResult.noResponse ? '*' : ''}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
            <p class="table-note">* No response at maximum safe volume</p>
        `;
        
        this.detailedTable.innerHTML = tableHTML;
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    saveResults() {
        const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
        const filename = `hearing_test_results_${timestamp}.html`;
        
        const leftAvg = this.calculateAverageHearing('left');
        const rightAvg = this.calculateAverageHearing('right');
        
        // Create a comprehensive HTML report
        const reportHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hearing Test Results - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .report-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #667eea; padding-bottom: 20px; }
        .header h1 { color: #333; margin-bottom: 10px; }
        .timestamp { color: #666; font-size: 14px; }
        .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
        .ear-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .ear-summary h3 { margin-bottom: 15px; color: #333; }
        .threshold { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; }
        .status { padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 0.9em; }
        .status.normal { background: #d4edda; color: #155724; }
        .status.mild { background: #fff3cd; color: #856404; }
        .status.moderate { background: #f8d7da; color: #721c24; }
        .status.severe { background: #f5c6cb; color: #721c24; }
        .status.profound { background: #f1b0b7; color: #721c24; }
        .results-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .results-table th, .results-table td { padding: 12px; text-align: center; border: 1px solid #ddd; }
        .results-table th { background: #f8f9fa; font-weight: bold; }
        .results-table td.normal { background: rgba(212, 237, 218, 0.3); }
        .results-table td.mild { background: rgba(255, 243, 205, 0.3); }
        .results-table td.moderate { background: rgba(248, 215, 218, 0.3); }
        .results-table td.severe { background: rgba(245, 198, 203, 0.3); }
        .results-table td.profound { background: rgba(241, 176, 183, 0.3); }
        .notes { background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin-top: 30px; }
        .disclaimer { margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px; border: 1px solid #ffc107; }
        .print-note { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
        @media print { body { margin: 0; background: white; } .print-note { display: none; } }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <h1>🎧 Hearing Test Results</h1>
            <div class="timestamp">Test completed on: ${new Date().toLocaleString()}</div>
        </div>

        <div class="summary">
            <div class="ear-summary">
                <h3>Left Ear</h3>
                <div class="threshold">Average Threshold: ${leftAvg.toFixed(1)} dB HL</div>
                <div class="status ${this.getHearingStatus(leftAvg)}">${this.getHearingDescription(leftAvg)}</div>
            </div>
            <div class="ear-summary">
                <h3>Right Ear</h3>
                <div class="threshold">Average Threshold: ${rightAvg.toFixed(1)} dB HL</div>
                <div class="status ${this.getHearingStatus(rightAvg)}">${this.getHearingDescription(rightAvg)}</div>
            </div>
        </div>

        <h3>Detailed Frequency Results</h3>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Frequency (Hz)</th>
                    <th>Left Ear (dB HL)</th>
                    <th>Right Ear (dB HL)</th>
                </tr>
            </thead>
            <tbody>
                ${this.testFrequencies.map(freq => {
                    const leftResult = this.testResults.left[freq];
                    const rightResult = this.testResults.right[freq];
                    return `
                        <tr>
                            <td>${freq}</td>
                            <td class="${this.getHearingStatus(leftResult.decibelLevel)}">${leftResult.decibelLevel.toFixed(1)}${leftResult.noResponse ? '*' : ''}</td>
                            <td class="${this.getHearingStatus(rightResult.decibelLevel)}">${rightResult.decibelLevel.toFixed(1)}${rightResult.noResponse ? '*' : ''}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        <p style="font-size: 0.9em; color: #666; font-style: italic;">* No response at maximum safe volume</p>

        <div class="notes">
            <h4>Test Parameters:</h4>
            <ul>
                <li>Test frequencies: ${this.testFrequencies.join(', ')} Hz</li>
                <li>Maximum test volume: ${(this.maxVolume * 100).toFixed(0)}% of system maximum</li>
                <li>Volume increment: ${(this.volumeStep * 100).toFixed(1)}% per 10ms</li>
                <li>Both ears tested separately with stereo channel isolation</li>
            </ul>
        </div>

        <div class="disclaimer">
            <h4>Important Disclaimer:</h4>
            <p><strong>This is a basic hearing screening tool and should not replace professional audiological assessment.</strong> If you have concerns about your hearing, please consult a qualified audiologist or healthcare provider. This test provides approximate hearing threshold estimates and should be used for informational purposes only.</p>
        </div>

        <div class="print-note">
            <p>This report can be printed or saved as PDF using your browser's print function.</p>
        </div>
    </div>
</body>
</html>`;

        // Create and download the file
        const blob = new Blob([reportHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        // Show confirmation message
        const originalText = this.saveResultsBtn.textContent;
        this.saveResultsBtn.textContent = '✅ Results Saved!';
        this.saveResultsBtn.disabled = true;
        
        setTimeout(() => {
            this.saveResultsBtn.textContent = originalText;
            this.saveResultsBtn.disabled = false;
        }, 3000);
    }

    restartTest() {
        this.stopCurrentTone();
        this.showScreen('setup');
        this.startTestBtn.disabled = false;
        this.currentTestIndex = 0;
        this.currentEar = 'left';
        this.testResults = { left: {}, right: {} };
    }
}

// Initialize the hearing test when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new HearingTest();
});