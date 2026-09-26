import React, { useState, useRef } from 'react';
import { useInterview } from '../../context/InterviewContext';
import { UploadCloud, FileText, CheckCircle2, Trash2, RefreshCw } from 'lucide-react';

export const ResumeUpload = () => {
  const { resume, setResume, removeResume } = useInterview();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;

    // Simulate smooth upload progress bar for high-end feel
    setIsUploading(true);
    setUploadPercent(15);

    const step1 = setTimeout(() => setUploadPercent(65), 180);
    const step2 = setTimeout(() => {
      setUploadPercent(100);
      setTimeout(() => {
        setResume(file);
        setIsUploading(false);
      }, 200);
    }, 420);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
    };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (resume) {
    return (
      <div className="file-uploaded-badge">
        <div className="file-info">
          <FileText className="file-icon" size={24} />
          <div>
            <div className="file-name" title={resume.name}>{resume.name}</div>
            <div className="file-size">{formatFileSize(resume.size)} · Ready for evaluation</div>
          </div>
        </div>

        <div className="file-actions">
          <button 
            type="button" 
            className="file-action-btn" 
            title="Replace resume"
            onClick={() => fileInputRef.current?.click()}
          >
            <RefreshCw size={15} />
          </button>
          <button 
            type="button" 
            className="file-action-btn" 
            title="Remove resume"
            onClick={removeResume}
          >
            <Trash2 size={15} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`upload-dropzone ${isDragging ? 'drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      <div className="upload-icon-wrapper">
        {isUploading ? (
          <div className="preparing-spinner" style={{ width: 22, height: 22, borderWidth: 2 }} />
        ) : (
          <UploadCloud size={22} />
        )}
      </div>

      <div className="upload-primary-text">
        {isUploading ? `Uploading resume (${uploadPercent}%)...` : 'Upload your resume'}
      </div>
      <div className="upload-secondary-text">
        Drag & drop PDF or click to browse (Optional)
      </div>
    </div>
  );
};
