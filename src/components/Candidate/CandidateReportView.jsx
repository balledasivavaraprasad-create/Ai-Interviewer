import React, { useState, useEffect } from 'react';
import { reportApi } from '../../services/api';
import { Award, CheckCircle2, TrendingUp, BookOpen, AlertCircle, ArrowLeft, Download, Sparkles } from 'lucide-react';

export const CandidateReportView = ({ sessionId, onDone }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await reportApi.getCandidateReport(sessionId);
        setReport(res.report);
      } catch (err) {
        setError(err.message || 'Failed to load candidate performance report');
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchReport();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="onboarding-card report-loading-card">
        <div className="loading-spinner" />
        <h2>Synthesizing Interview Performance Report...</h2>
        <p>Evaluating competency evidence, response depth, and technical reasoning.</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="onboarding-card report-error-card">
        <AlertCircle size={24} style={{ color: 'var(--danger)' }} />
        <h2>Unable to load evaluation report</h2>
        <p>{error || 'Report record not found'}</p>
        <button type="button" className="btn-primary" onClick={onDone}>
          Return to Portal
        </button>
      </div>
    );
  }

  return (
    <div className="onboarding-card candidate-report-card">
      <div className="report-header">
        <div className="report-badge">
          <Award size={14} style={{ color: 'var(--accent)' }} />
          Candidate Performance Evaluation
        </div>
        <h1 className="report-title">{report.roleTitle} Evaluation</h1>
        <div className="report-meta">
          <span>Organization: <b>{report.organizationName}</b></span>
          <span>•</span>
          <span>Level: <b>{report.level}</b></span>
          <span>•</span>
          <span>Date: <b>{report.date}</b></span>
        </div>
      </div>

      {/* Score and Summary Banner */}
      <div className="report-score-banner">
        <div className="score-circle">
          <span className="score-number">{report.overallScore}</span>
          <span className="score-out-of">/ 10</span>
        </div>
        <div className="score-summary-text">
          <h3>Performance Overview</h3>
          <p>{report.performanceSummary}</p>
        </div>
      </div>

      {/* Competencies Breakdown */}
      <div className="report-section">
        <h2 className="section-title">Role Competencies Breakdown</h2>
        <div className="competencies-grid">
          {report.competencies.map((comp, idx) => (
            <div key={idx} className="competency-card">
              <div className="comp-card-top">
                <span className="comp-name">{comp.competency}</span>
                <span className="comp-score">{comp.score} / 10</span>
              </div>
              <div className="comp-progress-bar">
                <div
                  className="comp-progress-fill"
                  style={{ width: `${Math.min(100, (comp.score / 10) * 100)}%` }}
                />
              </div>

              {comp.evidence && comp.evidence.length > 0 && (
                <div className="comp-evidence-box">
                  <div className="evidence-label">Demonstrated Evidence:</div>
                  <p>{comp.evidence[0]}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Growth Areas */}
      <div className="report-two-col">
        <div className="report-col-card strengths">
          <div className="col-header">
            <CheckCircle2 size={16} style={{ color: 'var(--status-emerald)' }} />
            <h3>Key Demonstrated Strengths</h3>
          </div>
          <ul className="points-list">
            {report.keyStrengths.map((str, i) => (
              <li key={i}>{str}</li>
            ))}
          </ul>
        </div>

        <div className="report-col-card growth">
          <div className="col-header">
            <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
            <h3>Areas for Focus &amp; Refinement</h3>
          </div>
          <ul className="points-list">
            {report.growthAreas.map((area, i) => (
              <li key={i}>{area}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Practice Recommendations */}
      <div className="report-section recommendations-section">
        <div className="section-header-row">
          <BookOpen size={16} style={{ color: 'var(--accent-brass)' }} />
          <h2 className="section-title">Technical Practice Recommendations</h2>
        </div>
        <div className="recommendations-box">
          {report.practiceRecommendations.map((rec, i) => (
            <div key={i} className="rec-item">
              <Sparkles size={14} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Report Actions */}
      <div className="onboarding-actions" style={{ marginTop: 32 }}>
        <button type="button" className="btn-primary" onClick={onDone}>
          <span>Return to Dashboard</span>
        </button>
        <button
          type="button"
          className="btn-secondary-link"
          onClick={() => window.print()}
        >
          <Download size={14} style={{ marginRight: 6 }} />
          Print / Save PDF Report
        </button>
      </div>
    </div>
  );
};
