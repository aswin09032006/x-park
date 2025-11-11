// --- /frontend/src/pages/GamesProgressPage.jsx ---
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Search, Star, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { logger } from '../services/logger';

const GamesProgressPage = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('averageRating-desc'); // default sort

    useEffect(() => {
        const context = 'GamesProgressPage.useEffect';
        logger.startNewTrace();
        const fetchGameProgress = async () => {
            try {
                const data = await api('/dashboard/school-game-progress');
                setGames(data);
                logger.info('Fetched school game progress successfully.', { context });
            } catch (err) {
                setError(err.message || 'Failed to fetch game progress.');
                logger.error('Failed to fetch school game progress.', {
                    context,
                    details: { error: err.message },
                });
            } finally {
                setLoading(false);
            }
        };
        fetchGameProgress();
    }, []);

    // --- Combined sorting logic ---
    const handleSort = (key) => {
        const [currentKey, currentDirection] = sortBy.split('-');
        if (key === currentKey) {
            setSortBy(`${key}-${currentDirection === 'asc' ? 'desc' : 'asc'}`);
        } else {
            const defaultDir = ['title', 'category'].includes(key) ? 'asc' : 'desc';
            setSortBy(`${key}-${defaultDir}`);
        }
    };

    const filteredAndSortedGames = useMemo(() => {
        let filtered = games.filter((game) =>
            game.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const [key, direction] = sortBy.split('-');
        filtered.sort((a, b) => {
            let valA = a[key] || 0;
            let valB = b[key] || 0;
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        return filtered;
    }, [games, searchTerm, sortBy]);

    const [sortKey, sortDirection] = sortBy.split('-');

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Game Progress...</div>;
    if (error) return <div className="p-8 text-center text-destructive">Error: {error}</div>;

    return (
        <div className="p-8 text-foreground">
            {/* --- Header with search + dropdown --- */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold self-start md:self-center">Game Progress</h1>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-grow">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search games..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-input border border-border rounded-lg py-1.5 pl-9 pr-4 text-sm"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full md:w-auto bg-input border border-border rounded-lg py-1.5 pl-4 pr-10 text-sm appearance-none focus:outline-none"
                        >
                            <option value="averageRating-desc">Sort by Rating (High-Low)</option>
                            <option value="averageRating-asc">Sort by Rating (Low-High)</option>
                            <option value="attempts-desc">Sort by Attempts (High-Low)</option>
                            <option value="attempts-asc">Sort by Attempts (Low-High)</option>
                            <option value="certificates-desc">Sort by Certificates (High-Low)</option>
                            <option value="certificates-asc">Sort by Certificates (Low-High)</option>
                            <option value="badges-desc">Sort by Badges (High-Low)</option>
                            <option value="badges-asc">Sort by Badges (Low-High)</option>
                            <option value="title-asc">Sort by Title (A-Z)</option>
                            <option value="title-desc">Sort by Title (Z-A)</option>
                            <option value="category-asc">Sort by Category (A-Z)</option>
                            <option value="category-desc">Sort by Category (Z-A)</option>
                        </select>
                        <ChevronDown
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                            size={16}
                        />
                    </div>
                </div>
            </div>

            {/* --- Table with clickable headers --- */}
            <div className="bg-card border border-border rounded-lg overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead className="border-b border-border">
                        <tr>
                            <th
                                onClick={() => handleSort('title')}
                                className="p-4 text-left text-sm font-medium text-muted-foreground cursor-pointer select-none"
                            >
                                <div className="flex items-center gap-2 hover:text-foreground">
                                    Game
                                    {sortKey === 'title' &&
                                        (sortDirection === 'asc' ? (
                                            <ArrowUp size={14} />
                                        ) : (
                                            <ArrowDown size={14} />
                                        ))}
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('category')}
                                className="p-4 text-left text-sm font-medium text-muted-foreground cursor-pointer select-none"
                            >
                                <div className="flex items-center gap-2 hover:text-foreground">
                                    Categories
                                    {sortKey === 'category' &&
                                        (sortDirection === 'asc' ? (
                                            <ArrowUp size={14} />
                                        ) : (
                                            <ArrowDown size={14} />
                                        ))}
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('averageRating')}
                                className="p-4 text-left text-sm font-medium text-muted-foreground cursor-pointer select-none"
                            >
                                <div className="flex items-center gap-2 hover:text-foreground">
                                    Rating
                                    {sortKey === 'averageRating' &&
                                        (sortDirection === 'asc' ? (
                                            <ArrowUp size={14} />
                                        ) : (
                                            <ArrowDown size={14} />
                                        ))}
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('certificates')}
                                className="p-4 text-left text-sm font-medium text-muted-foreground cursor-pointer select-none"
                            >
                                <div className="flex items-center gap-2 hover:text-foreground">
                                    Certificates
                                    {sortKey === 'certificates' &&
                                        (sortDirection === 'asc' ? (
                                            <ArrowUp size={14} />
                                        ) : (
                                            <ArrowDown size={14} />
                                        ))}
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('badges')}
                                className="p-4 text-left text-sm font-medium text-muted-foreground cursor-pointer select-none"
                            >
                                <div className="flex items-center gap-2 hover:text-foreground">
                                    Badges
                                    {sortKey === 'badges' &&
                                        (sortDirection === 'asc' ? (
                                            <ArrowUp size={14} />
                                        ) : (
                                            <ArrowDown size={14} />
                                        ))}
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('attempts')}
                                className="p-4 text-left text-sm font-medium text-muted-foreground cursor-pointer select-none"
                            >
                                <div className="flex items-center gap-2 hover:text-foreground">
                                    Game Attempts
                                    {sortKey === 'attempts' &&
                                        (sortDirection === 'asc' ? (
                                            <ArrowUp size={14} />
                                        ) : (
                                            <ArrowDown size={14} />
                                        ))}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedGames.map((game) => (
                            <tr
                                key={game._id}
                                className="border-b text-lg border-border last:border-b-0 hover:bg-accent/50"
                            >
                                <td className="p-4 font-medium flex items-center gap-3">
                                    <img
                                        src={game.imageUrl}
                                        alt={game.title}
                                        className="w-9 h-9 rounded-md object-cover"
                                    />
                                    {game.title}
                                </td>
                                <td className="p-4 text-muted-foreground">{game.category}</td>
                                <td className="p-4 text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                        <span>
                                            {parseFloat(game.averageRating) > 0
                                                ? game.averageRating
                                                : 'N/A'}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-muted-foreground">{game.certificates}</td>
                                <td className="p-4 text-muted-foreground">{game.badges}</td>
                                <td className="p-4 text-muted-foreground">{game.attempts}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAndSortedGames.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        No games found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
};

export default GamesProgressPage;
