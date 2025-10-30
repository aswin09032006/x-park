import { useEffect } from 'react';
import { useGames } from '../context/GameContext'; // <-- Import the context hook

const CyberSecurityGame = () => {
    const { stopGame } = useGames(); // <-- Get the stopGame function

    // <-- FIX 2: Add a cleanup effect to stop the game progress timer ---
    useEffect(() => {
        // This function will run when the component is unmounted (e.g., user navigates away)
        return () => {
            // '1' is the hardcoded ID for "Network Shield" from MyGames.jsx
            // In a real app, you might get this ID from the URL
            stopGame('1'); 
        };
    }, [stopGame]); // Dependency array ensures this runs correctly

    return (
        <div className="w-full h-full overflow-hidden bg-background">
            <a 
                href="/dashboard" 
                className="absolute top-4 left-4 z-50 text-white font-light py-2 px-4 rounded-md transition"
            >
                &larr; Back to Dashboard
            </a>
            <iframe
                src="/cyber-security-game/index.html"
                title="Cybersecurity Game"
                style={{
                    border: 'none',
                    width: '100%',
                    height: '100%',
                }}
                allow="fullscreen"
            ></iframe>
        </div>
    );
};

export default CyberSecurityGame;