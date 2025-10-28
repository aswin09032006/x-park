import React, { useState } from 'react';
import { api } from '../services/api';
import Modal from './Modal';
import { Upload, FileText, Download } from 'lucide-react';
import EditableEmail, { defaultSubject, defaultBody } from './EditableEmail';
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
    if (!file) {
        setResult({ success: false, msg: "Please select a CSV file to upload." });
        return;
    }
    setLoading(true); 
    setResult(null);
    setFailedRows([]);

    const formData = new FormData();
    formData.append('studentFile', file);
    formData.append('emailSubject', emailSubject);
    formData.append('emailBody', emailBody);

    try {
        const data = await api('/admin/students/bulk-add', 'POST', formData, true);
        setResult({ success: true, ...data });
        if (data.details?.failedRows?.length > 0) {
            setFailedRows(data.details.failedRows);
        }
        if (data.details?.successCount > 0) {
             onSuccess();
        }
    } catch (err) {
        setResult({ success: false, msg: err.message, details: err.data?.details || {} });
         if (err.data?.details?.failedRows?.length > 0) {
            setFailedRows(err.data.details.failedRows);
        }
    } finally {
        setLoading(false);
    }
};

/**
 * Generates and downloads a CSV file containing rows that failed to upload,
 * including a reason for the failure. This function is robustly mapped to the
 * required CSV input format.
 */
const handleDownloadErrorCsv = () => {
    if (failedRows.length === 0) return;

    // Define the headers for the output file to match the required input format.
    const headers = ['firstname', 'lastname', 'email', 'phonenumber', 'yeargroup', 'reason'];
    
    // Start CSV content with the header row.
    let csvContent = headers.join(',') + '\n';

    // Process each failed row.
    failedRows.forEach(row => {
        // Map the data from the row object to the CSV headers.
        // This handles potential case differences (e.g., row.firstName -> 'firstname').
        const values = [
            row.firstName || row.firstname || '',
            row.lastName || row.lastname || '',
            row.email || '',
            row.phoneNumber || row.phonenumber || '',
            row.yearGroup || row.yeargroup || '',
            row.reason || 'Unknown error'
        ].map(value => {
            // Sanitize each value to handle commas and quotes within fields.
            let sanitizedValue = String(value).replace(/"/g, '""');
            if (sanitizedValue.includes(',')) {
                sanitizedValue = `"${sanitizedValue}"`;
            }
            return sanitizedValue;
        });
        csvContent += values.join(',') + '\n';
    });

    // Create a Blob and trigger the download.
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'bulk_upload_errors.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Invite Students">
        <div className='max-h-[70vh] space-y-6 y-auto overflow-y-auto pr-2'>
        <p className="text-gray-400 text-sm mb-4">
            Upload a CSV with headers: `firstname`, `lastname`, `email` (required), and `phoneNumber`, `yearGroup` (optional).
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
            <label className="w-full flex items-center gap-3 px-4 py-3 bg-[#222] rounded-md cursor-pointer border border-gray-700">
                <FileText size={20} />
                <span className="truncate">{file ? file.name : "Choose CSV file..."}</span>
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>
            
            <EditableEmail 
                subject={emailSubject}
                setSubject={setEmailSubject}
                body={emailBody}
                setBody={setEmailBody}
            />

            <button type="submit" disabled={loading || !file} className="w-full bg-blue-600 text-white font-bold py-2 px-6 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50">
                <Upload size={18} />
                {loading ? 'Uploading & Inviting...' : 'Upload & Send Invites'}
            </button>
        </form>
        
        {/* --- THIS SECTION DISPLAYS THE RESULT AND THE DOWNLOAD BUTTON --- */}
        {result && (
            <div className={`mt-4 text-sm p-4 rounded-md ${result.success && failedRows.length === 0 ? 'bg-green-500/20 text-green-300' : (failedRows.length > 0 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-400')}`}>
                <p className="font-bold mb-2">{result.msg}</p>
                
                {failedRows.length > 0 && (
                    <div className="border-t border-yellow-400/30 pt-2 mt-2">
                        <p className="text-xs mb-2">{failedRows.length} row(s) could not be imported. Download the report for details, correct the issues, and re-upload the file with only the corrected rows.</p>
                        <button 
                            onClick={handleDownloadErrorCsv}
                            className="w-full bg-yellow-600/50 text-white text-xs font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2 hover:bg-yellow-600/70"
                        >
                            <Download size={14} />
                            Download Error Report (.csv)
                        </button>
                    </div>
                )}
            </div>
        )}
        </div>
    </Modal>
);
};
export default BulkUploadModal;