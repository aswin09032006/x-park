import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';

const AdminGameCard = ({ game }) => {
    return (
        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
            <img src={game.imageUrl} alt={game.title} className="w-full h-48 object-cover" />
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-card-foreground">{game.title}</h3>
                    <span className={`text-xs font-semibold py-1 px-3 rounded-full ${game.isComingSoon ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                        {game.isComingSoon ? 'Coming Soon' : 'Live'}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">{game.description}</p>
                <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                    <strong>Category:</strong> {game.category}
                </div>
            </div>
        </div>
    );
};

const AdminGamesPage = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const gamesData = await api('/games');
                setGames(gamesData);
            } catch (err) {
                setError(err.message || 'Failed to fetch games.');
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
    }, []);

    // --- NEW: Group games by category using useMemo for efficiency ---
    const gamesByCategory = useMemo(() => {
        return games.reduce((acc, game) => {
            const category = game.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(game);
            return acc;
        }, {});
    }, [games]);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading games...</div>;
    if (error) return <div className="p-8 text-center text-destructive">Error: {error}</div>;

    return (
        <div className="p-8 text-foreground">
            <h1 className="text-3xl font-bold mb-8">Available Games</h1>
            <div className="space-y-12">
                {Object.entries(gamesByCategory).map(([category, gameList]) => (
                    <section key={category}>
                        <h2 className="text-2xl font-semibold mb-6 border-b border-border pb-2">{category}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {gameList.map(game => (
                                <AdminGameCard key={game._id} game={game} />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default AdminGamesPage;