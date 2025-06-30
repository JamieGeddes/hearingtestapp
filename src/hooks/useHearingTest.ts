import { useState, useCallback, useRef, useEffect } from 'react';
import { TestResults, EarType, AudioNodes } from '../types';

export interface HearingTestHook {
  // State
  testResults: TestResults;
  currentEar: EarType;
  currentFrequency: number;
  currentTestNumber: number;
  totalTests: number;
  progressPercentage: number;
  volumePercentage: number;
  statusText: string;
  canHear: boolean;
  isTestComplete: boolean;

  // Actions
  playVolumeTest: () => Promise<void>;
  startHearingTest: () => Promise<boolean>;
  recordResponse: () => void;
  restartTest: () => void;
  saveResults: () => void;
}

export const useHearingTest = (): HearingTestHook => {
  const [testResults, setTestResults] = useState<TestResults>({ left: {}, right: {} });
  const [currentEar, setCurrentEar] = useState<EarType>('left');
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [isTestActive, setIsTestActive] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [statusText, setStatusText] = useState('Get ready... Test will begin shortly');
  const [canHear, setCanHear] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentOscillatorRef = useRef<OscillatorNode | null>(null);
  const currentGainRef = useRef<GainNode | null>(null);
  const volumeIntervalRef = useRef<number | null>(null);
  const testStartTimeRef = useRef<number>(0);

  const testFrequencies = [125, 250, 500, 1000, 2000, 4000, 8000];
  const maxVolume = 0.3; // Safety limit - 30% of max volume
  const volumeStep = 0.001;
  const totalTests = testFrequencies.length * 2;

  const currentFrequency = testFrequencies[currentTestIndex] || 0;
  const currentTestNumber = (currentEar === 'left' ? 0 : testFrequencies.length) + currentTestIndex + 1;
  const progressPercentage = ((currentTestNumber - 1) / totalTests) * 100;
  const volumePercentage = (currentVolume / maxVolume) * 100;

  const initializeAudio = useCallback(async (): Promise<boolean> => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Audio initialization failed:', error);
      alert('Audio initialization failed. Please ensure your browser supports Web Audio API.');
      return false;
    }
  }, []);

  const createTone = useCallback((frequency: number, ear: EarType = 'both'): AudioNodes | null => {
    if (!audioContextRef.current) return null;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    const merger = audioContextRef.current.createChannelMerger(2);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);

    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);

    oscillator.connect(gainNode);

    if (ear === 'left') {
      gainNode.connect(merger, 0, 0);
    } else if (ear === 'right') {
      gainNode.connect(merger, 0, 1);
    } else {
      gainNode.connect(merger, 0, 0);
      gainNode.connect(merger, 0, 1);
    }

    merger.connect(audioContextRef.current.destination);

    return { oscillator, gainNode };
  }, []);

  const stopCurrentTone = useCallback(() => {
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }

    if (currentOscillatorRef.current) {
      try {
        currentOscillatorRef.current.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
      currentOscillatorRef.current = null;
    }

    currentGainRef.current = null;
    setCurrentVolume(0);
  }, []);

  const volumeToDecibel = useCallback((volume: number): number => {
    if (volume <= 0) return -Infinity;
    // Convert volume (0-1) to approximate dB HL (hearing level)
    const minDb = 0;
    const maxDb = 90;
    return minDb + (volume / maxVolume) * (maxDb - minDb);
  }, [maxVolume]);

  // Function to continue to next test - doesn't use useCallback to avoid circular deps
  const continueToNextTest = (newIndex: number) => {
    if (newIndex >= testFrequencies.length) {
      if (currentEar === 'left') {
        setCurrentEar('right');
        setCurrentTestIndex(0);
        setTimeout(() => {
          const frequency = testFrequencies[0];
          if (frequency) {
            setStatusText('Listen carefully and click when you hear the tone...');
            setCanHear(false);
            setTimeout(() => {
              playTestTone(frequency);
            }, 2000);
          }
        }, 1000);
      } else {
        setIsTestComplete(true);
      }
    } else {
      setCurrentTestIndex(newIndex);
      setTimeout(() => {
        const frequency = testFrequencies[newIndex];
        if (frequency) {
          setStatusText('Listen carefully and click when you hear the tone...');
          setCanHear(false);
          setTimeout(() => {
            playTestTone(frequency);
          }, 2000);
        }
      }, 1000);
    }
  };

  const playTestTone = useCallback((frequency: number) => {
    stopCurrentTone();

    const audioNodes = createTone(frequency, currentEar);
    if (!audioNodes) return;

    currentOscillatorRef.current = audioNodes.oscillator;
    currentGainRef.current = audioNodes.gainNode;

    audioNodes.oscillator.start();
    setIsTestActive(true);
    testStartTimeRef.current = Date.now();
    setCurrentVolume(0);

    setCanHear(true);
    setStatusText('Click "I Can Hear It" as soon as you detect the sound');

    volumeIntervalRef.current = window.setInterval(() => {
      setCurrentVolume(prev => {
        const newVolume = prev + volumeStep;
        if (newVolume < maxVolume && currentGainRef.current && audioContextRef.current) {
          currentGainRef.current.gain.setValueAtTime(newVolume, audioContextRef.current.currentTime);
          return newVolume;
        } else if (newVolume >= maxVolume) {
          // Handle no response
          const freq = testFrequencies[currentTestIndex];
          if (freq && currentEar !== 'both') {
            setTestResults(prev => ({
              ...prev,
              [currentEar]: {
                ...prev[currentEar],
                [freq]: {
                  volume: maxVolume,
                  responseTime: null,
                  decibelLevel: volumeToDecibel(maxVolume),
                  noResponse: true
                }
              }
            }));
          }
          stopCurrentTone();
          setIsTestActive(false);
          setCanHear(false);
          setStatusText('No response detected. Moving to next test...');
          
          setTimeout(() => {
            continueToNextTest(currentTestIndex + 1);
          }, 2000);
          return maxVolume;
        }
        return prev;
      });
    }, 10);
  }, [stopCurrentTone, createTone, currentEar, maxVolume, volumeStep, currentTestIndex, testFrequencies, volumeToDecibel]);

  const startNextTest = useCallback(() => {
    if (currentTestIndex >= testFrequencies.length) {
      if (currentEar === 'left') {
        setCurrentEar('right');
        setCurrentTestIndex(0);
        return;
      } else {
        setIsTestComplete(true);
        return;
      }
    }

    const frequency = testFrequencies[currentTestIndex];
    if (!frequency) return;

    setStatusText('Listen carefully and click when you hear the tone...');
    setCanHear(false);

    setTimeout(() => {
      playTestTone(frequency);
    }, 2000);
  }, [currentTestIndex, currentEar, testFrequencies, playTestTone]);

  const playVolumeTest = useCallback(async (): Promise<void> => {
    if (!await initializeAudio()) return;

    stopCurrentTone();

    const audioNodes = createTone(1000, 'both');
    if (!audioNodes) return;

    currentOscillatorRef.current = audioNodes.oscillator;
    currentGainRef.current = audioNodes.gainNode;

    audioNodes.oscillator.start();
    if (audioContextRef.current) {
      audioNodes.gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    }

    setTimeout(() => {
      stopCurrentTone();
    }, 2000);
  }, [initializeAudio, stopCurrentTone, createTone]);

  const startHearingTest = useCallback(async (): Promise<boolean> => {
    if (!await initializeAudio()) return false;

    setCurrentTestIndex(0);
    setCurrentEar('left');
    setTestResults({ left: {}, right: {} });
    setIsTestComplete(false);

    setTimeout(() => {
      startNextTest();
    }, 1000);

    return true;
  }, [initializeAudio, startNextTest]);

  const recordResponse = useCallback(() => {
    if (!isTestActive) return;

    const responseTime = Date.now() - testStartTimeRef.current;
    const frequency = testFrequencies[currentTestIndex];
    if (!frequency) return;

    const volumeAtResponse = currentVolume;

    if (currentEar !== 'both') {
      setTestResults(prev => ({
        ...prev,
        [currentEar]: {
          ...prev[currentEar],
          [frequency]: {
            volume: volumeAtResponse,
            responseTime: responseTime,
            decibelLevel: volumeToDecibel(volumeAtResponse)
          }
        }
      }));
    }

    stopCurrentTone();
    setIsTestActive(false);
    setCanHear(false);
    setStatusText('Response recorded! Preparing next test...');

    setTimeout(() => {
      continueToNextTest(currentTestIndex + 1);
    }, 1500);
  }, [isTestActive, currentTestIndex, currentVolume, currentEar, volumeToDecibel, stopCurrentTone, testFrequencies]);

  const restartTest = useCallback(() => {
    stopCurrentTone();
    setCurrentTestIndex(0);
    setCurrentEar('left');
    setTestResults({ left: {}, right: {} });
    setIsTestComplete(false);
    setStatusText('Get ready... Test will begin shortly');
    setCanHear(false);
  }, [stopCurrentTone]);

  const saveResults = useCallback(() => {
    const calculateAverageHearing = (ear: 'left' | 'right'): number => {
      const results = testResults[ear];
      const values = Object.values(results).map(result => result.decibelLevel);
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    };

    const getHearingStatus = (avgDb: number): string => {
      if (avgDb <= 25) return 'normal';
      if (avgDb <= 40) return 'mild';
      if (avgDb <= 55) return 'moderate';
      if (avgDb <= 70) return 'severe';
      return 'profound';
    };

    const getHearingDescription = (avgDb: number): string => {
      if (avgDb <= 25) return 'Normal Hearing';
      if (avgDb <= 40) return 'Mild Hearing Loss';
      if (avgDb <= 55) return 'Moderate Hearing Loss';
      if (avgDb <= 70) return 'Severe Hearing Loss';
      return 'Profound Hearing Loss';
    };

    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    const filename = `hearing_test_results_${timestamp}.html`;

    const leftAvg = calculateAverageHearing('left');
    const rightAvg = calculateAverageHearing('right');

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
                <div class="status ${getHearingStatus(leftAvg)}">${getHearingDescription(leftAvg)}</div>
            </div>
            <div class="ear-summary">
                <h3>Right Ear</h3>
                <div class="threshold">Average Threshold: ${rightAvg.toFixed(1)} dB HL</div>
                <div class="status ${getHearingStatus(rightAvg)}">${getHearingDescription(rightAvg)}</div>
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
                ${testFrequencies.map(freq => {
                  const leftResult = testResults.left[freq];
                  const rightResult = testResults.right[freq];
                  if (!leftResult || !rightResult) return '';
                  return `
                        <tr>
                            <td>${freq}</td>
                            <td class="${getHearingStatus(leftResult.decibelLevel)}">${leftResult.decibelLevel.toFixed(1)}${leftResult.noResponse ? '*' : ''}</td>
                            <td class="${getHearingStatus(rightResult.decibelLevel)}">${rightResult.decibelLevel.toFixed(1)}${rightResult.noResponse ? '*' : ''}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        <p style="font-size: 0.9em; color: #666; font-style: italic;">* No response at maximum safe volume</p>

        <div class="disclaimer">
            <h4>Important Disclaimer:</h4>
            <p><strong>This is a basic hearing screening tool and should not replace professional audiological assessment.</strong> If you have concerns about your hearing, please consult a qualified audiologist or healthcare provider.</p>
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
  }, [testResults, testFrequencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCurrentTone();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopCurrentTone]);

  return {
    testResults,
    currentEar,
    currentFrequency,
    currentTestNumber,
    totalTests,
    progressPercentage,
    volumePercentage,
    statusText,
    canHear,
    isTestComplete,
    playVolumeTest,
    startHearingTest,
    recordResponse,
    restartTest,
    saveResults
  };
};