import React from 'react';
import { useInterview } from '../../context/InterviewContext';

const SUGGESTED_ROLES = [
  'Backend Engineer',
  'ML Engineer',
  'Software Developer',
  'Full Stack Architect',
  'Engineering Manager'
];

export const TargetJobInput = () => {
  const { targetJob, setTargetJob } = useInterview();

  return (
    <div className="form-group">
      <label htmlFor="target-job-input" className="form-label">
        Target Role / Position
      </label>
      <input
        id="target-job-input"
        type="text"
        className="form-input"
        value={targetJob}
        onChange={(e) => setTargetJob(e.target.value)}
        placeholder="e.g. Backend Engineer, ML Engineer, Software Developer"
        autoComplete="off"
      />
      <div className="quick-roles">
        {SUGGESTED_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            className="quick-role-chip"
            onClick={() => setTargetJob(role)}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  );
};
