import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jobApi, scheduleApi, reportApi, organizationApi } from '../../services/api';
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  Users,
  FileText,
  Plus,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const RecruiterDashboard = ({ onOpenReport, onSwitchToCandidate }) => {
  const { user } = useAuth();
  const orgId = user?.organizationId || 'org_aurelia';

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'jobs' | 'schedules' | 'candidates' | 'reports'
  const [organization, setOrganization] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal: Create Job
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobLevel, setNewJobLevel] = useState('ADVANCED');
  const [newJobSkills, setNewJobSkills] = useState('Python, FastAPI, PostgreSQL, Redis');
  const [newJobDuration, setNewJobDuration] = useState(30);
  const [newJobCompetencies, setNewJobCompetencies] = useState([
    { name: 'System Design', description: 'Architecture & scaling', weight: 35 },
    { name: 'Database Architecture', description: 'Query tuning & indexing', weight: 35 },
    { name: 'Debugging & Reliability', description: 'Root cause isolation', weight: 30 }
  ]);

  // Modal: Create Schedule
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [schJobId, setSchJobId] = useState('');
  const [schDate, setSchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [schStartTime, setSchStartTime] = useState('14:00');
  const [schEndTime, setSchEndTime] = useState('16:00');
  const [schDuration, setSchDuration] = useState(30);
  const [schCapacity, setSchCapacity] = useState(10);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [orgRes, jobsRes, schRes, repRes] = await Promise.all([
        organizationApi.getById(orgId).catch(() => ({ organization: { name: 'Aurelia Systems' } })),
        jobApi.list({ organizationId: orgId }),
        scheduleApi.list({ organizationId: orgId }),
        reportApi.listOrgReports(user?.organizationName || 'Aurelia Systems').catch(() => ({ reports: [] }))
      ]);

      setOrganization(orgRes.organization);
      setJobs(jobsRes.jobs || []);
      setSchedules(schRes.schedules || []);
      setReports(repRes.reports || []);

      if (jobsRes.jobs && jobsRes.jobs.length > 0 && !schJobId) {
        setSchJobId(jobsRes.jobs[0].id);
      }
    } catch (err) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [orgId]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = newJobSkills.split(',').map((s) => s.trim()).filter(Boolean);
      await jobApi.create({
        title: newJobTitle,
        description: newJobDesc,
        skills: skillsArray,
        interviewLevel: newJobLevel,
        duration: Number(newJobDuration),
        competencies: newJobCompetencies
      });
      setShowCreateJob(false);
      setNewJobTitle('');
      setNewJobDesc('');
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      await scheduleApi.create({
        jobRoleId: schJobId,
        date: schDate,
        startTime: schStartTime,
        endTime: schEndTime,
        timezone: 'Asia/Kolkata',
        duration: Number(schDuration),
        capacity: Number(schCapacity)
      });
      setShowCreateSchedule(false);
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelSchedule = async (id) => {
    if (!confirm('Are you sure you want to cancel this interview window?')) return;
    try {
      await scheduleApi.cancel(id);
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Metrics
  const openWindows = schedules.filter((s) => s.authoritativeStatus === 'OPEN').length;
  const upcomingWindows = schedules.filter((s) => s.authoritativeStatus === 'UPCOMING').length;
  const completedReportsCount = reports.length;
  const totalJobsCount = jobs.length;

  return (
    <div className="recruiter-portal">
      {/* Top Recruiter Header */}
      <div className="recruiter-sub-nav">
        <div className="recruiter-org-identity">
          <Building2 size={18} style={{ color: 'var(--accent)' }} />
          <div>
            <span className="recruiter-portal-title">{organization?.name || 'Aurelia Systems'}</span>
            <span className="recruiter-sub-text">Recruitment &amp; Interview Operations</span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="recruiter-nav-tabs">
          <button
            type="button"
            className={`recruiter-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={14} />
            Overview
          </button>
          <button
            type="button"
            className={`recruiter-nav-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            <Briefcase size={14} />
            Job Roles ({jobs.length})
          </button>
          <button
            type="button"
            className={`recruiter-nav-btn ${activeTab === 'schedules' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedules')}
          >
            <Calendar size={14} />
            Schedules ({schedules.length})
          </button>
          <button
            type="button"
            className={`recruiter-nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FileText size={14} />
            Evaluations ({reports.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state-box" style={{ margin: '60px auto' }}>
          <div className="loading-spinner" />
          <p>Syncing organization interview pipelines...</p>
        </div>
      ) : (
        <div className="recruiter-body">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="overview-content">
              {/* Stat Cards */}
              <div className="recruiter-stats-grid">
                <div className="rec-stat-card">
                  <span className="stat-label">Open Interview Windows</span>
                  <div className="stat-value" style={{ color: 'var(--status-emerald)' }}>{openWindows}</div>
                  <span className="stat-hint">Active candidate entry allowed</span>
                </div>
                <div className="rec-stat-card">
                  <span className="stat-label">Upcoming Schedules</span>
                  <div className="stat-value">{upcomingWindows}</div>
                  <span className="stat-hint">Countdown locked on server</span>
                </div>
                <div className="rec-stat-card">
                  <span className="stat-label">Active Job Roles</span>
                  <div className="stat-value">{totalJobsCount}</div>
                  <span className="stat-hint">Standardized rubrics</span>
                </div>
                <div className="rec-stat-card">
                  <span className="stat-label">Completed Evaluations</span>
                  <div className="stat-value" style={{ color: 'var(--accent)' }}>{completedReportsCount}</div>
                  <span className="stat-hint">Evidence-based dossiers</span>
                </div>
              </div>

              {/* Action Banners */}
              <div className="overview-actions-row">
                <button
                  type="button"
                  className="btn-recruiter-action"
                  onClick={() => setShowCreateSchedule(true)}
                >
                  <Plus size={15} />
                  Schedule New Interview Window
                </button>
                <button
                  type="button"
                  className="btn-recruiter-action secondary"
                  onClick={() => setShowCreateJob(true)}
                >
                  <Plus size={15} />
                  Define New Job Role
                </button>
              </div>

              {/* Active / Open Windows Section */}
              <div className="recruiter-section">
                <h3>Live Interview Windows</h3>
                <div className="recruiter-schedules-list">
                  {schedules.map((sch) => (
                    <div key={sch.id} className="rec-schedule-row">
                      <div className="rec-sch-title-col">
                        <b>{sch.jobTitle || 'Role'}</b>
                        <span className="rec-sch-level">{sch.interviewLevel}</span>
                      </div>
                      <div className="rec-sch-time-col">
                        <span>{sch.date}</span>
                        <span>{sch.startTime} – {sch.endTime} ({sch.timezone || 'IST'})</span>
                      </div>
                      <div className="rec-sch-capacity-col">
                        <span>Capacity: <b>{sch.bookedCount} / {sch.capacity}</b></span>
                      </div>
                      <div className="rec-sch-status-col">
                        <span className={`status-badge-pill ${sch.authoritativeStatus?.toLowerCase()}`}>
                          {sch.authoritativeStatus}
                        </span>
                      </div>
                      <div className="rec-sch-action-col">
                        {sch.authoritativeStatus === 'UPCOMING' && (
                          <button
                            type="button"
                            className="btn-cancel-link"
                            onClick={() => handleCancelSchedule(sch.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. JOBS TAB */}
          {activeTab === 'jobs' && (
            <div className="jobs-content">
              <div className="section-bar">
                <h3>Configured Job Roles ({jobs.length})</h3>
                <button
                  type="button"
                  className="btn-primary-sm"
                  onClick={() => setShowCreateJob(true)}
                >
                  <Plus size={14} /> Add Role
                </button>
              </div>

              <div className="jobs-cards-grid">
                {jobs.map((job) => (
                  <div key={job.id} className="job-role-admin-card">
                    <div className="job-admin-head">
                      <div>
                        <h4>{job.title}</h4>
                        <span className="job-level-pill">{job.interviewLevel}</span>
                      </div>
                      <span className="job-duration-pill">{job.duration} mins</span>
                    </div>
                    <p className="job-admin-desc">{job.description}</p>

                    <div className="skills-tags-row">
                      {job.skills?.map((s) => (
                        <span key={s} className="skill-pill">{s}</span>
                      ))}
                    </div>

                    <div className="competencies-list-preview">
                      <div className="comp-label">Weighted Competencies:</div>
                      {job.competencies?.map((c, i) => (
                        <div key={i} className="comp-row-item">
                          <span>{c.name}</span>
                          <b>{c.weight}%</b>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. SCHEDULES TAB */}
          {activeTab === 'schedules' && (
            <div className="schedules-content">
              <div className="section-bar">
                <h3>Interview Windows ({schedules.length})</h3>
                <button
                  type="button"
                  className="btn-primary-sm"
                  onClick={() => setShowCreateSchedule(true)}
                >
                  <Plus size={14} /> Create Window
                </button>
              </div>

              <div className="recruiter-schedules-list">
                {schedules.map((sch) => (
                  <div key={sch.id} className="rec-schedule-row">
                    <div className="rec-sch-title-col">
                      <b>{sch.jobTitle || 'Role'}</b>
                      <span className="rec-sch-level">{sch.interviewLevel}</span>
                    </div>
                    <div className="rec-sch-time-col">
                      <span>{sch.date}</span>
                      <span>{sch.startTime} – {sch.endTime} ({sch.timezone || 'IST'})</span>
                    </div>
                    <div className="rec-sch-capacity-col">
                      <span>Booked: <b>{sch.bookedCount} / {sch.capacity}</b></span>
                    </div>
                    <div className="rec-sch-status-col">
                      <span className={`status-badge-pill ${sch.authoritativeStatus?.toLowerCase()}`}>
                        {sch.authoritativeStatus}
                      </span>
                    </div>
                    <div className="rec-sch-action-col">
                      {sch.authoritativeStatus === 'UPCOMING' && (
                        <button
                          type="button"
                          className="btn-cancel-link"
                          onClick={() => handleCancelSchedule(sch.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="reports-content">
              <div className="section-bar">
                <h3>Candidate Evaluations &amp; Dossiers ({reports.length})</h3>
              </div>

              {reports.length === 0 ? (
                <div className="empty-schedules-notice">
                  No completed evaluations recorded yet. Start an interview to see real-time synthesized reports.
                </div>
              ) : (
                <div className="reports-table-wrap">
                  <table className="recruiter-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Role</th>
                        <th>Level</th>
                        <th>Score</th>
                        <th>Recommendation</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((rep) => (
                        <tr key={rep.id}>
                          <td>
                            <b>{rep.candidateName}</b>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rep.candidateEmail}</div>
                          </td>
                          <td>{rep.roleTitle}</td>
                          <td><span className="job-level-pill">{rep.level}</span></td>
                          <td><b>{rep.overallScore} / 10</b></td>
                          <td>
                            <span className={`rec-hiring-pill ${rep.hiringRecommendation?.toLowerCase()}`}>
                              {rep.hiringRecommendation}
                            </span>
                          </td>
                          <td>{rep.interviewDate}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-view-report"
                              onClick={() => onOpenReport(rep.sessionId || rep.id)}
                            >
                              View Full Dossier <ExternalLink size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE JOB MODAL */}
      {showCreateJob && (
        <div className="modal-backdrop" onClick={() => setShowCreateJob(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Define New Job Role</h3>
              <button type="button" className="btn-modal-close" onClick={() => setShowCreateJob(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateJob} className="modal-form">
              <div className="auth-field">
                <label className="field-label">Job Title</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Distributed Systems Engineer"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="field-label">Interview Level</label>
                <select
                  className="auth-input"
                  value={newJobLevel}
                  onChange={(e) => setNewJobLevel(e.target.value)}
                >
                  <option value="BEGINNER">BEGINNER — Fundamentals &amp; Scenarios</option>
                  <option value="INTERMEDIATE">INTERMEDIATE — Architecture &amp; Real-World Reasoning</option>
                  <option value="ADVANCED">ADVANCED — Scalability, Tradeoffs &amp; Concurrency</option>
                  <option value="EXPERT">EXPERT — Ambiguous Distributed Systems &amp; Fault Tolerance</option>
                </select>
              </div>

              <div className="auth-field">
                <label className="field-label">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  className="auth-input"
                  value={newJobSkills}
                  onChange={(e) => setNewJobSkills(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label className="field-label">Description</label>
                <textarea
                  className="auth-input"
                  rows={3}
                  placeholder="Describe key responsibilities and expectations..."
                  value={newJobDesc}
                  onChange={(e) => setNewJobDesc(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 12 }}>
                Publish Job Role
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SCHEDULE MODAL */}
      {showCreateSchedule && (
        <div className="modal-backdrop" onClick={() => setShowCreateSchedule(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Authoritative Interview Window</h3>
              <button type="button" className="btn-modal-close" onClick={() => setShowCreateSchedule(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="modal-form">
              <div className="auth-field">
                <label className="field-label">Target Job Role</label>
                <select
                  className="auth-input"
                  value={schJobId}
                  onChange={(e) => setSchJobId(e.target.value)}
                  required
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.interviewLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="auth-field">
                <label className="field-label">Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  className="auth-input"
                  value={schDate}
                  onChange={(e) => setSchDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="auth-field">
                  <label className="field-label">Start Time (24h)</label>
                  <input
                    type="time"
                    className="auth-input"
                    value={schStartTime}
                    onChange={(e) => setSchStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label className="field-label">End Time (24h)</label>
                  <input
                    type="time"
                    className="auth-input"
                    value={schEndTime}
                    onChange={(e) => setSchEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="auth-field">
                  <label className="field-label">Duration (Mins)</label>
                  <input
                    type="number"
                    className="auth-input"
                    value={schDuration}
                    onChange={(e) => setSchDuration(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label className="field-label">Capacity Limit</label>
                  <input
                    type="number"
                    className="auth-input"
                    value={schCapacity}
                    onChange={(e) => setSchCapacity(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 16 }}>
                Publish Interview Window
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
