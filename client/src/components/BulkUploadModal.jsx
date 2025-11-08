import React, { useState } from 'react';
import { api } from '../services/api';
import Modal from './Modal';
import { Upload, FileText, Download } from 'lucide-react';
import EditableEmail, { defaultSubject, defaultBody } from './EditableEmail';
import { logger } from '../services/logger';

const BulkUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [emailSubject, setEmailSubject] = useState(defaultSubject);
  const [emailBody, setEmailBody] = useState(defaultBody);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [failedRows, setFailedRows] = useState([]);

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setFailedRows([]);
    setEmailSubject(defaultSubject);
    setEmailBody(defaultBody);
    onClose();
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setFailedRows([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const context = 'BulkUploadModal.handleSubmit';
    logger.startNewTrace();

    if (!file) {
      setResult({ success: false, msg: 'Please select a CSV file to upload.' });
      return;
    }

    setLoading(true);
    setResult(null);
    setFailedRows([]);

    logger.info('Starting bulk student upload.', {
      context,
      details: { filename: file.name },
    });

    const formData = new FormData();
    formData.append('studentFile', file);
    formData.append('emailSubject', emailSubject);
    formData.append('emailBody', emailBody);

    try {
      const data = await api('/admin/students/bulk-add', 'POST', formData, true);
      setResult({ success: true, ...data });

      if (data.details?.failedRows?.length > 0) setFailedRows(data.details.failedRows);
      if (data.details?.successCount > 0) onSuccess();

      logger.success('Bulk upload completed.', {
        context,
        details: {
          successCount: data.details?.successCount,
          failedCount: data.details?.failedRows?.length || 0,
        },
      });
    } catch (err) {
      setResult({ success: false, msg: err.message, details: err.data?.details || {} });

      if (err.data?.details?.failedRows?.length > 0)
        setFailedRows(err.data.details.failedRows);

      logger.error('Bulk upload failed.', { context, details: { error: err.message } });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrorCsv = () => {
    if (failedRows.length === 0) return;

    const headers = ['firstname', 'lastname', 'email', 'yeargroup', 'reason'];
    const csvRows = failedRows.map((row) =>
      [
        row.firstname || '',
        row.lastname || '',
        row.email || '',
        row.yeargroup || '',
        row.reason || 'Unknown error',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bulk_upload_errors.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderResult = () => {
    if (!result) return null;

    const hasFailed = failedRows.length > 0;
    const baseClass = 'mt-4 text-sm p-4 rounded-md';
    const resultClass = result.success && !hasFailed
      ? 'bg-green-500/20 text-green-300'
      : hasFailed
      ? 'bg-yellow-500/20 text-yellow-300'
      : 'bg-red-500/20 text-red-400';

    return (
      <div className={`${baseClass} ${resultClass}`}>
        <p className="font-bold mb-2">{result.msg}</p>
        {hasFailed && (
          <div className="border-t border-yellow-400/30 pt-2 mt-2">
            <p className="text-xs mb-2">
              {failedRows.length} row(s) could not be imported. Download the report
              for details, correct the issues, and re-upload the corrected rows.
            </p>
            <button
              onClick={handleDownloadErrorCsv}
              className="w-full bg-yellow-600/50 text-white text-xs font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2 hover:bg-yellow-600/70"
            >
              <Download size={14} /> Download Error Report (.csv)
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Invite Students">
      <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
        <p className="text-muted-foreground text-sm mb-4">
          Upload a CSV with headers: <code>firstname</code>, <code>lastname</code>,{' '}
          <code>email</code> (required), and <code>yeargroup</code> (optional, 7–13).
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="w-full flex items-center gap-3 px-4 py-3 bg-input rounded-md cursor-pointer border border-border">
            <FileText size={20} />
            <span className="truncate">{file ? file.name : 'Choose CSV file...'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <EditableEmail
            subject={emailSubject}
            setSubject={setEmailSubject}
            body={emailBody}
            setBody={setEmailBody}
          />

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full bg-blue-600 text-white font-bold py-2 px-6 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            <Upload size={18} />
            {loading ? 'Uploading & Inviting...' : 'Upload & Send Invites'}
          </button>
        </form>

        {renderResult()}
      </div>
    </Modal>
  );
};

export default BulkUploadModal;