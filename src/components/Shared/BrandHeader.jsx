import React from 'react';

export const BrandHeader = () => {
  return (
    <header className="brand-header">
      <div className="brand-symbol">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>
      <div className="brand-text">
        <span className="brand-name">Aura · Talent</span>
        <span className="brand-tagline">Executive Interview Suite</span>
      </div>
    </header>
  );
};
