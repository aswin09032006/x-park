import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, UserCog } from 'lucide-react';

const SuperAdminDashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="p-8 max-w-4xl mx-auto">
                <h2 className="text-2xl font-semibold mb-8">System Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Manage Schools Card */}
                    <Link to="/superadmin/schools" className="block p-6 bg-card hover:bg-secondary border border-border rounded-lg transition-colors">
                        <div className="flex items-center gap-4">
                            <Building className="w-10 h-10 text-primary" />
                            <div>
                                <h3 className="text-lg font-bold">Manage Schools</h3>
                                <p className="text-sm text-muted-foreground">Add, view, or remove schools from the platform.</p>
                            </div>
                        </div>
                    </Link>

                    {/* Manage Admins Card */}
                    <Link to="/superadmin/admins" className="block p-6 bg-card hover:bg-secondary border border-border rounded-lg transition-colors">
                        <div className="flex items-center gap-4">
                            <UserCog className="w-10 h-10 text-cyan-400" />
                            <div>
                                <h3 className="text-lg font-bold">Manage School Admins</h3>
                                <p className="text-sm text-muted-foreground">Create or remove school administrator accounts.</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default SuperAdminDashboard;