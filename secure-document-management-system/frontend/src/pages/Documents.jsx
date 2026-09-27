import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatBytes, formatDate } from '../utils/format';

export default function Documents() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ documentName: '', description: '', file: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadDocuments = async (query = '') => {
    setLoading(true);
    try {
      const res = await api.get('/documents', { params: query ? { search: query } : {} });
      setDocuments(res.data.documents);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load documents.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadDocuments(search), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.file) {
      showToast('Please choose a file to upload.', 'warning');
      return;
    }
    const data = new FormData();
    data.append('file', form.file);
    data.append('documentName', form.documentName || form.file.name);
    data.append('description', form.description);

    setUploading(true);
    try {
      await api.post('/documents/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Document uploaded successfully.', 'success');
      setUploadOpen(false);
      setForm({ documentName: '', description: '', file: null });
      loadDocuments(search);
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc._id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.documentName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast('You are not authorized to download this document.', 'error');
    }
  };

  const handleView = async (doc) => {
    try {
      await api.get(`/documents/${doc._id}`);
      showToast(`Viewing "${doc.documentName}"`, 'info');
    } catch (err) {
      showToast('You are not authorized to view this document.', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/documents/${deleteTarget._id}`);
      showToast('Document deleted.', 'success');
      setDeleteTarget(null);
      loadDocuments(search);
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed.', 'error');
    }
  };

  return (
    <DashboardLayout title="Documents">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-semibold text-ink">Document Management</h2>
          <p className="text-sm text-ink-dim mt-1">
            {user?.role === 'admin' ? 'All documents across the system.' : 'Documents you own.'}
          </p>
        </div>
        <button onClick={() => setUploadOpen(true)} className="btn-primary">Upload document</button>
      </div>

      <div className="panel p-4 mb-4">
        <input
          className="input-field max-w-sm"
          placeholder="Search by name or file type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="panel overflow-x-auto">
        {loading ? (
          <Loader />
        ) : documents.length === 0 ? (
          <EmptyState
            title="No documents found"
            message="Upload your first document to get started."
            action={<button onClick={() => setUploadOpen(true)} className="btn-primary">Upload document</button>}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>File Type</th>
                <th>File Size</th>
                <th>Uploaded</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc._id}>
                  <td className="font-medium">{doc.documentName}</td>
                  <td className="text-ink-dim">{doc.fileType}</td>
                  <td className="text-ink-dim">{formatBytes(doc.fileSize)}</td>
                  <td className="text-ink-dim">{formatDate(doc.uploadedAt)}</td>
                  <td className="text-ink-dim">{doc.uploadedBy?.name || '—'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(doc)} className="text-xs text-accent hover:underline">View</button>
                      <button onClick={() => handleDownload(doc)} className="text-xs text-accent hover:underline">Download</button>
                      <button onClick={() => setDeleteTarget(doc)} className="text-xs text-risk-high hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload document"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setUploadOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-ink-dim block mb-1.5">Select file</label>
            <input
              type="file"
              className="input-field"
              onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-dim block mb-1.5">Document name</label>
            <input
              className="input-field"
              placeholder="e.g. Q3 Financial Report"
              value={form.documentName}
              onChange={(e) => setForm({ ...form, documentName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-dim block mb-1.5">Description</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Optional description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete document"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={confirmDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm text-ink-dim">
          Are you sure you want to delete <span className="text-ink font-medium">{deleteTarget?.documentName}</span>? This cannot be undone.
        </p>
      </Modal>
    </DashboardLayout>
  );
}
