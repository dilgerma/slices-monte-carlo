'use client';

import { useState } from 'react';
import {
    Slice,
    SimulationResult,
    validateSlices,
    runSimulation,
    formatDate,
    calculateDaysFromNow
} from '@/lib/monteCarlo';
import SimulationGraph from './SimulationGraph';

interface MonteCarloSimulatorProps {
    initialJsonInput?: string;
    initialCycleTime?: number;
    initialGlobalRisk?: number;
    onSimulationComplete?: (result: SimulationResult) => void;
}

export default function MonteCarloSimulator({
                                                initialJsonInput = '',
                                                initialCycleTime = 1,
                                                initialGlobalRisk = 0.1,
                                                onSimulationComplete
                                            }: MonteCarloSimulatorProps) {
    const [jsonInput, setJsonInput] = useState(initialJsonInput);
    const [slices, setSlices] = useState<Slice[]>([]);
    const [deadlineDate, setDeadlineDate] = useState<Date>(() => {
        // Default to 30 days from now
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
    });
    const [cycleTime, setCycleTime] = useState(initialCycleTime);
    const [globalRisk, setGlobalRisk] = useState(initialGlobalRisk);
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const parseJson = () => {
        try {
            const data = JSON.parse(jsonInput);
            const validatedSlices = validateSlices(data);
            setSlices(validatedSlices);
            setError(null);
        } catch (e) {
            setError((e as any).message);
        }
    };

    const simulateRun = () => {
        const simulationResult = runSimulation({
            slices,
            deadlineDate,
            cycleTime,
            globalRisk
        });

        setResult(simulationResult);

        if (onSimulationComplete) {
            onSimulationComplete(simulationResult);
        }
    };

    // Format the deadline date for display
    const formattedDeadlineDate = formatDate(deadlineDate);

    // Calculate days until deadline for display
    const daysUntilDeadline = calculateDaysFromNow(deadlineDate);

    // Format date for the date input (YYYY-MM-DD)
    const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    // Handle date input change
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = new Date(e.target.value);
        setDeadlineDate(newDate);
    };

    return (
        <div className="monte-carlo-simulator">
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
                            <label className="label">Deadline Date</label>
                            <div className="control">
                                <input
                                    type="date"
                                    className="input"
                                    value={formatDateForInput(deadlineDate)}
                                    onChange={handleDateChange}
                                    min={formatDateForInput(new Date())}
                                />
                            </div>
                            <p className="help">Target date: {formattedDeadlineDate} ({daysUntilDeadline} days from now)</p>
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
                <>
                    <div className="box mt-4">
                        <SimulationGraph
                            durations={result.durations}
                            deadlineDays={result.deadlineDays}
                            probability={result.probability}
                        />
                    </div>

                    <div className="notification is-info mt-4">
                        <h3 className="subtitle">Detailed Results</h3>
                        <p><strong>Number of Slices:</strong> {result.sliceCount}</p>
                        <p><strong>Deadline:</strong> {formattedDeadlineDate} ({result.deadlineDays} days from now)</p>
                        <p><strong>Average Total Time:</strong> {result.average} days</p>
                        <p><strong>90th Percentile Time:</strong> {result.p90} days</p>
                        <hr />
                        <p><strong>Expected Delivery Date:</strong> {formatDate(result.expectedDate)}</p>
                        <p><strong>90% Confidence Delivery Date:</strong> {formatDate(result.p90Date)}</p>
                    </div>
                </>
            )}

        </div>
    );
}
