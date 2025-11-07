import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Award, CheckCircle, Gamepad2, Users, Search, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import StudentDetailModal from '../components/StudentDetailModal';
import { getAvatarUrl } from '../utils/avatar';
import { logger } from '../services/logger';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`rounded-lg p-6 text-white`} style={{ backgroundColor: color }}>
        <div className="flex justify-between items-start mb-4">
            <p className="font-medium">{title}</p>
            <div className="bg-white/20 p-2 rounded-full">
                <Icon size={20} />
            </div>
        </div>
        <p className="text-4xl font-bold">{value.toLocaleString()}</p>
    </div>
);

const AdminDashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('score-desc');
    const [filterYearGroup, setFilterYearGroup] = useState('All');
    const [selectedStudent, setSelectedStudent] = useState(null);

    const fetchData = useCallback(async () => {
        const context = 'AdminDashboard.fetchData';
        try {
            const dashboardData = await api('/dashboard/school-admin');
            setData(dashboardData);
            setError(''); 
        } catch (err) {
            logger.error('Failed to fetch admin dashboard data.', { context, details: { error: err.message } });
            if (!data) setError(err.message || 'Failed to fetch dashboard data.');
        } finally {
            if (loading) setLoading(false);
        }
    }, [data, loading]);

    useEffect(() => {
        logger.startNewTrace();
        fetchData();
        const intervalId = setInterval(fetchData, 30000);
        return () => clearInterval(intervalId);
    }, [fetchData]);

    const yearGroupOptions = Array.from({ length: 7 }, (_, i) => i + 7);

    const processedPerformers = useMemo(() => {
        if (!data?.stats?.topPerformers) return [];
        let performers = [...data.stats.topPerformers];
        if (filterYearGroup !== 'All') performers = performers.filter(p => String(p.yearGroup) === filterYearGroup);
        if (searchTerm) performers = performers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const [key, direction] = sortBy.split('-');
        performers.sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        return performers;
    }, [data, searchTerm, sortBy, filterYearGroup]);

    const handleRowClick = (student) => setSelectedStudent(student);
    const handleCloseModal = () => setSelectedStudent(null);

    const handleSort = (newSortKey) => {
        const [currentKey, currentDirection] = sortBy.split('-');
        const newDirection = (newSortKey === currentKey && currentDirection === 'asc') ? 'desc' : 'asc';
        setSortBy(`${newSortKey}-${newDirection}`);
    };

    const SortableHeader = ({ children, columnKey }) => {
        const [currentKey, currentDirection] = sortBy.split('-');
        const isActive = currentKey === columnKey;
        const icon = isActive ? (currentDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />) : null;
        return (
            <th className="p-3 text-left font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleSort(columnKey)}>
                <div className="flex items-center cursor-pointer">{children}{icon}</div>
            </th>
        );
    };

    if (loading) return <div className="text-center text-foreground p-10">Loading Dashboard...</div>;
    if (error && !data) return <div className="text-center text-red-500 p-10">Error: {error}</div>;
    if (!data) return <div className="text-center text-foreground p-10">No dashboard data available.</div>;

    const { schoolName, stats, favoriteGames, topPlayedGames } = data;
    const statCards = [
        { title: 'Registered students', value: stats.registeredStudents, icon: User, color: '#0098db' },
        { title: 'No. of badges earned', value: stats.totalBadges, icon: Award, color: '#ff0061' },
        { title: 'Certificates achieved', value: stats.totalCertificates, icon: CheckCircle, color: '#98cb19' },
        { title: 'Game attempts', value: stats.totalGameAttempts, icon: Gamepad2, color: '#1db083' },
        { title: 'Students with badges', value: stats.studentsWithBadges, icon: Users, color: '#a50093' },
        { title: 'Students with certificates', value: stats.studentsWithCertificates, icon: Users, color: '#00a99f' },
    ];

    return (
        <>
            <div className="p-8 text-foreground grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {statCards.map(card => <StatCard key={card.title} {...card} />)}
                    </div>
                    <div className="bg-card p-6 rounded-lg">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                            <h2 className="text-xl font-bold">Top performers</h2>
                            <div className="flex flex-wrap items-center gap-3 text-sm w-full md:w-auto">
                                <div className="relative flex-grow md:flex-grow-0">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <input type="text" placeholder="Search name..." className="bg-input border border-border rounded-lg py-2 pl-9 pr-3 text-sm w-full md:w-40" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                    <select className="bg-input border border-border rounded-lg py-2 pl-9 pr-3 text-sm appearance-none" value={filterYearGroup} onChange={e => setFilterYearGroup(e.target.value)}>
                                        <option value="All">All Years</option>
                                        {yearGroupOptions.map(year => (<option key={year} value={year}>Year {year}</option>))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <SortableHeader columnKey="name">Name</SortableHeader>
                                        <SortableHeader columnKey="yearGroup">Year Group</SortableHeader>
                                        <SortableHeader columnKey="certificates">Certificates</SortableHeader>
                                        <SortableHeader columnKey="badges">Badges</SortableHeader>
                                        <SortableHeader columnKey="score">Scores</SortableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedPerformers.length > 0 ? (
                                        processedPerformers.map(p => (
                                            <tr key={p._id} className="border-b border-border last:border-b-0 hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => handleRowClick(p)}>
                                                <td className="p-3 flex items-center gap-3 min-w-[150px]">
                                                    <img src={getAvatarUrl({ username: p.name, fullName: p.name })} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                                                    <span className="truncate font-medium">{p.name}</span>
                                                </td>
                                                <td className="p-3 text-muted-foreground">{p.yearGroup || 'N/A'}</td>
                                                <td className="p-3 text-muted-foreground">{p.certificates}</td>
                                                <td className="p-3 text-muted-foreground">{p.badges}</td>
                                                <td className="p-3 font-semibold text-primary">{p.score.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="p-6 text-center text-muted-foreground">No performers found matching your criteria.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <AdminSidebar user={user} schoolName={schoolName} favoriteGames={favoriteGames} topPlayedGames={topPlayedGames} />
            </div>
            <StudentDetailModal isOpen={!!selectedStudent} onClose={handleCloseModal} student={selectedStudent} />
        </>
    );
};

export default AdminDashboard;