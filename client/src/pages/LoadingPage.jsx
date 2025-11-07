import React from 'react';
import { Loader2 } from 'lucide-react';
import logo from '/XPLogo.png';

const LoadingPage = () => {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground">
            <img src={logo} alt="XPARK Logo" className="h-10 mb-8 dark:filter-none filter invert" />
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-md text-muted-foreground">Loading Application...</p>
        </div>
    );
};

export default LoadingPage;