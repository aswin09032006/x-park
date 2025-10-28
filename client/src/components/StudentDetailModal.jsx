<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { getAvatarUrl } from '../utils/avatar';

const StudentDetailModal = ({ student, isOpen, onClose }) => {
    const [gameData, setGameData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && student) {
            const fetchStudentData = async () => {
                setLoading(true);
                setError('');
                try {
                    const data = await api(`/admin/students/${student._id}/gamedata`);
                    setGameData(data);
                } catch (err) {
                    setError(err.message || 'Failed to load game data.');
                } finally {
                    setLoading(false);
                }
            };
            fetchStudentData();
        }
    }, [isOpen, student]);

    if (!isOpen || !student) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-[#1C1C1C] text-gray-200 rounded-2xl w-full max-w-4xl border border-gray-700 shadow-xl flex overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition z-10"><X size={24} /></button>
                
                {/* Left Panel: Student Info */}
                <div className="w-1/3 bg-[#222]/50 p-8 flex flex-col items-center justify-center text-center border-r border-gray-700">
                    {/* --- THIS IS THE FIX: Use getAvatarUrl for consistency --- */}
                    <img 
                        src={getAvatarUrl({ firstName: student.name, username: student.name })} 
                        alt={student.name} 
                        className="w-28 h-28 rounded-full object-cover mb-4" 
                    />
                    <h2 className="text-2xl font-bold text-white">{student.name}</h2>
                    <p className="text-gray-400">Year Group: {student.yearGroup || 'N/A'}</p>
                </div>

                {/* Right Panel: Game Data */}
                <div className="w-2/3 p-8">
                    {loading && <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>}
                    {error && <div className="text-center text-red-500">{error}</div>}
                    {!loading && !error && (
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-gray-400 border-b border-gray-800">
                                    <th className="p-3 font-medium">Game</th>
                                    <th className="p-3 font-medium">Levels Played</th>
                                    <th className="p-3 font-medium">Certificates</th>
                                    <th className="p-3 font-medium">Badges</th>
                                    <th className="p-3 font-medium">Scores</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gameData.length > 0 ? gameData.map((game, index) => (
                                    <tr key={index} className="border-b border-gray-800 last:border-b-0">
                                        <td className="p-3 font-medium text-white">{game.gameTitle}</td>
                                        <td className="p-3">{game.gamesPlayed}</td>
                                        <td className="p-3">{game.certificates}</td>
                                        <td className="p-3">{game.badges}</td>
                                        <td className="p-3">{game.score}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500">This student has not played any games yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

=======
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { getAvatarUrl } from '../utils/avatar';

const StudentDetailModal = ({ student, isOpen, onClose }) => {
    const [gameData, setGameData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && student) {
            const fetchStudentData = async () => {
                setLoading(true);
                setError('');
                try {
                    const data = await api(`/admin/students/${student._id}/gamedata`);
                    setGameData(data);
                } catch (err) {
                    setError(err.message || 'Failed to load game data.');
                } finally {
                    setLoading(false);
                }
            };
            fetchStudentData();
        }
    }, [isOpen, student]);

    if (!isOpen || !student) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-[#1C1C1C] text-gray-200 rounded-2xl w-full max-w-4xl border border-gray-700 shadow-xl flex overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition z-10"><X size={24} /></button>
                
                {/* Left Panel: Student Info */}
                <div className="w-1/3 bg-[#222]/50 p-8 flex flex-col items-center justify-center text-center border-r border-gray-700">
                    {/* --- THIS IS THE FIX: Use getAvatarUrl for consistency --- */}
                    <img 
                        src={getAvatarUrl({ firstName: student.name, username: student.name })} 
                        alt={student.name} 
                        className="w-28 h-28 rounded-full object-cover mb-4" 
                    />
                    <h2 className="text-2xl font-bold text-white">{student.name}</h2>
                    <p className="text-gray-400">Year Group: {student.yearGroup || 'N/A'}</p>
                </div>

                {/* Right Panel: Game Data */}
                <div className="w-2/3 p-8">
                    {loading && <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>}
                    {error && <div className="text-center text-red-500">{error}</div>}
                    {!loading && !error && (
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-gray-400 border-b border-gray-800">
                                    <th className="p-3 font-medium">Game</th>
                                    <th className="p-3 font-medium">Levels Played</th>
                                    <th className="p-3 font-medium">Certificates</th>
                                    <th className="p-3 font-medium">Badges</th>
                                    <th className="p-3 font-medium">Scores</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gameData.length > 0 ? gameData.map((game, index) => (
                                    <tr key={index} className="border-b border-gray-800 last:border-b-0">
                                        <td className="p-3 font-medium text-white">{game.gameTitle}</td>
                                        <td className="p-3">{game.gamesPlayed}</td>
                                        <td className="p-3">{game.certificates}</td>
                                        <td className="p-3">{game.badges}</td>
                                        <td className="p-3">{game.score}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500">This student has not played any games yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

>>>>>>> a82808b71a06082732bf9b4ec76ae7f852ab2cb3
export default StudentDetailModal;