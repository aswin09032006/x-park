import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';

const GamesProgressPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('badges-desc'); // default sort

  // Fetch game progress
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

  // Toggle sorting direction or switch column
  const handleSort = (key) => {
    const [currentKey, currentDirection] = sortBy.split('-');
    if (key === currentKey) {
      setSortBy(`${key}-${currentDirection === 'asc' ? 'desc' : 'asc'}`);
    } else {
      // default sorting: A–Z for text, High–Low for numbers
      const defaultDir = ['title', 'category'].includes(key) ? 'asc' : 'desc';
      setSortBy(`${key}-${defaultDir}`);
    }
  };

  // Filter and sort logic
  const filteredAndSortedGames = useMemo(() => {
    let filtered = games.filter((game) =>
      game.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [key, direction] = sortBy.split('-');

    filtered.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

      // Numeric vs text comparison
      if (['badges', 'certificates', 'attempts'].includes(key)) {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [games, searchTerm, sortBy]);

  const [sortKey, sortDirection] = sortBy.split('-');

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading Game Progress...
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-destructive">Error: {error}</div>
    );

  return (
    <div className="p-8 text-foreground">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Game List</h1>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 bg-[#222] border border-gray-700 rounded-lg py-1.5 pl-9 pr-4 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1C1C1C] border border-gray-800 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="border-b border-gray-800">
            <tr>
              {/* Game */}
              <th
                onClick={() => handleSort('title')}
                className="p-4 text-left text-sm font-medium text-gray-400 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 hover:text-white">
                  Game
                  {sortKey === 'title' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp size={14} />
                    ) : (
                      <ArrowDown size={14} />
                    ))}
                </div>
              </th>

              {/* Categories */}
              <th
                onClick={() => handleSort('category')}
                className="p-4 text-left text-sm font-medium text-gray-400 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 hover:text-white">
                  Categories
                  {sortKey === 'category' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp size={14} />
                    ) : (
                      <ArrowDown size={14} />
                    ))}
                </div>
              </th>

              {/* Certificates */}
              <th
                onClick={() => handleSort('certificates')}
                className="p-4 text-left text-sm font-medium text-gray-400 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 hover:text-white">
                  Certificates
                  {sortKey === 'certificates' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp size={14} />
                    ) : (
                      <ArrowDown size={14} />
                    ))}
                </div>
              </th>

              {/* Badges */}
              <th
                onClick={() => handleSort('badges')}
                className="p-4 text-left text-sm font-medium text-gray-400 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 hover:text-white">
                  Badges
                  {sortKey === 'badges' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp size={14} />
                    ) : (
                      <ArrowDown size={14} />
                    ))}
                </div>
              </th>

              {/* Game Attempts */}
              <th
                onClick={() => handleSort('attempts')}
                className="p-4 text-left text-sm font-medium text-gray-400 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 hover:text-white">
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
                className="border-b text-lg border-gray-800 last:border-b-0 hover:bg-gray-800/50"
              >
                <td className="p-4 font-medium flex items-center gap-3">
                  <img
                    src={game.imageUrl}
                    alt={game.title}
                    className="w-9 h-9 rounded-md object-cover"
                  />
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
          <div className="text-center p-8 text-gray-500">
            No games found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default GamesProgressPage;
