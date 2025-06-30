import { useEffect, useRef } from 'react';
import { TestResults, HearingStatus } from '../types';

interface ResultsScreenProps {
  testResults: TestResults;
  onRestart: () => void;
  onSaveResults: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ 
  testResults, 
  onRestart, 
  onSaveResults 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const testFrequencies = [125, 250, 500, 1000, 2000, 4000, 8000];

  const calculateAverageHearing = (ear: 'left' | 'right'): number => {
    const results = testResults[ear];
    const values = Object.values(results).map(result => result.decibelLevel);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const getHearingStatus = (avgDb: number): HearingStatus => {
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

  const drawResultsChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Draw grid and labels
    drawChartGrid(ctx, padding, chartWidth, chartHeight);

    // Draw data lines
    drawEarData(ctx, 'left', '#2196F3', padding, chartWidth, chartHeight);
    drawEarData(ctx, 'right', '#F44336', padding, chartWidth, chartHeight);
  };

  const drawChartGrid = (
    ctx: CanvasRenderingContext2D, 
    padding: number, 
    chartWidth: number, 
    chartHeight: number
  ) => {
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
    testFrequencies.forEach((freq, index) => {
      const x = padding + (index / (testFrequencies.length - 1)) * chartWidth;
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
  };

  const drawEarData = (
    ctx: CanvasRenderingContext2D, 
    ear: 'left' | 'right', 
    color: string, 
    padding: number, 
    chartWidth: number, 
    chartHeight: number
  ) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    let isFirst = true;

    testFrequencies.forEach((freq, index) => {
      const result = testResults[ear][freq];
      if (!result) return;

      const x = padding + (index / (testFrequencies.length - 1)) * chartWidth;
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
  };

  useEffect(() => {
    drawResultsChart();
  }, [testResults]);

  const leftAvg = calculateAverageHearing('left');
  const rightAvg = calculateAverageHearing('right');

  return (
    <div id="results-screen" className="screen active">
      <div className="results-content">
        <h2>Your Hearing Test Results</h2>
        
        <div className="results-summary">
          <div className="ear-results">
            <div className="ear-result">
              <h3>Left Ear</h3>
              <div className="ear-summary">
                <div className="avg-threshold">
                  Average Threshold: {leftAvg.toFixed(1)} dB HL
                </div>
                <div className={`hearing-status ${getHearingStatus(leftAvg)}`}>
                  {getHearingDescription(leftAvg)}
                </div>
              </div>
            </div>
            <div className="ear-result">
              <h3>Right Ear</h3>
              <div className="ear-summary">
                <div className="avg-threshold">
                  Average Threshold: {rightAvg.toFixed(1)} dB HL
                </div>
                <div className={`hearing-status ${getHearingStatus(rightAvg)}`}>
                  {getHearingDescription(rightAvg)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h3>Hearing Threshold Chart</h3>
          <canvas ref={canvasRef} width="800" height="400"></canvas>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-color left"></span>Left Ear
            </span>
            <span className="legend-item">
              <span className="legend-color right"></span>Right Ear
            </span>
          </div>
        </div>

        <div className="detailed-results">
          <h3>Detailed Results</h3>
          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th>Frequency (Hz)</th>
                  <th>Left Ear (dB HL)</th>
                  <th>Right Ear (dB HL)</th>
                </tr>
              </thead>
              <tbody>
                {testFrequencies.map(freq => {
                  const leftResult = testResults.left[freq];
                  const rightResult = testResults.right[freq];
                  
                  if (!leftResult || !rightResult) return null;
                  
                  return (
                    <tr key={freq}>
                      <td>{freq}</td>
                      <td className={getHearingStatus(leftResult.decibelLevel)}>
                        {leftResult.decibelLevel.toFixed(1)}
                        {leftResult.noResponse ? '*' : ''}
                      </td>
                      <td className={getHearingStatus(rightResult.decibelLevel)}>
                        {rightResult.decibelLevel.toFixed(1)}
                        {rightResult.noResponse ? '*' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="table-note">* No response at maximum safe volume</p>
          </div>
        </div>

        <div className="disclaimer">
          <p>
            <strong>Disclaimer:</strong> This is a basic hearing screening tool and should not 
            replace professional audiological assessment. If you have concerns about your hearing, 
            please consult a qualified audiologist or healthcare provider.
          </p>
        </div>

        <div className="results-actions">
          <button className="btn btn-primary" onClick={onSaveResults}>
            📄 Save Results
          </button>
          <button className="btn btn-secondary" onClick={onRestart}>
            Take Test Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;