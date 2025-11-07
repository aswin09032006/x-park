import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { CheckCircle, ShieldAlert, Clock, Search, Upload, Plus, Trash2, Download, ArrowUp, ArrowDown, ChevronDown, Send } from 'lucide-react';
import BulkUploadModal from '../components/BulkUploadModal';
import InviteStudentModal from '../components/InviteStudentModal';
import Modal from '../components/Modal';
import { getAvatarUrl } from '../utils/avatar';
import { logger } from '../services/logger';

const StatCard = ({ title, value, color }) => (
  <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

const processGameData = (gameData) => {
  if (!gameData) return { certificates: 0, badges: 0, gameAttempts: 0 };
  let totalBadges = 0, totalAttempts = 0, totalCertificates = 0;
  for (const progress of Object.values(gameData)) {
    if (progress.badges) totalBadges += Object.keys(progress.badges).length;
    if (progress.completedLevels) totalAttempts += Object.keys(progress.completedLevels).length;
    if (progress.certificates) totalCertificates += Object.keys(progress.certificates).length;
  }
  return { certificates: totalCertificates, badges: totalBadges, gameAttempts: totalAttempts };
};

const ManageUsers = () => {
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
    const context = 'ManageUsers.fetchData';
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
      logger.info('Fetched user management data successfully.', { context });
    } catch (err) {
      setError(err.message || 'Failed to fetch student data.');
      logger.error('Failed to fetch user management data.', { context, details: { error: err.message } });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    logger.startNewTrace();
    fetchData();
  }, [fetchData]);

  const handleResendReminders = async () => {
    const context = 'ManageUsers.handleResendReminders';
    logger.startNewTrace();
    setIsSendingReminders(true);
    logger.info(`Attempting to resend reminders to ${pendingStudents.length} students.`, { context });
    try {
      const data = await api('/admin/resend-reminders', 'POST');
      alert(data.msg);
      logger.success('Reminders resent successfully.', { context });
    } catch (err) {
      alert(`Error: ${err.message}`);
      logger.error('Failed to resend reminders.', { context, details: { error: err.message } });
    } finally {
      setIsSendingReminders(false);
      setReminderModalOpen(false);
    }
  };

  const handleAction = async (action, id, type) => {
    const context = `ManageUsers.${action}`;
    logger.startNewTrace();
    const confirmMsg = action === 'approve' ? 'approve this student?' : `PERMANENTLY remove this ${type}?`;
    if (!window.confirm(`Are you sure you want to ${confirmMsg}`)) return;

    logger.warn(`Attempting to ${action} ${type}.`, { context, details: { id } });
    try {
      if (action === 'approve') await api(`/admin/students/${id}/approve`, 'PATCH');
      else if (type === 'student') await api(`/admin/students/${id}`, 'DELETE');
      else if (type === 'invitation') await api(`/admin/pending-students/${id}`, 'DELETE');
      fetchData();
      logger.success(`${type} ${action}d successfully.`, { context, details: { id } });
    } catch (err) {
      alert(`Failed to ${action} ${type}: ${err.message}`);
      logger.error(`Failed to ${action} ${type}.`, { context, details: { id, error: err.message } });
    }
  };

  const combinedList = useMemo(() => {
    const registered = registeredStudents.map(s => ({ ...s, type: 'registered', gameStats: processGameData(s.gameData) }));
    const pending = pendingStudents.map(p => ({ ...p, type: 'pending', username: p.username || p.email, gameStats: { certificates: 0, badges: 0, gameAttempts: 0 } }));
    let fullList = [...registered, ...pending];

    if (searchTerm) fullList = fullList.filter(s => s.username.toLowerCase().includes(searchTerm.toLowerCase()) || (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const [sortKey, sortDirection] = sortBy.split('-');
    fullList.sort((a, b) => {
      let valA, valB;
      switch(sortKey) {
        case 'name': valA = a.username.toLowerCase(); valB = b.username.toLowerCase(); break;
        default: valA = a.gameStats[sortKey]; valB = b.gameStats[sortKey];
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
      <th className="p-4 text-left text-sm font-medium text-muted-foreground">
        <button onClick={() => setSortBy(`${sortKey}-${isActive && currentDirection === 'desc' ? 'asc' : 'desc'}`)} className="flex items-center gap-2 hover:text-foreground transition-colors">
          {children}
          {isActive ? (currentDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <span className="w-[14px]" />}
        </button>
      </th>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="p-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">Manage Students</h2>
        <div className="mb-8 bg-card border border-border rounded-lg p-6 shadow-sm">
          {schoolStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard title="Total Capacity" value={schoolStats.capacity} color="text-cyan-400" />
              <StatCard title="Registered" value={schoolStats.registered} color="text-green-400" />
              <StatCard title="Not Yet Registered" value={schoolStats.pending} color="text-yellow-400" />
              <StatCard title="Remaining Seats" value={schoolStats.remaining} color="text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setReminderModalOpen(true)} disabled={pendingStudents.length === 0} className="text-sm font-semibold bg-yellow-600 text-white rounded-md py-2.5 px-4 flex items-center gap-2 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"><Send size={16} /> Resend Reminders</button>
            <a href="/students.csv" download className="text-sm font-semibold bg-secondary border border-border text-secondary-foreground rounded-md py-2.5 px-4 flex items-center gap-2 hover:bg-accent transition-all whitespace-nowrap"><Download size={16} /> CSV Template</a>
            <button onClick={() => setUploadModalOpen(true)} className="text-sm font-semibold bg-secondary border border-border text-secondary-foreground rounded-md py-2.5 px-4 flex items-center gap-2 hover:bg-accent transition-all whitespace-nowrap"><Upload size={16} /> Bulk Upload</button>
            <button onClick={() => setInviteModalOpen(true)} className="text-sm font-semibold bg-blue-600 text-white rounded-md py-2.5 px-4 flex items-center gap-2 hover:bg-blue-700 transition-all whitespace-nowrap"><Plus size={16} /> Add Student</button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input type="text" placeholder="Search by name or email" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-input border border-border rounded-lg py-2 pl-10 pr-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="relative w-full md:w-auto text-muted-foreground">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full md:w-auto py-2 pl-4 pr-10 text-foreground bg-input border border-border rounded-lg focus:outline-none appearance-none text-sm">
              <option value="name-asc">Sort by name (A-Z)</option>
              <option value="name-desc">Sort by name (Z-A)</option>
              <option value="badges-desc">Sort by badges (High-Low)</option>
              <option value="badges-asc">Sort by badges (Low-High)</option>
              <option value="certificates-desc">Sort by certificates (High-Low)</option>
              <option value="certificates-asc">Sort by certificates (Low-High)</option>
              <option value="attempts-desc">Sort by attempts (High-Low)</option>
              <option value="attempts-asc">Sort by attempts (Low-High)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={20} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-border">
              <tr>
                <SortableHeader sortKey="name">Student name</SortableHeader>
                <SortableHeader sortKey="certificates">Certificates</SortableHeader>
                <SortableHeader sortKey="badges">Badges</SortableHeader>
                <SortableHeader sortKey="attempts">Game attempts</SortableHeader>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="text-center p-8 text-muted-foreground">Loading student data...</td></tr> : error ? <tr><td colSpan="6" className="text-center p-8 text-red-500">{error}</td></tr> : combinedList.map(student => (
                <tr key={student._id} className="border-b border-border last:border-b-0 hover:bg-accent/50">
                  <td className="p-4 font-medium flex items-center gap-3"><img src={getAvatarUrl(student)} alt="avatar" className="w-8 h-8 rounded-full object-cover" />{student.username}</td>
                  {student.type === 'registered' ? (
                    <>
                      <td className="p-4 text-muted-foreground">{student.gameStats.certificates}</td>
                      <td className="p-4 text-muted-foreground">{student.gameStats.badges}</td>
                      <td className="p-4 text-muted-foreground">{student.gameStats.gameAttempts}</td>
                      <td className="p-4">
                        {student.isApproved ? <span className="flex items-center gap-2 text-green-400 text-xs font-medium"><CheckCircle size={14} /> Registered</span> : <span className="flex items-center gap-2 text-yellow-400 text-xs font-medium"><ShieldAlert size={14} /> Pending Approval</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {!student.isApproved && <button onClick={() => handleAction('approve', student._id, 'student')} className="text-xs bg-blue-600 text-white font-semibold py-1 px-2 rounded hover:bg-blue-700">Approve</button>}
                          <button onClick={() => handleAction('remove', student._id, 'student')} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td colSpan="3" className="p-4 text-muted-foreground italic">User has not completed registration.</td>
                      <td className="p-4"><span className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><Clock size={14} /> Not registered yet</span></td>
                      <td className="p-4"><button onClick={() => handleAction('remove', student._id, 'invitation')} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button></td>
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
        <p className="text-muted-foreground mb-6">You are about to send registration reminders to <span className="font-bold text-yellow-400">{pendingStudents.length}</span> unregistered student(s). Are you sure?</p>
        <div className="flex justify-end gap-4">
          <button onClick={() => setReminderModalOpen(false)} className="bg-secondary hover:bg-accent font-bold py-2 px-4 rounded-md">Cancel</button>
          <button onClick={handleResendReminders} disabled={isSendingReminders} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">{isSendingReminders ? 'Sending...' : 'Yes, Send Reminders'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageUsers;