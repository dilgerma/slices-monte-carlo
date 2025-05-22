'use client';

import React from 'react';

interface DetailedResultsProps {
  result: {
    deadlineDays: number;
    probability: number;
    average: string;
    p90: string;
    expectedDate: Date;
    p90Date: Date;
  };
  sliceCountMin: number;
  sliceCountMax: number;
  splitFactorMin: number;
  splitFactorMax: number;
  throughputMin: number;
  throughputMax: number;
  uncertaintyFactor: number;
  formattedStartDate: string;
  formattedDeadlineDate: string;
  formatDate: (date: Date) => string;
}

const DetailedResults: React.FC<DetailedResultsProps> = ({
  result,
  sliceCountMin,
  sliceCountMax,
  splitFactorMin,
  splitFactorMax,
  throughputMin,
  throughputMax,
  uncertaintyFactor,
  formattedStartDate,
  formattedDeadlineDate,
  formatDate
}) => {
  return (
    <div className="notification is-info mt-4">
      <h3 className="subtitle">Detailed Results</h3>
      <div className="columns">
        <div className="column">
          <p><strong>Slice Count Range:</strong> {sliceCountMin} - {sliceCountMax}</p>
          <p><strong>Slice Split Factor:</strong> {splitFactorMin} - {splitFactorMax}</p>
          <p><strong>Team Throughput:</strong> {throughputMin} - {throughputMax} slices/week</p>
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
          <p><strong>Average Completion Time:</strong> {result.average} days ({(parseFloat(result.average) / 7).toFixed(1)} weeks)</p>
          <p><strong>90th Percentile Time:</strong> {result.p90} days ({(parseFloat(result.p90) / 7).toFixed(1)} weeks)</p>
          <p><strong>Uncertainty Factor:</strong> Up to {(uncertaintyFactor * 100).toFixed(0)}% throughput reduction</p>
        </div>
        <div className="column">
          <p><strong>Expected Delivery Date:</strong> {formatDate(result.expectedDate)}</p>
          <p><strong>90% Confidence Delivery Date:</strong> {formatDate(result.p90Date)}</p>
        </div>
      </div>
    </div>
  );
};

export default DetailedResults;
