'use client';

import MonteCarloSimulator from '@/components/MonteCarloSimulator';
import { SimulationResult } from '@/lib/monteCarlo';

export default function Home() {
  const handleSimulationComplete = (result: SimulationResult) => {
    console.log('Simulation completed with result:', result);
    // You can do additional processing here if needed
  };

  return (
      <section className="section">
        <div className="container">
          <h1 className="title">Monte Carlo Deadline Simulator</h1>

          <MonteCarloSimulator
              initialCycleTime={1}
              initialGlobalRisk={0.1}
              onSimulationComplete={handleSimulationComplete}
          />
        </div>
      </section>
  );
}
