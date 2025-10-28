import { Copy } from 'lucide-react';

const InfoField = ({ label, value, canCopy = false }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        // You could add a toast notification here for better UX
    };

    return (
        <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <div className="flex items-center">
                <p className="text-foreground font-medium">{value || 'Not set'}</p>
                {canCopy && value && (
                    <button onClick={handleCopy} className="ml-2 text-muted-foreground hover:text-foreground transition">
                        <Copy size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default InfoField;