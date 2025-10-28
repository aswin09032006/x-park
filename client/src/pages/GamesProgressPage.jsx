import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Search, ChevronDown, ListFilter } from 'lucide-react';

const GamesProgressPage = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('badges-desc');

    useEffect(() => {
        const fetchGameProgress = async () => {
            try {
                const data = await api('/dashboard/school-game-progress');
                setGames(data);
            } catch (err) {
                setError(err.message || 'Failed to fetch game progress.');
            } finally {
                setLoading(false);
            }
        };
        fetchGameProgress();
    }, []);

    const filteredAndSortedGames = useMemo(() => {
        let filtered = games.filter(game =>
            game.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const [key, direction] = sortBy.split('-');
        filtered.sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [games, searchTerm, sortBy]);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Game Progress...</div>;
    if (error) return <div className="p-8 text-center text-destructive">Error: {error}</div>;

    return (
        <div className="p-8 text-foreground">
            <div className="mb-6 ">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Game list</h1>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-64 bg-[#222] border border-gray-700 rounded-lg py-1.5 pl-9 pr-4 text-sm"
                            />
                        </div>
                         <div className="relative">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="bg-[#222] border border-gray-700 rounded-lg py-1.5 pl-3 pr-8 text-sm appearance-none"
                            >
                                <option value="badges-desc">Sort by badges</option>
                                <option value="certificates-desc">Sort by certificates</option>
                                <option value="attempts-desc">Sort by game attempts</option>
                                <option value="title-asc">Sort by name (A-Z)</option>
                            </select>
                             <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#1C1C1C] border border-gray-800 rounded-lg overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead className="border-b border-gray-800">
                        <tr>
                            {/* --- REMOVED CHECKBOX HEADER --- */}
                            <th className="p-4 text-left text-sm font-medium text-gray-400 w-2/5">Game</th>
                            <th className="p-4 text-left text-sm font-medium text-gray-400">Categories</th>
                            <th className="p-4 text-left text-sm font-medium text-gray-400">Certificates</th>
                            <th className="p-4 text-left text-sm font-medium text-gray-400">Badges</th>
                            <th className="p-4 text-left text-sm font-medium text-gray-400">Game attempts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedGames.map(game => (
                            <tr key={game._id} className="border-b text-lg border-gray-800 last:border-b-0 hover:bg-gray-800/50">
                                {/* --- REMOVED CHECKBOX CELL --- */}
                                <td className="p-4 font-medium flex items-center gap-3">
                                    <img src={game.imageUrl} alt={game.title} className="w-9 h-9 rounded-md object-cover" />
                                    {game.title}
                                </td>
                                <td className="p-4 text-gray-300">{game.category}</td>
                                <td className="p-4 text-gray-300">{game.certificates}</td>
                                <td className="p-4 text-gray-300">{game.badges}</td>
                                <td className="p-4 text-gray-300">{game.attempts}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredAndSortedGames.length === 0 && (
                    <div className="text-center p-8 text-gray-500">No games found matching your criteria.</div>
                )}
            </div>
        </div>
    );
};

export default GamesProgressPage;