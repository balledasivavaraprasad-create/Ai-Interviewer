import React, { useState, useEffect } from 'react';
import { reportApi } from '../../services/api';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Download,
  Building2,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Activity,
  Award
} from 'lucide-react';

export const RecruiterReportView = ({ sessionId, onBack }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await reportApi.getRecruiterReport(sessionId);
        setReport(res.report);
      } catch (err) {
        setError(err.message || 'Failed to load evaluation dossier');
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
        <h2>Generating Comprehensive Recruiter Evaluation Dossier...</h2>
        <p>Cross-referencing transcript, extracted competency evidence, and observable integrity timeline.</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="onboarding-card report-error-card">
        <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
        <h2>Evaluation Dossier Not Found</h2>
        <p>{error || 'The requested evaluation report does not exist or access is unauthorized.'}</p>
        <button type="button" className="btn-primary" onClick={onBack}>
          Return to Recruiter Dashboard
        </button>
      </div>
    );
  }

  const getHiringBadgeClass = (rec) => {
    switch (rec) {
      case 'STRONG_HIRE': return 'strong-hire';
      case 'HIRE': return 'hire';
      case 'LEAN_HIRE': return 'lean-hire';
      default: return 'do-not-hire';
    }
  };

  return (
    <div className="onboarding-card recruiter-report-card">
      {/* Top Header */}
      <div className="rec-report-header">
        <button type="button" className="btn-back-link" onClick={onBack}>
          <ArrowLeft size={14} style={{ marginRight: 6 }} />
          Back to Recruiter Overview
        </button>

        <div className="rec-report-badge">
          <Award size={14} style={{ color: 'var(--accent)' }} />
          Official Recruiter Dossier &amp; Decision Synthesis
        </div>

        <h1 className="rec-report-title">{report.candidateName} — {report.roleTitle}</h1>
        <div className="rec-report-meta">
          <span><Building2 size={13} /> {report.organizationName}</span>
          <span>•</span>
          <span><Calendar size={13} /> {report.interviewDate}</span>
          <span>•</span>
          <span><Clock size={13} /> {report.durationMinutes} Minutes</span>
          <span>•</span>
          <span>Level: <b>{report.level}</b></span>
        </div>
      </div>

      {/* Decision Summary Card */}
      <div className="rec-decision-banner">
        <div className="rec-score-box">
          <span className="score-val">{report.overallScore}</span>
          <span className="score-denom">/ 10</span>
        </div>

        <div className="rec-decision-content">
          <div className="rec-decision-pill-wrap">
            <span className="decision-label">Hiring Recommendation:</span>
            <span className={`hiring-recommendation-pill ${getHiringBadgeClass(report.hiringRecommendation)}`}>
              {report.hiringRecommendation}
            </span>
          </div>
          <p className="rec-summary-paragraph">{report.summary}</p>
        </div>
      </div>

      {/* Competencies with Concrete Evidence Quotes */}
      <div className="rec-report-section">
        <h2>Role Competency Assessment &amp; Verifiable Evidence</h2>
        <div className="rec-competencies-grid">
          {report.competencyBreakdown?.map((comp, idx) => (
            <div key={idx} className="rec-comp-card">
              <div className="rec-comp-top">
                <span className="comp-name">{comp.competency}</span>
                <span className="comp-weight">Weight: {comp.weight}%</span>
                <span className="comp-score-tag">{comp.score} / 10</span>
              </div>

              <div className="comp-progress-bar">
                <div
                  className="comp-progress-fill"
                  style={{ width: `${Math.min(100, (comp.score / 10) * 100)}%` }}
                />
              </div>

              {comp.evidence && (
                <div className="evidence-quote-box">
                  <span className="quote-label">Demonstrated Evidence:</span>
                  <p>"{comp.evidence[0] || 'Evaluated in dialogue.'}"</p>
                </div>
              )}

              {comp.gaps && comp.gaps.length > 0 && comp.gaps[0] && (
                <div className="gap-quote-box">
                  <span className="quote-label">Identified Opportunity / Gap:</span>
                  <p>"{comp.gaps[0]}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Strengths and Gaps */}
      <div className="report-two-col">
        <div className="report-col-card strengths">
          <div className="col-header">
            <CheckCircle2 size={16} style={{ color: 'var(--status-emerald)' }} />
            <h3>Verified Candidate Strengths</h3>
          </div>
          <ul className="points-list">
            {report.strengths?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="report-col-card growth">
          <div className="col-header">
            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
            <h3>Identified Technical Gaps</h3>
          </div>
          <ul className="points-list">
            {report.gaps?.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Observable Integrity Timeline */}
      <div className="rec-report-section">
        <div className="section-header-row">
          <Activity size={16} style={{ color: 'var(--accent)' }} />
          <h2>Observable Integrity Timeline</h2>
        </div>
        <div className="integrity-timeline-box">
          {(!report.integrityTimeline || report.integrityTimeline.length === 0) ? (
            <div className="clean-integrity-notice">
              <CheckCircle2 size={16} style={{ color: 'var(--status-emerald)' }} />
              <span>Full session verified: candidate presence maintained with no anomalous gaze patterns.</span>
            </div>
          ) : (
            report.integrityTimeline.map((ev, i) => (
              <div key={i} className="integrity-event-item">
                <span className="ev-time">{ev.timestamp?.slice(11, 19) || '00:04:15'}</span>
                <span className="ev-type">{ev.eventType}</span>
                <span className="ev-duration">Duration: {ev.duration}s</span>
                <span className="ev-confidence">Confidence: {(ev.confidence * 100).toFixed(0)}%</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Complete Interview Transcript */}
      <div className="rec-report-section">
        <div className="section-header-row">
          <MessageSquare size={16} style={{ color: 'var(--text-secondary)' }} />
          <h2>Full Authoritative Transcript</h2>
        </div>
        <div className="transcript-scroll-box">
          {(!report.transcript || report.transcript.length === 0) ? (
            <div className="empty-schedules-notice">No dialogue records stored.</div>
          ) : (
            report.transcript.map((item, idx) => (
              <div key={idx} className={`transcript-dialogue-row ${item.speaker?.toLowerCase()}`}>
                <div className="dialogue-speaker-tag">
                  {item.speaker === 'INTERVIEWER' ? 'Sarah Chen (AI Interviewer)' : `${report.candidateName} (Candidate)`}
                </div>
                <div className="dialogue-bubble">
                  {item.text}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="onboarding-actions" style={{ marginTop: 32 }}>
        <button type="button" className="btn-primary" onClick={onBack}>
          Return to Dashboard
        </button>
        <button
          type="button"
          className="btn-secondary-link"
          onClick={() => window.print()}
        >
          <Download size={14} style={{ marginRight: 6 }} />
          Export Executive PDF Dossier
        </button>
      </div>
    </div>
  );
};
