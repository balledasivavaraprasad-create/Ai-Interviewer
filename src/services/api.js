/**
 * AURA · TALENT Executive API Service Client
 * Clean abstraction over FastAPI backend endpoints.
 */

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('aura_auth_token');
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.detail || data.message || 'API request failed';
    throw new Error(errorMsg);
  }
  return data;
};

export const organizationApi = {
  list: async () => {
    const res = await fetch('/api/organizations', { headers: getHeaders() });
    return handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`/api/organizations/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  }
};

export const jobApi = {
  list: async ({ targetJob, organizationId } = {}) => {
    const params = new URLSearchParams();
    if (targetJob) params.append('targetJob', targetJob);
    if (organizationId) params.append('organizationId', organizationId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/jobs${qs}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`/api/jobs/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  create: async (jobData) => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(jobData)
    });
    return handleResponse(res);
  }
};

export const scheduleApi = {
  list: async ({ organizationId, jobRoleId } = {}) => {
    const params = new URLSearchParams();
    if (organizationId) params.append('organizationId', organizationId);
    if (jobRoleId) params.append('jobRoleId', jobRoleId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/schedules${qs}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`/api/schedules/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  create: async (scheduleData) => {
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(scheduleData)
    });
    return handleResponse(res);
  },
  cancel: async (id) => {
    const res = await fetch(`/api/schedules/${id}/cancel`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};

export const interviewApi = {
  startSession: async (payload) => {
    const res = await fetch('/api/interviews/start', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  getSession: async (sessionId) => {
    const res = await fetch(`/api/interviews/${sessionId}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  submitAnswer: async (sessionId, { answerText, currentQuestionText, currentCompetency }) => {
    const res = await fetch(`/api/interviews/${sessionId}/answer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ answerText, currentQuestionText, currentCompetency })
    });
    return handleResponse(res);
  },
  recordIntegrity: async (sessionId, eventData) => {
    const res = await fetch(`/api/interviews/${sessionId}/integrity`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(eventData)
    });
    return handleResponse(res);
  },
  completeSession: async (sessionId) => {
    const res = await fetch(`/api/interviews/${sessionId}/complete`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  listCandidateSessions: async (candidateId) => {
    const res = await fetch(`/api/interviews/candidate/${candidateId}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  listOrgSessions: async (orgId) => {
    const res = await fetch(`/api/interviews/org/${orgId}`, { headers: getHeaders() });
    return handleResponse(res);
  }
};

export const reportApi = {
  getCandidateReport: async (sessionId) => {
    const res = await fetch(`/api/reports/candidate/${sessionId}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getRecruiterReport: async (sessionId) => {
    const res = await fetch(`/api/reports/recruiter/${sessionId}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  listOrgReports: async (orgName) => {
    const res = await fetch(`/api/reports/org/${encodeURIComponent(orgName)}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  listCandidateHistory: async (email) => {
    const res = await fetch(`/api/reports/candidate-history/${encodeURIComponent(email)}`, { headers: getHeaders() });
    return handleResponse(res);
  }
};

export const resumeApi = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/resume/upload', {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse(res);
  }
};
