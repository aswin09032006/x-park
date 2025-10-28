import React from 'react';

const EditField = ({ label, name, value, onChange, type = 'text', placeholder = '' }) => {
    return (
        <div className="mb-6">
            <label htmlFor={name} className="block text-sm text-muted-foreground mb-2">{label}</label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                className="w-full px-4 py-3 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
        </div>
    );
};

export default EditField;