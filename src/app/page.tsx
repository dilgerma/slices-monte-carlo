'use client';

import { useState } from 'react';
import {
  Slice,
  SimulationResult,
  validateSlices,
  runSimulation,
  formatDate
} from '@/lib/monteCarlo';

export default function Home() {
  const [jsonInput, setJsonInput] = useState('');
  const [slices, setSlices] = useState<Slice[]>([]);
  const [deadline, setDeadline] = useState(30); // days
  const [cycleTime, setCycleTime] = useState(1); // days per slice
  const [globalRisk, setGlobalRisk] = useState(0.1); // default delay chance
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseJson = () => {
    try {
      const data = JSON.parse(jsonInput);
      const validatedSlices = validateSlices(data);
      setSlices(validatedSlices);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const simulateRun = () => {
    const simulationResult = runSimulation({
      slices,
      deadline,
      cycleTime,
      globalRisk
    });

    setResult(simulationResult);
  };

  // Calculate deadline date
  const deadlineDate = (() => {
    const date = new Date();
    date.setDate(date.getDate() + deadline);
    return formatDate(date);
  })();

  return (
      <section className="section">
        <div className="container">
          <h1 className="title">Monte Carlo Deadline Simulator</h1>

          <div className="field">
            <label className="label">Paste your JSON (array of slices)</label>
            <div className="control">
            <textarea
                className="textarea"
                rows={10}
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder='[{"title": "Slice A"}, {"title": "Slice B"}]'
            />
            </div>
            <button className="button is-link mt-2" onClick={parseJson}>
              Load Slices
            </button>
            {error && <p className="help is-danger">{error}</p>}
          </div>

          {slices.length > 0 && (
              <>
                <div className="box">
                  <div className="columns">
                    <div className="column">
                      <div className="notification is-info">
                        <p><strong>Number of Slices:</strong> {slices.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Deadline (days)</label>
                    <input
                        className="input"
                        type="number"
                        value={deadline}
                        onChange={e => setDeadline(Number(e.target.value))}
                    />
                    <p className="help">Target date: {deadlineDate}</p>
                  </div>

                  <div className="field">
                    <label className="label">Cycle Time (per slice, days)</label>
                    <input
                        className="input"
                        type="number"
                        value={cycleTime}
                        step="0.1"
                        onChange={e => setCycleTime(Number(e.target.value))}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Global Risk (0 to 1)</label>
                    <input
                        className="input"
                        type="number"
                        value={globalRisk}
                        step="0.01"
                        onChange={e => setGlobalRisk(Number(e.target.value))}
                    />
                  </div>
                </div>

                <button className="button is-primary" onClick={simulateRun}>
                  Run Simulation
                </button>
              </>
          )}

          {result && (
              <div className="notification is-success mt-4">
                <p><strong>Number of Slices:</strong> {result.sliceCount}</p>
                <p><strong>Probability to Meet Deadline:</strong> {(result.probability * 100).toFixed(1)}%</p>
                <p><strong>Average Total Time:</strong> {result.average} days</p>
                <p><strong>90th Percentile Time:</strong> {result.p90} days</p>
                <hr />
                <p><strong>Expected Delivery Date:</strong> {formatDate(result.expectedDate)}</p>
                <p><strong>90% Confidence Delivery Date:</strong> {formatDate(result.p90Date)}</p>
              </div>
          )}
        </div>
      </section>
  );
}
