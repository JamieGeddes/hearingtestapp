import { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import TestScreen from './components/TestScreen';
import ResultsScreen from './components/ResultsScreen';
import { useHearingTest } from './hooks/useHearingTest';
import { ScreenType } from './types';
import './styles.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('setup');
  const hearingTest = useHearingTest();

  const handleStartTest = async () => {
    const success = await hearingTest.startHearingTest();
    if (success) {
      setCurrentScreen('test');
    }
  };

  const handleTestComplete = () => {
    setCurrentScreen('results');
  };

  const handleRestart = () => {
    hearingTest.restartTest();
    setCurrentScreen('setup');
  };

  return (
    <div className="container">
      <header>
        <h1>🎧 Hearing Test</h1>
        <p className="subtitle">Audiometry assessment</p>
      </header>

      {currentScreen === 'setup' && (
        <SetupScreen 
          onVolumeTest={hearingTest.playVolumeTest}
          onStartTest={handleStartTest}
        />
      )}

      {currentScreen === 'test' && (
        <TestScreen 
          hearingTest={hearingTest}
          onTestComplete={handleTestComplete}
        />
      )}

      {currentScreen === 'results' && (
        <ResultsScreen 
          testResults={hearingTest.testResults}
          onRestart={handleRestart}
          onSaveResults={hearingTest.saveResults}
        />
      )}
    </div>
  );
}

export default App;