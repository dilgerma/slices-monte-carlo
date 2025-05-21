'use client';

import { useState } from 'react';
import {
    SimulationResult,
    runSimulation,
    formatDate,
    calculateDaysFromNow
} from '@/lib/monteCarlo';
import SimulationGraph from './SimulationGraph';

interface MonteCarloSimulatorProps {
    initialThroughput?: number[];
    initialSprintLength?: number;
    onSimulationComplete?: (result: SimulationResult) => void;
}

export default function MonteCarloSimulator({
                                                initialThroughput = [10, 12, 8, 15, 11],
                                                initialSprintLength = 14,
                                                onSimulationComplete
                                            }: MonteCarloSimulatorProps) {
    const [storyCountMin, setStoryCountMin] = useState(80);
    const [storyCountMax, setStoryCountMax] = useState(90);
    const [storySplitMin, setStorySplitMin] = useState(1.0);
    const [storySplitMax, setStorySplitMax] = useState(2.0);
    const [throughputInput, setThroughputInput] = useState(initialThroughput.join(', '));
    const [sprintLengthDays, setSprintLengthDays] = useState(initialSprintLength);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [deadlineDate, setDeadlineDate] = useState<Date>(() => {
        // Default to 90 days from now
        const date = new Date();
        date.setDate(date.getDate() + 90);
        return date;
    });
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const simulateRun = () => {
        try {
            // Parse throughput values
            const throughputValues = throughputInput
                .split(',')
                .map(val => parseFloat(val.trim()))
                .filter(val => !isNaN(val));

            if (throughputValues.length === 0) {
                throw new Error('Please enter at least one valid throughput value');
            }

            const simulationResult = runSimulation({
                storyCountMin,
                storyCountMax,
                storySplitMin,
                storySplitMax,
                historicThroughput: throughputValues,
                sprintLengthDays,
                startDate
            }, deadlineDate);

            setResult(simulationResult);
            setError(null);

            if (onSimulationComplete) {
                onSimulationComplete(simulationResult);
            }
        } catch (e: any) {
            setError(e.message);
        }
    };

    // Format dates for display
    const formattedStartDate = formatDate(startDate);
    const formattedDeadlineDate = formatDate(deadlineDate);

    // Calculate days until deadline for display
    const daysUntilDeadline = calculateDaysFromNow(deadlineDate);

    // Format date for the date input (YYYY-MM-DD)
    const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    return (
        <div className="monte-carlo-simulator">
            <div className="box">
                <h3 className="subtitle">Project Parameters</h3>

                <div className="field">
                    <label className="label">Story Count Range</label>
                    <div className="columns">
                        <div className="column">
                            <div className="field">
                                <label className="label is-small">Minimum</label>
                                <input
                                    className="input"
                                    type="number"
                                    value={storyCountMin}
                                    onChange={e => setStoryCountMin(Number(e.target.value))}
                                    min="1"
                                />
                            </div>
                        </div>
                        <div className="column">
                            <div className="field">
                                <label className="label is-small">Maximum</label>
                                <input
                                    className="input"
                                    type="number"
                                    value={storyCountMax}
                                    onChange={e => setStoryCountMax(Number(e.target.value))}
                                    min={storyCountMin}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="field">
                    <label className="label">Story Split Factor Range</label>
                    <div className="columns">
                        <div className="column">
                            <div className="field">
                                <label className="label is-small">Minimum</label>
                                <input
                                    className="input"
                                    type="number"
                                    value={storySplitMin}
                                    onChange={e => setStorySplitMin(Number(e.target.value))}
                                    min="0.1"
                                    step="0.1"
                                />
                            </div>
                        </div>
                        <div className="column">
                            <div className="field">
                                <label className="label is-small">Maximum</label>
                                <input
                                    className="input"
                                    type="number"
                                    value={storySplitMax}
                                    onChange={e => setStorySplitMax(Number(e.target.value))}
                                    min={storySplitMin}
                                    step="0.1"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="field">
                    <label className="label">Historic Throughput (story points per sprint, comma-separated)</label>
                    <input
                        className="input"
                        type="text"
                        value={throughputInput}
                        onChange={e => setThroughputInput(e.target.value)}
                        placeholder="10, 12, 8, 15, 11"
                    />
                    <p className="help">Enter your team's historical throughput values separated by commas</p>
                </div>

                <div className="field">
                    <label className="label">Sprint Length (days)</label>
                    <input
                        className="input"
                        type="number"
                        value={sprintLengthDays}
                        onChange={e => setSprintLengthDays(Number(e.target.value))}
                        min="1"
                    />
                </div>

                <div className="columns">
                    <div className="column">
                        <div className="field">
                            <label className="label">Start Date</label>
                            <input
                                type="date"
                                className="input"
                                value={formatDateForInput(startDate)}
                                onChange={e => setStartDate(new Date(e.target.value))}
                            />
                            <p className="help">Project start: {formattedStartDate}</p>
                        </div>
                    </div>
                    <div className="column">
                        <div className="field">
                            <label className="label">Deadline Date</label>
                            <input
                                type="date"
                                className="input"
                                value={formatDateForInput(deadlineDate)}
                                onChange={e => setDeadlineDate(new Date(e.target.value))}
                                min={formatDateForInput(startDate)}
                            />
                            <p className="help">Target date: {formattedDeadlineDate} ({daysUntilDeadline} days from now)</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="field">
                <div className="control">
                    <button className="button is-primary" onClick={simulateRun}>
                        Run Simulation
                    </button>
                </div>
                {error && <p className="help is-danger">{error}</p>}
            </div>

            {result && (
                <>
                    <div className="box mt-4">
                        <SimulationGraph
                            durations={result.durations}
                            deadlineDays={result.deadlineDays}
                            probability={result.probability}
                            sprintResults={result.sprintResults}
                            sprintLengthDays={sprintLengthDays}
                        />
                    </div>

                    <div className="notification is-info mt-4">
                        <h3 className="subtitle">Detailed Results</h3>
                        <div className="columns">
                            <div className="column">
                                <p><strong>Story Count Range:</strong> {storyCountMin} - {storyCountMax}</p>
                                <p><strong>Story Split Factor:</strong> {storySplitMin} - {storySplitMax}</p>
                                <p><strong>Sprint Length:</strong> {sprintLengthDays} days</p>
                            </div>
                            <div className="column">
                                <p><strong>Start Date:</strong> {formattedStartDate}</p>
                                <p><strong>Deadline:</strong> {formattedDeadlineDate} ({result.deadlineDays} days from start)</p>
                                <p><strong>Probability to Meet Deadline:</strong> {(result.probability * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                        <hr />
                        <div className="columns">
                            <div className="column">
                                <p><strong>Average Completion Time:</strong> {result.average} days</p>
                                <p><strong>90th Percentile Time:</strong> {result.p90} days</p>
                            </div>
                            <div className="column">
                                <p><strong>Expected Delivery Date:</strong> {formatDate(result.expectedDate)}</p>
                                <p><strong>90% Confidence Delivery Date:</strong> {formatDate(result.p90Date)}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
