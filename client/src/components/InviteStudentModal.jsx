import React, { useState } from 'react';
import { api } from '../services/api';
import Modal from './Modal';
import { Plus } from 'lucide-react';
import EditableEmail, { defaultSubject, defaultBody } from './EditableEmail'; // <-- IMPORT NEW COMPONENT AND DEFAULTS

const InviteStudentModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phoneNumber: '', yearGroup: ''
    });
    // --- State for the editable email ---
    const [emailSubject, setEmailSubject] = useState(defaultSubject);
    const [emailBody, setEmailBody] = useState(defaultBody);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', yearGroup: '' });
        setEmailSubject(defaultSubject);
        setEmailBody(defaultBody);
        setSuccess('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setSuccess('');
        try {
            // --- Include the email content in the payload ---
            const payload = { ...formData, emailSubject, emailBody };
            const data = await api('/admin/invite-student', 'POST', payload);

            setSuccess(data.msg);
            onSuccess();
            setTimeout(() => {
                resetForm();
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Invite a New Student">
             <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-6 y-auto overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">First Name</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-[#222] border border-gray-700 rounded-md p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-[#222] border border-gray-700 rounded-md p-2" required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-[#222] border border-gray-700 rounded-md p-2" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Phone Number (Optional)</label>
                        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="w-full bg-[#222] border border-gray-700 rounded-md p-2" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Grade / Year Group</label>
                        <input type="number" name="yearGroup" value={formData.yearGroup} onChange={handleInputChange} className="w-full bg-[#222] border border-gray-700 rounded-md p-2" required />
                    </div>
                </div>
                 
                <EditableEmail 
                    subject={emailSubject}
                    setSubject={setEmailSubject}
                    body={emailBody}
                    setBody={setEmailBody}
                    // This new prop makes the preview more realistic
                    studentFirstNamePreview={formData.firstName || "[Student's First Name]"}
                />
                
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {success && <p className="text-green-500 text-sm text-center">{success}</p>}
                
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50">
                    <Plus size={18} />
                    {loading ? 'Sending Invitation...' : 'Send Invitation'}
                </button>
            </form>
        </Modal>
    );
};

export default InviteStudentModal;