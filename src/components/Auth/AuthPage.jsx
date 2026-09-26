import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ShieldCheck, ArrowRight, Check, X, Eye, EyeOff, Sparkles, User, Briefcase, Sun, Moon } from 'lucide-react';

const SLIDES = [
  '/login_slides/slide_1.jpg',
  '/login_slides/slide_2.jpg',
  '/login_slides/slide_3.jpg'
];

export const AuthPage = ({ onAuthSuccess }) => {
  const { login, signup, verifyOtp, resendOtp, loginDemoCandidate, loginDemoRecruiter, loading } = useAuth();
  const { themeMode, setThemeMode } = useTheme();

  // Selected Role tab: CANDIDATE vs RECRUITER
  const [roleTab, setRoleTab] = useState('CANDIDATE'); // CANDIDATE or RECRUITER

  // View state: 'login' | 'signup' | 'otp'
  const [view, setView] = useState('login');

  // Form inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // OTP inputs
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  // Modals
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Messages
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Background slider
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Password rules
  const rules = {
    length: signupPassword.length >= 8,
    upper: /[A-Z]/.test(signupPassword),
    lower: /[a-z]/.test(signupPassword),
    number: /[0-9]/.test(signupPassword),
    special: /[^A-Za-z0-9]/.test(signupPassword)
  };

  const isPasswordValid = Object.values(rules).every(Boolean);
  const passwordsMatch = signupPassword && signupPassword === signupConfirm;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setMsg({ text: 'Please fill in both email and password.', type: 'error' });
      return;
    }
    setMsg({ text: '', type: '' });
    try {
      await login(loginEmail, loginPassword, roleTab);
      setMsg({ text: 'Authentication successful. Redirecting...', type: 'success' });
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setMsg({ text: err.message || 'Login failed.', type: 'error' });
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim()) {
      setMsg({ text: 'Please provide full name and email.', type: 'error' });
      return;
    }
    if (!isPasswordValid) {
      setMsg({ text: 'Password must meet all security requirements.', type: 'error' });
      return;
    }
    if (!passwordsMatch) {
      setMsg({ text: 'Passwords do not match.', type: 'error' });
      return;
    }
    if (!termsAccepted) {
      setMsg({ text: 'Please agree to Terms & Conditions.', type: 'error' });
      return;
    }

    setMsg({ text: '', type: '' });
    try {
      const res = await signup(signupName, signupEmail, signupPassword, roleTab);
      setPendingEmail(signupEmail);
      setView('otp');
      setMsg({ text: res.message || 'Verification code sent.', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message || 'Signup failed.', type: 'error' });
    }
  };

  const handleOtpChange = (index, value) => {
    const clean = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = clean.slice(-1);
    setOtpDigits(newDigits);

    if (clean && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setMsg({ text: 'Enter the complete 6-digit verification code.', type: 'error' });
      return;
    }

    try {
      await verifyOtp(pendingEmail, fullOtp);
      setMsg({ text: 'Account verified successfully!', type: 'success' });
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setMsg({ text: err.message || 'Verification failed.', type: 'error' });
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp(pendingEmail);
      setMsg({ text: 'A fresh 6-digit code has been dispatched.', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleDemoCandidate = async () => {
    setMsg({ text: 'Signing into demo candidate account...', type: 'success' });
    try {
      await loginDemoCandidate();
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleDemoRecruiter = async () => {
    setMsg({ text: 'Signing into Aurelia Systems recruiter account...', type: 'success' });
    try {
      await loginDemoRecruiter();
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  return (
    <div className="auth-master-page">
      {/* LEFT: BRAND / SLIDESHOW PANEL */}
      <div className="auth-brand-side">
        <div className="auth-bg-slides">
          {SLIDES.map((src, i) => (
            <div
              key={src}
              className={`auth-slide ${i === activeSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
          <div className="auth-slide-overlay" />
        </div>

        <div className="auth-brand-content">
          <div className="auth-brand-top">
            <div className="auth-brand-mark">
              <span className="brand-dot" /> AURA · TALENT
            </div>
            <div className="auth-status-tag">
              <ShieldCheck size={13} style={{ color: 'var(--accent)' }} />
              Official Executive Interview Platform
            </div>
          </div>

          <div className="auth-hero-text">
            <h1>Executive interview.<br />Powered by adaptive AI.</h1>
            <p>
              AURA · TALENT conducts live, competency-driven technical evaluations for world-class engineering teams.
              Adaptive questions, real-time speech, observable integrity, and deep evidence synthesis.
            </p>

            <div className="auth-live-waveform" aria-hidden="true">
              <span className="w-bar" style={{ height: '28%' }} />
              <span className="w-bar" style={{ height: '60%' }} />
              <span className="w-bar" style={{ height: '90%' }} />
              <span className="w-bar" style={{ height: '45%' }} />
              <span className="w-bar" style={{ height: '100%' }} />
              <span className="w-bar" style={{ height: '65%' }} />
              <span className="w-bar" style={{ height: '35%' }} />
              <span className="w-bar" style={{ height: '78%' }} />
              <span className="w-bar" style={{ height: '50%' }} />
              <span className="w-bar" style={{ height: '22%' }} />
            </div>
            <div className="auth-waveform-caption">Live voice telemetry & real-time audio synthesis</div>
          </div>

          <div className="auth-brand-footer">
            <p>
              All sessions are <b>encrypted at rest and in transit</b>. Evaluated strictly against role competencies, never superficial signals.
            </p>
            <div className="auth-slide-dots">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`slide-dot ${idx === activeSlide ? 'active' : ''}`}
                  onClick={() => setActiveSlide(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: AUTH FORM PANEL */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          {/* Top Role Selector: Candidate vs Recruiter */}
          <div className="auth-role-tabs">
            <button
              type="button"
              className={`auth-role-tab ${roleTab === 'CANDIDATE' ? 'active' : ''}`}
              onClick={() => { setRoleTab('CANDIDATE'); setMsg({ text: '', type: '' }); }}
            >
              <User size={15} />
              Candidate Portal
            </button>
            <button
              type="button"
              className={`auth-role-tab ${roleTab === 'RECRUITER' ? 'active' : ''}`}
              onClick={() => { setRoleTab('RECRUITER'); setMsg({ text: '', type: '' }); }}
            >
              <Briefcase size={15} />
              Recruiter & Org
            </button>
          </div>

          {/* Sub Navigation: Login vs Create Account (if not in OTP view) */}
          {view !== 'otp' && (
            <div className="auth-mode-switch">
              <button
                type="button"
                className={`auth-mode-btn ${view === 'login' ? 'active' : ''}`}
                onClick={() => { setView('login'); setMsg({ text: '', type: '' }); }}
              >
                Log In
              </button>
              <button
                type="button"
                className={`auth-mode-btn ${view === 'signup' ? 'active' : ''}`}
                onClick={() => { setView('signup'); setMsg({ text: '', type: '' }); }}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Quick Demo Access Bar */}
          <div className="demo-credentials-bar">
            <div className="demo-credentials-label">
              <Sparkles size={13} style={{ color: 'var(--accent)' }} />
              Quick Development Access:
            </div>
            <div className="demo-buttons-row">
              <button
                type="button"
                className="btn-demo-pill"
                onClick={handleDemoCandidate}
                disabled={loading}
              >
                Candidate (Jane Doe)
              </button>
              <button
                type="button"
                className="btn-demo-pill"
                onClick={handleDemoRecruiter}
                disabled={loading}
              >
                Recruiter (Aurelia Systems)
              </button>
            </div>
          </div>

          {/* 1. LOGIN VIEW */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-field">
                <label className="field-label">Official Email</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder={roleTab === 'RECRUITER' ? 'recruiter@aurelia-demo.local' : 'candidate@demo.local'}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <label className="field-label">Password</label>
                <div className="password-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="pw-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-auth-primary"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : `Log In as ${roleTab === 'RECRUITER' ? 'Recruiter' : 'Candidate'}`}
                <ArrowRight size={16} />
              </button>

              <div className="auth-footer-prompt">
                New to AURA · TALENT?{' '}
                <button
                  type="button"
                  className="auth-text-link"
                  onClick={() => { setView('signup'); setMsg({ text: '', type: '' }); }}
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* 2. SIGNUP VIEW */}
          {view === 'signup' && (
            <form onSubmit={handleSignup} className="auth-form">
              <div className="auth-field">
                <label className="field-label">Full Name</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder={roleTab === 'RECRUITER' ? 'Elena Rostova' : 'Jane Doe'}
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="field-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder={roleTab === 'RECRUITER' ? 'elena@company.com' : 'jane.doe@example.com'}
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="field-label">Create Password</label>
                <div className="password-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Create a strong password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="pw-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Password Strength Checklist */}
                <div className="pw-checklist">
                  <div className={`pw-rule ${rules.length ? 'met' : ''}`}>
                    <span className="pw-tick">{rules.length ? <Check size={11} strokeWidth={3} /> : null}</span>
                    8+ characters
                  </div>
                  <div className={`pw-rule ${rules.upper ? 'met' : ''}`}>
                    <span className="pw-tick">{rules.upper ? <Check size={11} strokeWidth={3} /> : null}</span>
                    Uppercase letter
                  </div>
                  <div className={`pw-rule ${rules.lower ? 'met' : ''}`}>
                    <span className="pw-tick">{rules.lower ? <Check size={11} strokeWidth={3} /> : null}</span>
                    Lowercase letter
                  </div>
                  <div className={`pw-rule ${rules.number ? 'met' : ''}`}>
                    <span className="pw-tick">{rules.number ? <Check size={11} strokeWidth={3} /> : null}</span>
                    Number
                  </div>
                  <div className={`pw-rule ${rules.special ? 'met' : ''}`}>
                    <span className="pw-tick">{rules.special ? <Check size={11} strokeWidth={3} /> : null}</span>
                    Special character
                  </div>
                </div>
              </div>

              <div className="auth-field">
                <label className="field-label">Confirm Password</label>
                <input
                  type="password"
                  className={`auth-input ${signupConfirm && !passwordsMatch ? 'field-error' : ''}`}
                  placeholder="Re-enter your password"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                {signupConfirm && !passwordsMatch && (
                  <div className="field-error-msg">Passwords do not match.</div>
                )}
              </div>

              <div className="terms-checkbox-row">
                <div
                  className={`custom-checkbox ${termsAccepted ? 'checked' : ''}`}
                  onClick={() => setTermsAccepted(!termsAccepted)}
                  role="checkbox"
                  aria-checked={termsAccepted}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setTermsAccepted(!termsAccepted)}
                >
                  {termsAccepted && <Check size={12} strokeWidth={3} />}
                </div>
                <div className="terms-text">
                  I agree to AURA · TALENT's{' '}
                  <button type="button" className="auth-text-link" onClick={() => setShowTermsModal(true)}>
                    Terms &amp; Conditions
                  </button>{' '}
                  and{' '}
                  <button type="button" className="auth-text-link" onClick={() => setShowPrivacyModal(true)}>
                    Privacy Policy
                  </button>
                  , including audio/video observable signal monitoring.
                </div>
              </div>

              <button
                type="submit"
                className="btn-auth-primary"
                disabled={loading || !isPasswordValid || !passwordsMatch || !termsAccepted}
              >
                {loading ? 'Sending code...' : 'Send 2FA Verification Code'}
                <ArrowRight size={16} />
              </button>

              <div className="auth-footer-prompt">
                Already registered?{' '}
                <button
                  type="button"
                  className="auth-text-link"
                  onClick={() => { setView('login'); setMsg({ text: '', type: '' }); }}
                >
                  Log in here
                </button>
              </div>
            </form>
          )}

          {/* 3. 2FA OTP VERIFICATION VIEW */}
          {view === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="auth-form otp-view">
              <button
                type="button"
                className="btn-back-link"
                onClick={() => setView('signup')}
              >
                ← Back to registration
              </button>

              <h2 className="otp-title">Enter Verification Code</h2>
              <p className="otp-subtitle">
                We sent a secure 6-digit code to <b>{pendingEmail}</b>. It expires in 10 minutes.
              </p>

              <div className="otp-inputs-row">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-input-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`otp-digit-box ${digit ? 'filled' : ''}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn-auth-primary"
                disabled={loading || otpDigits.join('').length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify and Enter Platform'}
                <ArrowRight size={16} />
              </button>

              <div className="otp-resend-row">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  className="auth-text-link"
                  onClick={handleResend}
                >
                  Resend verification code
                </button>
              </div>
            </form>
          )}

          {/* Feedback message banner */}
          {msg.text && (
            <div className={`auth-msg-banner ${msg.type}`}>
              {msg.text}
            </div>
          )}
        </div>
      </div>

      {/* TERMS MODAL */}
      {showTermsModal && (
        <div className="modal-backdrop" onClick={() => setShowTermsModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Terms &amp; Conditions</h3>
              <button type="button" className="btn-modal-close" onClick={() => setShowTermsModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <h4>1. Platform Purpose</h4>
              <p>AURA · TALENT facilitates official AI-assisted technical interviews between candidates and partner enterprises using adaptive reasoning and standardized competency rubrics.</p>
              <h4>2. Observable Integrity</h4>
              <p>During official interview windows, the platform evaluates observable integrity signals (such as presence and orientation) to provide hiring teams with transparent, non-punitive audit context.</p>
              <h4>3. Confidentiality</h4>
              <p>Candidate resumes and interview records are isolated to the specific hiring organization and never made public or distributed across third-party employers.</p>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY MODAL */}
      {showPrivacyModal && (
        <div className="modal-backdrop" onClick={() => setShowPrivacyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Privacy Policy</h3>
              <button type="button" className="btn-modal-close" onClick={() => setShowPrivacyModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <h4>1. Information Collected</h4>
              <p>We collect candidate identity data, resume qualifications, interview audio/video stream telemetry, and spoken transcripts during active sessions.</p>
              <h4>2. Fair Evaluation Standard</h4>
              <p>Evaluations are strictly synthesized from demonstrated technical evidence and role competencies. Superficial factors like appearance, accents, or background environment are strictly excluded from technical scores.</p>
              <h4>3. Data Retention</h4>
              <p>Telemetry and performance reports are securely stored under organizational isolation and accessible exclusively to authorized hiring personnel.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
