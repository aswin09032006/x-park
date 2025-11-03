import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  CheckCircle,
  ShieldAlert,
  Clock,
  Search,
  Upload,
  Plus,
  Trash2,
  Download,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Send
} from 'lucide-react';
import BulkUploadModal from '../components/BulkUploadModal';
import InviteStudentModal from '../components/InviteStudentModal';
import Modal from '../components/Modal';
import { getAvatarUrl } from '../utils/avatar';

const StatCard = ({ title, value, color }) => (
  <div className="bg-[#1C1C1C] border border-gray-800 p-4 rounded-xl shadow-sm">
    <p className="text-sm text-gray-400">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

// --- THIS IS THE FIX: Centralized logic now correctly sums actual certificates ---
const processGameData = (gameData) => {
  if (!gameData) return { certificates: 0, badges: 0, gameAttempts: 0 };
  
  let totalBadges = 0;
  let totalAttempts = 0;
  let totalCertificates = 0;

  for (const progress of Object.values(gameData)) {
    if (progress.badges) {
      totalBadges += Object.keys(progress.badges).length;
    }
    if (progress.completedLevels) {
      totalAttempts += Object.keys(progress.completedLevels).length;
    }
    if (progress.certificates) {
      totalCertificates += Object.keys(progress.certificates).length;
    }
  }

  return { certificates: totalCertificates, badges: totalBadges, gameAttempts: totalAttempts };
};

const ManageUsers = () => {
  const { user } = useAuth();
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [schoolStats, setSchoolStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');

  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isReminderModalOpen, setReminderModalOpen] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [registeredData, pendingData, statsData] = await Promise.all([
        api('/admin/students'),
        api('/admin/pending-students'),
        api('/admin/school-stats')
      ]);
      setRegisteredStudents(registeredData);
      setPendingStudents(pendingData);
      setSchoolStats(statsData);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch student data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResendReminders = async () => {
    setIsSendingReminders(true);
    try {
      const data = await api('/admin/resend-reminders', 'POST');
      alert(data.msg);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSendingReminders(false);
      setReminderModalOpen(false);
    }
  };

  const handleApprove = async (studentId) => {
    if (!window.confirm('Are you sure you want to approve this student?')) return;
    try {
      await api(`/admin/students/${studentId}/approve`, 'PATCH');
      fetchData();
    } catch (err) {
      alert(`Failed to approve student: ${err.message}`);
    }
  };

  const handleRemove = async (studentId) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY remove this student?')) return;
    try {
      await api(`/admin/students/${studentId}`, 'DELETE');
      fetchData();
    } catch (err) {
      alert(`Failed to remove student: ${err.message}`);
    }
  };

  const handleRemovePending = async (inviteId) => {
    if (!window.confirm('Are you sure you want to remove this pending invitation?')) return;
    try {
      await api(`/admin/pending-students/${inviteId}`, 'DELETE');
      fetchData();
    } catch (err) {
      alert(`Failed to remove invitation: ${err.message}`);
    }
  };

  const handleSort = (key) => {
    const [currentKey, currentDirection] = sortBy.split('-');
    if (key === currentKey) {
      setSortBy(`${key}-${currentDirection === 'asc' ? 'desc' : 'asc'}`);
    } else {
      const defaultDirection = key === 'name' ? 'asc' : 'desc';
      setSortBy(`${key}-${defaultDirection}`);
    }
  };

  const combinedList = useMemo(() => {
    const registered = registeredStudents.map(s => ({
      ...s, type: 'registered', gameStats: processGameData(s.gameData),
    }));
    const pending = pendingStudents.map(p => ({
      ...p, type: 'pending', username: p.username || p.email, gameStats: { certificates: 0, badges: 0, gameAttempts: 0 },
    }));
    let fullList = [...registered, ...pending];

    if (searchTerm) {
      fullList = fullList.filter(s =>
        s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    const [sortKey, sortDirection] = sortBy.split('-');
    fullList.sort((a, b) => {
      let valA, valB;
      switch (sortKey) {
        case 'name': valA = a.username.toLowerCase(); valB = b.username.toLowerCase(); break;
        case 'badges': valA = a.gameStats.badges; valB = b.gameStats.badges; break;
        case 'certificates': valA = a.gameStats.certificates; valB = b.gameStats.certificates; break;
        case 'attempts': valA = a.gameStats.gameAttempts; valB = b.gameStats.gameAttempts; break;
        default: return 0;
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return fullList;
  }, [registeredStudents, pendingStudents, searchTerm, sortBy]);

  const SortableHeader = ({ sortKey, children }) => {
    const [currentKey, currentDirection] = sortBy.split('-');
    const isActive = currentKey === sortKey;
    return (
      <th className="p-4 text-left text-sm font-medium text-gray-400">
        <button onClick={() => handleSort(sortKey)} className="flex items-center gap-2 hover:text-white transition-colors">
          {children}
          {isActive ? (
            currentDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
          ) : (<span className="w-[14px]" />)}
        </button>
      </th>
    );
  };

  return (
    <div className="min-h-screen bg-[#111] text-gray-200">
      <main className="p-8">
        <h2 className="text-3xl font-bold text-white mb-6">Manage Students</h2>

        {/* --- Analytics + Actions Header --- */}
        <div className="mb-8 bg-[#1C1C1C] border border-gray-800 rounded-lg p-6 shadow-sm">
          {/* Stats Grid */}
          {schoolStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard title="Total Capacity" value={schoolStats.capacity} color="text-cyan-400" />
              <StatCard title="Registered" value={schoolStats.registered} color="text-green-400" />
              <StatCard title="Not Yet Registered" value={schoolStats.pending} color="text-yellow-400" />
              <StatCard title="Remaining Seats" value={schoolStats.remaining} color="text-gray-400" />
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setReminderModalOpen(true)}
              disabled={pendingStudents.length === 0}
              className="text-sm font-semibold bg-yellow-600 text-white rounded-md py-2.5 px-4 flex items-center gap-2 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap">
              <Send size={16} /> Resend Reminders
            </button>
            <a
              href="/students.csv"
              download
              className="text-sm font-semibold bg-[#222] border border-gray-700 text-gray-200 rounded-md py-2.5 px-4 flex items-center gap-2 hover:bg-gray-700 transition-all whitespace-nowrap">
              <Download size={16} /> CSV Template
            </a>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="text-sm font-semibold bg-[#222] border border-gray-700 text-gray-200 rounded-md py-2.5 px-4 flex items-center gap-2 hover:bg-gray-700 transition-all whitespace-nowrap">
              <Upload size={16} /> Bulk Upload
            </button>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="text-sm font-semibold bg-blue-600 text-white rounded-md py-2.5 px-4 flex items-center gap-2 hover:bg-blue-700 transition-all whitespace-nowrap">
              <Plus size={16} /> Add Student
            </button>
          </div>
        </div>

        {/* --- Search & Sort Bar --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1C1C1C] border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative w-full md:w-auto text-gray-300">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-auto py-2 pl-4 pr-10 text-white bg-[#1C1C1C] border border-gray-700 rounded-lg focus:outline-none appearance-none text-sm">
              <option value="name-asc">Sort by name (A-Z)</option>
              <option value="name-desc">Sort by name (Z-A)</option>
              <option value="badges-desc">Sort by badges (High-Low)</option>
              <option value="badges-asc">Sort by badges (Low-High)</option>
              <option value="certificates-desc">Sort by certificates (High-Low)</option>
              <option value="certificates-asc">Sort by certificates (Low-High)</option>
              <option value="attempts-desc">Sort by attempts (High-Low)</option>
              <option value="attempts-asc">Sort by attempts (Low-High)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
          </div>
        </div>

        {/* --- Table --- */}
        <div className="bg-[#1C1C1C] border border-gray-800 rounded-lg overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-gray-800">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-gray-400 w-2/5">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-2 hover:text-white transition-colors">
                    Student name
                    {sortBy.startsWith('name')
                      ? (sortBy.endsWith('asc') ? <ArrowUp size={14} /> : <ArrowDown size={14} />)
                      : (<span className="w-[14px]" />)}
                  </button>
                </th>
                <SortableHeader sortKey="certificates">Certificates</SortableHeader>
                <SortableHeader sortKey="badges">Badges</SortableHeader>
                <SortableHeader sortKey="attempts">Game attempts</SortableHeader>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="text-center p-8 text-gray-400">Loading student data...</td></tr>}
              {error && <tr><td colSpan="7" className="text-center p-8 text-red-500">{error}</td></tr>}
              {!loading && combinedList.map(student => (
                <tr key={student._id} className="border-b border-gray-800 last:border-b-0 hover:bg-gray-800/50">
                  <td className="p-4 font-medium flex items-center gap-3">
                    <img src={getAvatarUrl(student)} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                    {student.username}
                  </td>
                  {student.type === 'registered' ? (
                    <>
                      <td className="p-4 text-gray-300">{student.gameStats.certificates}</td>
                      <td className="p-4 text-gray-300">{student.gameStats.badges}</td>
                      <td className="p-4 text-gray-300">{student.gameStats.gameAttempts}</td>
                      <td className="p-4">
                        {student.isApproved ? (
                          <span className="flex items-center gap-2 text-green-400 text-xs font-medium">
                            <CheckCircle size={14} /> Registered
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-yellow-400 text-xs font-medium">
                            <ShieldAlert size={14} /> Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {!student.isApproved && (
                            <button onClick={() => handleApprove(student._id)} className="text-xs bg-blue-600 text-white font-semibold py-1 px-2 rounded hover:bg-blue-700">
                              Approve
                            </button>
                          )}
                          <button onClick={() => handleRemove(student._id)} className="text-red-500 hover:text-red-400">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td colSpan="3" className="p-4 text-gray-500 italic">
                        User has not completed registration.
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                          <Clock size={14} /> Not registered yet
                        </span>
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleRemovePending(student._id)} className="text-red-500 hover:text-red-400">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <BulkUploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} onSuccess={fetchData} />
      <InviteStudentModal isOpen={isInviteModalOpen} onClose={() => setInviteModalOpen(false)} onSuccess={fetchData} />

      <Modal isOpen={isReminderModalOpen} onClose={() => setReminderModalOpen(false)} title="Confirm Reminders">
        <p className="text-gray-300 mb-6">
          You are about to send registration reminders to{' '}
          <span className="font-bold text-yellow-400">{pendingStudents.length}</span> unregistered student(s).
          Are you sure you want to continue?
        </p>
        <div className="flex justify-end gap-4">
          <button onClick={() => setReminderModalOpen(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">
            Cancel
          </button>
          <button
            onClick={handleResendReminders}
            disabled={isSendingReminders}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
            {isSendingReminders ? 'Sending...' : 'Yes, Send Reminders'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageUsers;