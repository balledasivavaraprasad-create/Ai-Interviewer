import React, { useState, useEffect } from 'react';
import { scheduleApi } from '../../services/api';
import { Clock, Shield, Calendar, Building2, User, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { INTERVIEWERS } from '../../config/interviewers';

export const WaitingRoom = ({ schedule, interviewerGender, onEnterInterview, onCancel }) => {
  const [currentSchedule, setCurrentSchedule] = useState(schedule);
  const [secondsRemaining, setSecondsRemaining] = useState(schedule.secondsUntilOpen || 0);
  const [isOpen, setIsOpen] = useState(schedule.authoritativeStatus === 'OPEN');
  const [isExpired, setIsExpired] = useState(schedule.authoritativeStatus === 'EXPIRED');
  const [checkingServer, setCheckingServer] = useState(false);

  const interviewer = INTERVIEWERS[interviewerGender] || INTERVIEWERS.female;

  // Poll authoritative status from backend periodically or when countdown completes
  const checkAuthoritativeStatus = async () => {
    if (!schedule.id) return;
    setCheckingServer(true);
    try {
      const res = await scheduleApi.getById(schedule.id);
      if (res.schedule) {
        setCurrentSchedule(res.schedule);
        setSecondsRemaining(res.schedule.secondsUntilOpen || 0);
        if (res.schedule.authoritativeStatus === 'OPEN') {
          setIsOpen(true);
          setIsExpired(false);
        } else if (res.schedule.authoritativeStatus === 'EXPIRED') {
          setIsExpired(true);
          setIsOpen(false);
        }
      }
    } catch (err) {
      console.error('Waiting room status check error:', err);
    } finally {
      setCheckingServer(false);
    }
  };

  useEffect(() => {
    // Check initial status
    checkAuthoritativeStatus();

    // 1-second countdown tick
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Re-verify authoritative status from backend
          checkAuthoritativeStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Also poll server every 15 seconds to ensure server time synchronicity
    const pollInterval = setInterval(checkAuthoritativeStatus, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, [schedule.id]);

  const formatCountdown = (secs) => {
    if (secs <= 0) return '00:00:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="onboarding-card waiting-room-card">
      <div className="waiting-room-badge">
        <Shield size={14} style={{ color: 'var(--accent)' }} />
        Official Executive Waiting Room
      </div>

      <div className="waiting-room-header">
        <h1 className="waiting-org-name">{currentSchedule.organizationName || 'Aurelia Systems'}</h1>
        <div className="waiting-role-title">{currentSchedule.jobTitle || 'Backend Engineer'}</div>
        <div className="waiting-level-pill">{currentSchedule.interviewLevel || 'ADVANCED'} INTERVIEW</div>
      </div>

      <div className="waiting-room-details-grid">
        {/* Interviewer Card */}
        <div className="waiting-interviewer-card">
          <img
            src={interviewer.image}
            alt={interviewer.name}
            className="waiting-avatar-img"
          />
          <div className="waiting-interviewer-info">
            <span className="info-label">Assigned Executive Interviewer</span>
            <h3>{interviewer.name}</h3>
            <p>{interviewer.title}</p>
          </div>
        </div>

        {/* Schedule & Time Panel */}
        <div className="waiting-schedule-panel">
          <div className="schedule-detail-row">
            <Calendar size={15} />
            <span>Date: <b>{currentSchedule.date}</b></span>
          </div>
          <div className="schedule-detail-row">
            <Clock size={15} />
            <span>Time Window: <b>{currentSchedule.startTime} – {currentSchedule.endTime} {currentSchedule.timezone || 'IST'}</b></span>
          </div>
          <div className="schedule-detail-row">
            <User size={15} />
            <span>Duration: <b>{currentSchedule.duration} Minutes</b></span>
          </div>

          <div className="waiting-status-display">
            {isOpen ? (
              <div className="status-open-box">
                <CheckCircle2 size={20} style={{ color: 'var(--status-emerald)' }} />
                <div>
                  <div className="open-title">Your interview is ready.</div>
                  <div className="open-desc">The official window is open. You may enter the interview room now.</div>
                </div>
              </div>
            ) : isExpired ? (
              <div className="status-expired-box">
                <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
                <div>
                  <div className="expired-title">Interview window has closed.</div>
                  <div className="expired-desc">This scheduled window ended at {currentSchedule.endTime}. Please contact your recruiter.</div>
                </div>
              </div>
            ) : (
              <div className="status-countdown-box">
                <div className="countdown-label">Interview window opens in:</div>
                <div className="countdown-digits">{formatCountdown(secondsRemaining)}</div>
                <div className="countdown-note">
                  Server-authoritative gate: access unlocks automatically when the server clock reaches {currentSchedule.startTime}.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="onboarding-actions" style={{ marginTop: 32 }}>
        <button
          type="button"
          className="btn-primary"
          disabled={!isOpen}
          onClick={onEnterInterview}
        >
          <span>{isOpen ? 'Enter Interview Room' : `Interview opens at ${currentSchedule.startTime}`}</span>
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          className="btn-secondary-link"
          onClick={onCancel}
        >
          Return to schedule overview
        </button>
      </div>
    </div>
  );
};
