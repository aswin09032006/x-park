// --- /frontend/src/pages/ManageAdmins.jsx ---
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Trash2, PlusCircle, ArrowLeft, X, Loader2, Send } from 'lucide-react';
import { logger } from '../services/logger';

const ManageAdmins = () => {
    const [admins, setAdmins] = useState([]);
    const [schools, setSchools] = useState([]);
    const [formData, setFormData] = useState({ email: '', schoolId: '' });
    const [loading, setLoading] = useState(true);
    const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
    const [resendingInviteId, setResendingInviteId] = useState(null);
    const [error, setError] = useState('');
    const [schoolSearch, setSchoolSearch] = useState('');
    const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
    const schoolInputRef = useRef(null);

    const fetchData = useCallback(async () => {
        const context = 'ManageAdmins.fetchData';
        try {
            setLoading(true);
            const [adminsData, schoolsData] = await Promise.all([
                api('/superadmin/admins'),
                api('/superadmin/schools')
            ]);
            setAdmins(adminsData);
            setSchools(schoolsData);
            logger.info('Fetched admins and schools.', { context });
        } catch (err) {
            setError(err.message || 'Failed to fetch data.');
            logger.error('Failed to fetch admins and schools.', { context, details: { error: err.message } });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        logger.startNewTrace();
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (schoolInputRef.current && !schoolInputRef.current.contains(event.target)) setShowSchoolDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setIsCreatingAdmin(true);
        const context = 'ManageAdmins.handleCreateAdmin';
        logger.startNewTrace();
        logger.info('Attempting to create a new admin.', { context, details: { email: formData.email } });
        try {
            const data = await api('/superadmin/admins', 'POST', formData);
            alert(data.msg);
            setFormData({ email: '', schoolId: '' });
            setSchoolSearch('');
            fetchData();
            logger.success('Admin created successfully.', { context });
        } catch (err) {
            alert(`Error: ${err.message}`);
            logger.error('Failed to create admin.', { context, details: { error: err.message } });
        } finally {
            setIsCreatingAdmin(false);
        }
    };

    const handleDeleteAdmin = async (adminId) => {
        const context = 'ManageAdmins.handleDeleteAdmin';
        logger.startNewTrace();
        if (!window.confirm('Are you sure you want to delete this admin?')) return;
        logger.warn('Attempting to delete an admin.', { context, details: { adminId } });
        try {
            await api(`/superadmin/admins/${adminId}`, 'DELETE');
            fetchData();
            logger.success('Admin deleted successfully.', { context, details: { adminId } });
        } catch (err) {
            alert(`Error: ${err.message}`);
            logger.error('Failed to delete admin.', { context, details: { adminId, error: err.message } });
        }
    };

    const filteredSchools = useMemo(() => schools.filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase())), [schoolSearch, schools]);

    const handleSelectSchool = (school) => {
        setFormData({ ...formData, schoolId: school._id });
        setSchoolSearch(school.name);
        setShowSchoolDropdown(false);
    };

    // --- THIS IS THE FIX (Part 1): Add handler for resending the invite ---
    const handleResendInvite = async (adminId) => {
        const context = 'ManageAdmins.handleResendInvite';
        logger.startNewTrace();
        setResendingInviteId(adminId);
        logger.info('Attempting to resend admin invitation.', { context, details: { adminId } });
        try {
            const data = await api(`/superadmin/admins/${adminId}/resend-invite`, 'POST');
            alert(data.msg);
            logger.success('Admin invitation resent successfully.', { context, details: { adminId } });
        } catch (err) {
            alert(`Error: ${err.message}`);
            logger.error('Failed to resend admin invitation.', { context, details: { adminId, error: err.message } });
        } finally {
            setResendingInviteId(null);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto text-foreground">
            <Link to="/superadmin/dashboard" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-8">Manage School Admins</h1>
            <form onSubmit={handleCreateAdmin} className="mb-8 p-6 bg-card border border-border rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                 <div>
                    <label className="block text-sm text-muted-foreground mb-1">Admin Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-input border border-border rounded-md px-3 py-2" required />
                </div>
                <div className="relative" ref={schoolInputRef}>
                    <label className="block text-sm text-muted-foreground mb-1">School</label>
                    <input type="text" value={schoolSearch} onChange={(e) => { setSchoolSearch(e.target.value); setFormData({...formData, schoolId: ''}); }} onFocus={() => setShowSchoolDropdown(true)} placeholder="Search for a school..." className="w-full bg-input border border-border rounded-md px-3 py-2" required />
                    {formData.schoolId && schoolSearch && <button type="button" onClick={() => {setSchoolSearch(''); setFormData({...formData, schoolId: ''})}} className="absolute right-2 top-8 text-muted-foreground"><X size={16} /></button>}
                    {showSchoolDropdown && (
                        <div className="absolute z-10 top-full left-0 mt-1 w-full bg-secondary border border-border rounded-md max-h-60 overflow-y-auto">
                           {filteredSchools.length > 0 ? filteredSchools.map(s => (<div key={s._id} onClick={() => handleSelectSchool(s)} className="p-2 hover:bg-accent cursor-pointer">{s.name}</div>)) : <div className="p-2 text-muted-foreground">No schools found</div>}
                        </div>
                    )}
                </div>
                <button 
                    type="submit" 
                    disabled={isCreatingAdmin} 
                    className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                    {isCreatingAdmin ? (
                        <><Loader2 size={18} className="animate-spin" /> Creating...</>
                    ) : (
                        <><PlusCircle size={18} /> Add & Invite Admin</>
                    )}
                </button>
            </form>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-left">
                     <thead className="bg-secondary">
                        <tr>
                            <th className="p-4 font-medium">Admin Name</th>
                            <th className="p-4 font-medium">Email</th>
                            <th className="p-4 font-medium">School</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="5" className="text-center p-8">Loading...</td></tr>}
                        {admins.map(admin => (
                            <tr key={admin._id} className="border-t border-border">
                                <td className="p-4">{admin.displayName || admin.username}</td>
                                <td className="p-4 text-muted-foreground">{admin.email}</td>
                                <td className="p-4">{admin.school?.name || 'N/A'}</td>
                                {/* --- THIS IS THE FIX (Part 2): Improved status display --- */}
                                <td className="p-4 text-sm">
                                    {admin.isVerified 
                                        ? <span className="flex items-center gap-2 text-green-400"><div className="w-2 h-2 rounded-full bg-green-400"></div> Active</span> 
                                        : <span className="flex items-center gap-2 text-yellow-400"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Pending Activation</span>
                                    }
                                </td>
                                <td className="p-4 text-right">
                                    {/* --- THIS IS THE FIX (Part 3): Add conditional resend button --- */}
                                    <div className="flex items-center justify-end gap-4">
                                        {!admin.isVerified && (
                                            <button 
                                                onClick={() => handleResendInvite(admin._id)}
                                                disabled={resendingInviteId === admin._id}
                                                className="text-cyan-400 hover:opacity-75 disabled:opacity-50 disabled:cursor-wait"
                                                title="Resend Activation Invite"
                                            >
                                                {resendingInviteId === admin._id ? (
                                                    <Loader2 size={18} className="animate-spin"/>
                                                ) : (
                                                    <Send size={18} />
                                                )}
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteAdmin(admin._id)} className="text-destructive hover:opacity-75" title="Delete Admin">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageAdmins;