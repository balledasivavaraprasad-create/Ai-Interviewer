import React from 'react';
import { AudioVisualizer } from './AudioVisualizer';
import { InterviewerAudioController } from '../../services/audio/InterviewerAudioController';

/**
 * InterviewerAudioVisualizer - High-fidelity wrapper for AudioVisualizer.
 */
export const InterviewerAudioVisualizer = ({
  width,
  height = 130,
  className = '',
  speaking,
  isMuted
}) => {
  return (
    <AudioVisualizer
      audioController={InterviewerAudioController}
      speaking={speaking}
      isMuted={isMuted}
      height={height}
      className={className}
    />
  );
};
