export const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const timeAgo = (date) => {
  if (!date) return '—';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const riskLevelFromScore = (score) => {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  return 'HIGH';
};

export const activityLabel = (type) => {
  const map = {
    LOGIN: 'Logged in',
    LOGOUT: 'Logged out',
    FAILED_LOGIN: 'Failed login attempt',
    DOCUMENT_UPLOAD: 'Uploaded a document',
    DOCUMENT_VIEW: 'Viewed a document',
    DOCUMENT_DOWNLOAD: 'Downloaded a document',
    DOCUMENT_DELETE: 'Deleted a document',
    UNAUTHORIZED_ACCESS: 'Unauthorized access attempt',
  };
  return map[type] || type;
};
