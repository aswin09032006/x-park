import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Video, Target, FileText } from 'lucide-react';
import { getAvatarUrl } from '../utils/avatar';

const UserSidebar = () => {
    const { user } = useAuth();

    if (!user) {
        return (
            <aside className="w-80 flex-shrink-0 bg-card text-card-foreground p-6 rounded-lg self-start">
                <p className="text-center text-muted-foreground">Loading user...</p>
            </aside>
        );
    }

    console.log("User object from AuthContext:", user);
    console.log("Is nickname coming? user.nickname:", user.nickname);
    
    const infoLinks = [
        { icon: Video, text: "Videos", count: 0, iconColor: "text-pink-500" },
        { icon: Target, text: "Competitions", count: 0, iconColor: "text-green-500" },
        { icon: FileText, text: "Projects", count: 0, iconColor: "text-blue-500" },
    ];

    const InfoLink = ({ icon: Icon, text, count, iconColor }) => (
        <a href="#" className="flex items-center justify-between p-3 bg-secondary hover:bg-accent rounded-lg transition-colors">
            <div className="flex items-center">
                <Icon className={`${iconColor} mr-3`} size={20} />
                <span className="font-medium text-secondary-foreground">{text}</span>
            </div>
            <span className="bg-cyan-500 text-black text-xs font-bold px-2 py-1 rounded-full">{count}</span>
        </a>
    );

    // --- THIS IS THE FIX: Construct full name as a fallback ---
    const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

    return (
        <aside className="w-80 flex-shrink-0 bg-card text-card-foreground p-6 rounded-lg self-start">
            <div className="flex flex-col items-center text-center">
                <img src={getAvatarUrl(user)} alt="User Avatar" className="w-24 h-24 rounded-full object-cover mb-4" />
                {/* --- THIS IS THE FIX: Prioritize nickname, use full name as fallback, remove displayName --- */}
                <h2 className="text-xl font-bold">{user.nickname || userFullName || user.username}</h2>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                <p className="text-muted-foreground text-sm mt-1">{user.yearGroup ? `Year Group: ${user.yearGroup}` : 'Year Group: Not Set'}</p>
                <p className="text-muted-foreground text-sm">{user.school?.name || 'School: Not Set'}</p>
            </div>
            <div className="mt-8 space-y-3">
                {infoLinks.map(link => <InfoLink key={link.text} {...link} />)}
            </div>
        </aside>
    );
};

export default UserSidebar;