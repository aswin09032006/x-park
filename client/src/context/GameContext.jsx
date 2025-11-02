import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const GameContext = createContext();
export const useGames = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // --- SAVED GAMES (BOOKMARKS) ---
    const [savedGames, setSavedGames] = useState([]);
    // --- PLAYED GAMES (HISTORY) ---
    const [playedGames, setPlayedGames] = useState([]);

    const fetchSavedGames = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const gamesData = await api('/users/me/saved-games');
            setSavedGames(gamesData);
        } catch (error) {
            console.error("Failed to fetch saved games:", error);
        }
    }, [isAuthenticated]);

    // --- THIS IS THE FIX: Fetch played games from the new endpoint ---
    const fetchPlayedGames = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const gamesData = await api('/users/me/played-games');
            setPlayedGames(gamesData);
        } catch (error) {
            console.error("Failed to fetch played games:", error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSavedGames();
            fetchPlayedGames();
        } else {
            setSavedGames([]);
            setPlayedGames([]);
        }
    }, [isAuthenticated, fetchSavedGames, fetchPlayedGames]);
    
    const saveGame = async (game) => {
        try {
            setSavedGames((prev) => {
                if (prev.find(g => g._id === game._id)) return prev;
                return [...prev, game];
            });
            await api('/users/me/saved-games', 'POST', { gameId: game._id });
        } catch (error) {
            console.error("Failed to save game:", error);
            setSavedGames((prev) => prev.filter((g) => g._id !== game._id));
        }
    };
    
    const unsaveGame = async (gameId) => {
        const originalState = savedGames;
        try {
            setSavedGames((prev) => prev.filter((game) => game._id !== gameId));
            await api(`/users/me/saved-games/${gameId}`, 'DELETE');
        } catch (error) {
            console.error("Failed to unsave game:", error);
            setSavedGames(originalState);
        }
    };

    const isGameSaved = (gameId) => !!savedGames.find(game => game._id === gameId);

    // --- GAME PROGRESS STATE (remains in localStorage) ---
    const [gameProgress, setGameProgress] = useState(() => {
        try {
            const items = window.localStorage.getItem('gameProgress');
            return items ? JSON.parse(items) : {};
        } catch (error) {
            return {};
        }
    });
    
    const activeTimers = useRef({});

    useEffect(() => {
        window.localStorage.setItem('gameProgress', JSON.stringify(gameProgress));
    }, [gameProgress]);

    const updateGameProgress = (gameId, newProgress) => {
        setGameProgress(prev => ({ ...prev, [gameId]: Math.min(newProgress, 100) }));
    };

    // --- THIS IS THE FIX: startGame now updates the `playedGames` list via the API ---
    const startGame = async (game) => {
        if (!game || !game._id) return;
        const gameId = game._id;

        // Add to played games list if it's not already there
        if (!playedGames.some(p => p._id === gameId)) {
            try {
                // Optimistic update
                setPlayedGames(prev => [...prev, game]);
                await api('/users/me/played-games', 'POST', { gameId });
            } catch (error) {
                console.error("Failed to add to played games:", error);
                // Revert on failure
                setPlayedGames(prev => prev.filter(p => p._id !== gameId));
            }
        }

        // --- The rest of the function remains the same ---
        if (gameProgress[gameId] === undefined) {
            updateGameProgress(gameId, 0);
        }
        if (activeTimers.current[gameId]) clearInterval(activeTimers.current[gameId]);

        activeTimers.current[gameId] = setInterval(() => {
            setGameProgress(currentProgress => {
                const progress = currentProgress[gameId] || 0;
                if (progress >= 100) {
                    clearInterval(activeTimers.current[gameId]);
                    delete activeTimers.current[gameId];
                    return currentProgress;
                }
                const newProgress = progress + 5;
                return { ...currentProgress, [gameId]: Math.min(newProgress, 100) };
            });
        }, 2000);
    };

    const stopGame = (gameId) => {
        if (activeTimers.current[gameId]) {
            clearInterval(activeTimers.current[gameId]);
            delete activeTimers.current[gameId];
        }
    };
    
    const isGameInProgress = (gameId) => gameProgress[gameId] !== undefined;
    const getGameProgress = (gameId) => gameProgress[gameId] || 0;

    useEffect(() => {
        const timers = activeTimers.current;
        return () => { Object.values(timers).forEach(clearInterval); };
    }, []);

    const value = {
        savedGames,
        playedGames, // <-- Export new state
        saveGame,
        unsaveGame,
        isGameSaved,
        gameProgress,
        startGame,
        stopGame,
        updateGameProgress,
        isGameInProgress,
        getGameProgress,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};