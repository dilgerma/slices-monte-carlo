import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface SimulationGraphProps {
    durations: number[];
    deadlineDays: number;
    probability: number;
    completionResults: Record<number, number>;
    totalSimulations: number;
}

const SimulationGraph = ({
                             deadlineDays,
                             probability,
                             completionResults,
                             totalSimulations
                         }: SimulationGraphProps) => {
    // Determine status color based on probability
    const getStatusColor = (prob: number) => {
        if (prob >= 0.8) return '#4caf50'; // Green for high probability
        if (prob >= 0.5) return '#ff9800'; // Orange for medium probability
        return '#f44336'; // Red for low probability
    };

    const statusColor = getStatusColor(probability);

    // Convert completion results to chart data
    const dayLabels = Object.keys(completionResults).sort((a, b) => parseInt(a) - parseInt(b));
    const dayCounts = dayLabels.map(day => completionResults[parseInt(day)]);

    // Calculate cumulative probability
    let cumulativeCount = 0;
    const cumulativeProbabilities = dayCounts.map(count => {
        cumulativeCount += count;
        return (cumulativeCount / totalSimulations) * 100;
    });

    // Create background colors with different color for days after deadline
    const backgroundColor = dayLabels.map(day =>
        parseInt(day) <= deadlineDays ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'
    );

    // Fix: Use the correct data structure for Chart.js
    const data = {
        labels: dayLabels.map(day => `Day ${day}`),
        datasets: [
            {
                label: 'Number of Simulations',
                data: dayCounts,
                backgroundColor,
                borderColor: dayLabels.map(day =>
                    parseInt(day) <= deadlineDays ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
                ),
                borderWidth: 1,
            }
        ],
    };

    // Create a separate chart for the cumulative line
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Completion Forecast',
                font: {
                    size: 18
                }
            },
            tooltip: {
                callbacks: {
                    label: (context:any) => {
                        const value = context.parsed.y;
                        return `Simulations: ${value} (${((value / totalSimulations) * 100).toFixed(1)}%)`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Days to Completion'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Number of Simulations'
                }
            }
        }
    };

    return (
        <div>
            <div className="columns">
                <div className="column is-one-third">
                    <div className="box has-text-centered" style={{ backgroundColor: statusColor }}>
                        <h2 className="title is-2" style={{ color: '#ffffff' }}>{(probability * 100).toFixed(0)}%</h2>
                        <p className="subtitle is-5" style={{ color: '#ffffff' }}>Chance of Meeting Deadline</p>
                    </div>
                </div>
                <div className="column">
                    <div>
                        <p className="is-size-5">
                            <strong>Executive Summary:</strong> Based on {totalSimulations.toLocaleString()} simulations, we have a
                            <strong> {(probability * 100).toFixed(0)}% chance</strong> of completing this project by the deadline.
                        </p>
                        <p className="mt-2">
                            {probability >= 0.8 ?
                                '✅ We are on track to meet the deadline with high confidence.' :
                                probability >= 0.5 ?
                                    '⚠️ We may meet the deadline, but there are significant risks.' :
                                    '❌ We are unlikely to meet the deadline without changes to scope or resources.'}
                        </p>
                    </div>
                </div>
            </div>

            <Bar data={data} options={options} />

            {/* Add a separate section for the cumulative probability */}
            <div className="mt-4">
                <p className="has-text-centered">
                    <strong>Cumulative Probability at Deadline:</strong> {
                    cumulativeProbabilities[dayLabels.findIndex(day => parseInt(day) > deadlineDays) - 1]?.toFixed(1) || '0'
                }%
                </p>
            </div>
        </div>
    );
};

export default SimulationGraph;
