import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Trash2, PlusCircle, ArrowLeft, Edit, Check, X } from 'lucide-react';

const ManageSchools = () => {
    const [schools, setSchools] = useState([]);
    // --- State for form data ---
    const [formData, setFormData] = useState({ name: '', capacity: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [editingSchoolId, setEditingSchoolId] = useState(null);
    const [editingData, setEditingData] = useState({ name: '', capacity: '' });

    const fetchSchools = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api('/superadmin/schools');
            setSchools(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch schools.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchools();
    }, [fetchSchools]);

    const handleCreateSchool = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        try {
            await api('/superadmin/schools', 'POST', { name: formData.name, capacity: formData.capacity });
            setFormData({ name: '', capacity: '' });
            fetchSchools();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDeleteSchool = async (schoolId) => {
        if (!window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) return;
        try {
            await api(`/superadmin/schools/${schoolId}`, 'DELETE');
            fetchSchools();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleEditClick = (school) => {
        setEditingSchoolId(school._id);
        setEditingData({ name: school.name, capacity: school.capacity });
    };

    const handleCancelEdit = () => {
        setEditingSchoolId(null);
    };

    const handleSaveEdit = async (schoolId) => {
        try {
            await api(`/superadmin/schools/${schoolId}`, 'PUT', { name: editingData.name, capacity: editingData.capacity });
            setEditingSchoolId(null);
            fetchSchools();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto text-gray-200">
            <Link to="/superadmin/dashboard" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-8">Manage Schools</h1>

            <form onSubmit={handleCreateSchool} className="mb-8 p-6 bg-card border border-border rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Add a New School</h2>
                <div className="flex gap-4 items-end">
                    <div className="flex-grow">
                        <label className="block text-sm text-muted-foreground mb-1">School Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Enter school name"
                            className="w-full bg-input border border-border rounded-md px-4 py-2"
                            required
                        />
                    </div>
                    <div className="w-32">
                        <label className="block text-sm text-muted-foreground mb-1">Capacity</label>
                        <input
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                            placeholder="e.g., 150" // --- UPDATED ---
                            className="w-full bg-input border border-border rounded-md px-4 py-2"
                        />
                    </div>
                    <button type="submit" className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md flex items-center gap-2 hover:opacity-90">
                        <PlusCircle size={18} /> Add School
                    </button>
                </div>
            </form>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-secondary">
                        <tr>
                            <th className="p-4 font-medium w-3/5">School Name</th>
                            <th className="p-4 font-medium">Capacity</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="3" className="text-center p-8">Loading...</td></tr>}
                        {error && <tr><td colSpan="3" className="text-center p-8 text-destructive">{error}</td></tr>}
                       
                        {schools.map(school => (
                            <tr key={school._id} className="border-t border-border">
                                {editingSchoolId === school._id ? (
                                    <>
                                        <td className="p-2">
                                            <input type="text" value={editingData.name} onChange={e => setEditingData({...editingData, name: e.target.value})} className="bg-input border border-border rounded-md px-2 py-1 w-full" />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" value={editingData.capacity} onChange={e => setEditingData({...editingData, capacity: e.target.value})} className="bg-input border border-border rounded-md px-2 py-1 w-full" />
                                        </td>
                                        <td className="p-2 text-right">
                                            <button onClick={() => handleSaveEdit(school._id)} className="text-green-500 hover:opacity-75 mr-3"><Check size={20} /></button>
                                            <button onClick={handleCancelEdit} className="text-destructive hover:opacity-75"><X size={20} /></button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-4 font-medium">{school.name}</td>
                                        <td className="p-4 text-muted-foreground">{school.capacity}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleEditClick(school)} className="text-muted-foreground hover:text-foreground mr-3"><Edit size={18} /></button>
                                            <button onClick={() => handleDeleteSchool(school._id)} className="text-destructive hover:opacity-75"><Trash2 size={18} /></button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageSchools;
