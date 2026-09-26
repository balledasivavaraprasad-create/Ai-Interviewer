import React, { useState, useEffect } from 'react';
import { organizationApi, jobApi, scheduleApi } from '../../services/api';
import { Building2, Clock, Calendar, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Shield, UserCheck } from 'lucide-react';

export const OrganizationSelection = ({ targetJob, onSelectSchedule, onSelectPractice, onBack }) => {
  const [organizations, setOrganizations] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [orgRes, jobRes, schRes] = await Promise.all([
          organizationApi.list(),
          jobApi.list({ targetJob }),
          scheduleApi.list()
        ]);
        setOrganizations(orgRes.organizations || []);
        setJobs(jobRes.jobs || []);
        setSchedules(schRes.schedules || []);
        if (orgRes.organizations && orgRes.organizations.length > 0) {
          setSelectedOrgId(orgRes.organizations[0].id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load organization opportunities');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [targetJob]);

  const currentOrg = organizations.find((o) => o.id === selectedOrgId);
  const orgJobs = jobs.filter((j) => j.organizationId === selectedOrgId);
  const orgSchedules = schedules.filter((s) => s.organizationId === selectedOrgId);

  const getLevelBadgeColor = (lvl) => {
    switch (lvl) {
      case 'EXPERT': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'ADVANCED': return { bg: 'rgba(212, 175, 55, 0.15)', text: 'var(--accent-brass)', border: 'rgba(212, 175, 55, 0.3)' };
      case 'INTERMEDIATE': return { bg: 'rgba(53, 201, 205, 0.15)', text: 'var(--accent)', border: 'rgba(53, 201, 205, 0.3)' };
      default: return { bg: 'rgba(16, 185, 129, 0.15)', text: 'var(--status-emerald)', border: 'rgba(16, 185, 129, 0.3)' };
    }
  };

  const formatCountdown = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="onboarding-card org-selection-card">
      <div className="onboarding-header">
        <h1 className="onboarding-title">Where would you like to interview?</h1>
        <p className="onboarding-subtitle">
          Select an enterprise recruitment partner with an open interview window, or conduct an independent practice session.
        </p>
      </div>

      {/* Mode Choice Banner */}
      <div className="practice-mode-callout">
        <div className="practice-mode-info">
          <div className="practice-title">
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            Independent Practice Mode
          </div>
          <p className="practice-desc">
            No schedule constraints. Experience full adaptive Gemini interview, live waveform, and receive instant performance feedback.
          </p>
        </div>
        <button
          type="button"
          className="btn-practice-start"
          onClick={onSelectPractice}
        >
          Launch Practice Interview
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="org-divider-row">
        <span>OR SELECT OFFICIAL RECRUITMENT INTERVIEW</span>
      </div>

      {loading ? (
        <div className="loading-state-box">
          <div className="loading-spinner" />
          <p>Retrieving authoritative interview schedules from partner database...</p>
        </div>
      ) : error ? (
        <div className="error-banner">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : (
        <div className="org-selection-layout">
          {/* Organization Tabs */}
          <div className="org-tabs-sidebar">
            <div className="sidebar-label">Verified Organizations</div>
            {organizations.map((org) => {
              const isSelected = org.id === selectedOrgId;
              const hasOpen = schedules.some((s) => s.organizationId === org.id && s.authoritativeStatus === 'OPEN');
              return (
                <button
                  key={org.id}
                  type="button"
                  className={`org-tab-item ${isSelected ? 'active' : ''}`}
                  onClick={() => { setSelectedOrgId(org.id); setSelectedScheduleId(null); }}
                >
                  <div className="org-tab-icon">
                    <Building2 size={16} />
                  </div>
                  <div className="org-tab-details">
                    <div className="org-tab-name">{org.name}</div>
                    <div className="org-tab-meta">{org.industry}</div>
                  </div>
                  {hasOpen && <span className="open-dot" title="Interview window open now" />}
                </button>
              );
            })}
          </div>

          {/* Org Details & Schedule Cards */}
          <div className="org-content-panel">
            {currentOrg && (
              <div className="current-org-header">
                <h2>{currentOrg.name}</h2>
                <p>{currentOrg.description}</p>
              </div>
            )}

            <div className="schedules-list-label">Configured Interview Windows:</div>

            <div className="schedules-grid">
              {orgSchedules.length === 0 ? (
                <div className="empty-schedules-notice">
                  No interview windows currently scheduled for this organization.
                </div>
              ) : (
                orgSchedules.map((sch) => {
                  const isSelected = sch.id === selectedScheduleId;
                  const isUpcoming = sch.authoritativeStatus === 'UPCOMING';
                  const isOpen = sch.authoritativeStatus === 'OPEN';
                  const isExpired = sch.authoritativeStatus === 'EXPIRED';
                  const isCancelled = sch.authoritativeStatus === 'CANCELLED';
                  const badge = getLevelBadgeColor(sch.interviewLevel);

                  return (
                    <div
                      key={sch.id}
                      className={`schedule-card ${isSelected ? 'selected' : ''} ${!sch.canEnter && !isUpcoming ? 'disabled' : ''}`}
                      onClick={() => {
                        if (isOpen || isUpcoming) {
                          setSelectedScheduleId(sch.id);
                        }
                      }}
                    >
                      <div className="schedule-card-top">
                        <div className="schedule-job-title">{sch.jobTitle || 'Engineering Role'}</div>
                        <span
                          className="level-badge"
                          style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}
                        >
                          {sch.interviewLevel}
                        </span>
                      </div>

                      <div className="schedule-meta-row">
                        <span className="meta-item">
                          <Calendar size={13} />
                          {sch.date}
                        </span>
                        <span className="meta-item">
                          <Clock size={13} />
                          {sch.startTime} – {sch.endTime} {sch.timezone || 'IST'}
                        </span>
                        <span className="meta-item">
                          <UserCheck size={13} />
                          {sch.duration} mins ({sch.bookedCount}/{sch.capacity} booked)
                        </span>
                      </div>

                      <div className="schedule-card-footer">
                        {isOpen && (
                          <div className="status-live-open">
                            <span className="pulsing-dot" />
                            <b>Interview Window OPEN</b> — Candidates admitted now
                          </div>
                        )}
                        {isUpcoming && (
                          <div className="status-upcoming">
                            <Clock size={13} />
                            Opens in: <b>{formatCountdown(sch.secondsUntilOpen)}</b>
                          </div>
                        )}
                        {isExpired && (
                          <div className="status-expired">
                            Interview window expired (Closed at {sch.endTime})
                          </div>
                        )}
                        {isCancelled && (
                          <div className="status-cancelled">
                            Interview window cancelled by organization
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Actions */}
      <div className="onboarding-actions" style={{ marginTop: 28 }}>
        <button
          type="button"
          className="btn-primary"
          disabled={!selectedScheduleId}
          onClick={() => {
            const sch = schedules.find((s) => s.id === selectedScheduleId);
            if (sch && onSelectSchedule) {
              onSelectSchedule(sch);
            }
          }}
        >
          <span>Continue to Official Interview</span>
          <ArrowRight size={16} />
        </button>

        {onBack && (
          <button
            type="button"
            className="btn-secondary-link"
            onClick={onBack}
          >
            ← Back to Resume &amp; Role Details
          </button>
        )}
      </div>
    </div>
  );
};
