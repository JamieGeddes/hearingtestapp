import { useState } from 'react';

interface SetupScreenProps {
  onVolumeTest: () => Promise<void>;
  onStartTest: () => Promise<void>;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onVolumeTest, onStartTest }) => {
  const [isVolumeTestComplete, setIsVolumeTestComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleVolumeTest = async () => {
    setIsLoading(true);
    await onVolumeTest();
    setIsVolumeTestComplete(true);
    setIsLoading(false);
  };

  const handleStartTest = async () => {
    setIsLoading(true);
    await onStartTest();
    setIsLoading(false);
  };

  return (
    <div id="setup-screen" className="screen active">
      <div className="setup-content">
        <div className="headphones-warning">
          <h2>⚠️ Important Setup Instructions</h2>
          <div className="warning-box">
            <p><strong>Please wear headphones before starting this test.</strong></p>
            <p>Headphones are essential to:</p>
            <ul>
              <li>Block ambient noise interference</li>
              <li>Ensure accurate left/right ear testing</li>
              <li>Provide precise frequency control</li>
            </ul>
          </div>
        </div>
        
        <div className="instructions">
          <h3>How the test works:</h3>
          <ol>
            <li>You'll hear tones at different frequencies</li>
            <li>Each tone starts very quietly and gradually increases</li>
            <li>Click "I can hear it" as soon as you detect the sound</li>
            <li>We'll test both ears separately</li>
            <li>The test takes about 5-10 minutes</li>
          </ol>
        </div>

        <div className="volume-check">
          <h3>Volume Check</h3>
          <p>First, let's calibrate your volume level:</p>
          <button 
            className="btn btn-secondary" 
            onClick={handleVolumeTest}
            disabled={isLoading}
          >
            {isLoading ? 'Playing...' : 'Play Test Tone'}
          </button>
          <p className="volume-instruction">
            Adjust your system volume so the tone is comfortable but clearly audible.
          </p>
        </div>

        <button 
          className="btn btn-primary" 
          disabled={!isVolumeTestComplete || isLoading}
          onClick={handleStartTest}
        >
          {isLoading ? 'Starting...' : 'Start Hearing Test'}
        </button>
      </div>
    </div>
  );
};

export default SetupScreen;