import { useEffect } from 'react';
import { HearingTestHook } from '../hooks/useHearingTest';

interface TestScreenProps {
  hearingTest: HearingTestHook;
  onTestComplete: () => void;
}

const TestScreen: React.FC<TestScreenProps> = ({ hearingTest, onTestComplete }) => {
  const {
    currentEar,
    currentFrequency,
    currentTestNumber,
    totalTests,
    progressPercentage,
    volumePercentage,
    statusText,
    canHear,
    recordResponse
  } = hearingTest;

  useEffect(() => {
    if (hearingTest.isTestComplete) {
      onTestComplete();
    }
  }, [hearingTest.isTestComplete, onTestComplete]);

  return (
    <div id="test-screen" className="screen active">
      <div className="test-content">
        <div className="test-info">
          <div className="current-test">
            <span className="ear-indicator">
              {currentEar.charAt(0).toUpperCase() + currentEar.slice(1)} Ear
            </span>
            <span className="frequency-display">{currentFrequency} Hz</span>
          </div>
          <div className="progress">
            <span>Test {currentTestNumber} of {totalTests}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="test-interface">
          <div className="volume-indicator">
            <div className="volume-bar">
              <div 
                className="volume-level" 
                style={{ width: `${volumePercentage}%` }}
              ></div>
            </div>
            <p>Volume Level</p>
          </div>

          <button 
            className="btn btn-large btn-primary" 
            disabled={!canHear}
            onClick={recordResponse}
          >
            I Can Hear It
          </button>

          <div className="test-status">
            <p>{statusText}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestScreen;