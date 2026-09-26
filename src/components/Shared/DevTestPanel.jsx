import React, { useState } from 'react';
import { useInterview, AVATAR_STATES } from '../../context/InterviewContext';
import { VOICE_PROFILES } from '../../config/interviewers';
import { Wrench, Volume2, Square, Sparkles, X } from 'lucide-react';

export const DevTestPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    interviewerGender,
    avatarState,
    testVoice,
    stopSpeaking,
    askNextQuestion,
    currentQuestion
  } = useInterview();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 100,
        fontFamily: 'var(--font-sans)',
        fontSize: 12
      }}
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            background: 'rgba(18, 21, 30, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            padding: '6px 12px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: 'var(--shadow-subtle)',
            transition: 'all 0.2s ease'
          }}
          title="Open Developer Voice & State Test Panel"
        >
          <Wrench size={12} color="var(--accent-warm-gold)" />
          <span>Dev Audio / Voice Controls</span>
        </button>
      ) : (
        <div
          style={{
            width: 320,
            background: 'rgba(13, 15, 21, 0.95)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: 14,
            padding: '16px 18px',
            boxShadow: 'var(--shadow-elevated)',
            color: 'var(--text-primary)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <Wrench size={13} color="var(--accent-warm-gold)" />
              <span>Voice & Speech Verification</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ marginBottom: 12, padding: '8px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8, fontSize: 11.5 }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Session Gender:</span> <strong>{interviewerGender || 'None'}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Locked Voice:</span> <strong>{interviewerGender ? VOICE_PROFILES[interviewerGender]?.displayName : 'Auto'}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Avatar State:</span> <strong>{avatarState}</strong></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <button
              type="button"
              className="quick-role-chip"
              style={{ justifyContent: 'flex-start', padding: '6px 10px' }}
              onClick={() => testVoice('female')}
            >
              <Volume2 size={13} style={{ marginRight: 6 }} color="#E2B878" />
              Test Female Voice (Sarah Chen)
            </button>

            <button
              type="button"
              className="quick-role-chip"
              style={{ justifyContent: 'flex-start', padding: '6px 10px' }}
              onClick={() => testVoice('male')}
            >
              <Volume2 size={13} style={{ marginRight: 6 }} color="#38BDF8" />
              Test Male Voice (David Kim)
            </button>

            <button
              type="button"
              className="quick-role-chip"
              style={{ justifyContent: 'flex-start', padding: '6px 10px' }}
              onClick={() => askNextQuestion()}
            >
              <Sparkles size={13} style={{ marginRight: 6 }} color="var(--status-emerald)" />
              Trigger Next Gemini Question
            </button>

            <button
              type="button"
              className="quick-role-chip"
              style={{ justifyContent: 'flex-start', padding: '6px 10px' }}
              onClick={stopSpeaking}
            >
              <Square size={13} style={{ marginRight: 6 }} color="#F43F5E" />
              Stop / Interrupt Speech
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
