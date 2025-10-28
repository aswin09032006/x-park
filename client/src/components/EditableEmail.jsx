import React, { useState, useRef } from 'react';
import { AtSign, School, Link as LinkIcon, Edit3, Eye } from 'lucide-react';

// Default templates are defined here for frontend initialization
export const defaultSubject = "Your Invitation to Join XPARK";
export const defaultBody = `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <h2 style="color: #2c3e50;">Dear {{studentFirstName}},</h2>
    <p>You have been invited by your administrator at <strong>{{schoolName}}</strong> to join the XPARK platform.</p>
    <p>To activate your account and set your password, please click the button below:</p>
    <a href="{{registrationLink}}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Activate Account</a>
    <p style="margin-top: 20px; font-size: 12px; color: #777;">
        If the button above does not work, please copy and paste the following link into your web browser:<br>
        <a href="{{registrationLink}}">{{registrationLink}}</a>
    </p>
    <p style="font-size: 12px; color: #777;">Please note: This link will expire in 14 days.</p>
    <p style="margin-top: 20px;">We look forward to welcoming you to XPARK.</p>
    <p style="margin-top: 10px;">Best regards,<br><strong>The XPARK Team</strong></p>
</div>`;


const EditableEmail = ({ subject, setSubject, body, setBody, studentFirstNamePreview = "[Student's First Name]" }) => {
    const bodyRef = useRef(null);
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'preview'

    const tags = [
        { name: "Student First Name", value: "{{studentFirstName}}", icon: <AtSign size={16} /> },
        { name: "School Name", value: "{{schoolName}}", icon: <School size={16} /> },
        { name: "Registration Link", value: "{{registrationLink}}", icon: <LinkIcon size={16} /> },
    ];

    const insertTag = (tag) => {
        const textarea = bodyRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = text.substring(0, start) + tag + text.substring(end);
        
        setBody(newText);
        
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + tag.length;
        }, 0);
    };

    // --- Function to generate the preview HTML ---
    const getPreviewHtml = () => {
        let previewBody = body;
        previewBody = previewBody.replace(/{{studentFirstName}}/g, studentFirstNamePreview);
        previewBody = previewBody.replace(/{{schoolName}}/g, '[Your School Name]');
        previewBody = previewBody.replace(/{{registrationLink}}/g, '#'); // Use a dummy link for preview
        return previewBody;
    };

    return (
        <div className="space-y-4 border border-gray-700 rounded-lg p-4 bg-[#222]">
            {/* --- TABS for Editor and Preview --- */}
            <div className="flex border-b border-gray-600">
                <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'editor' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <Edit3 size={16} /> Editor
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'preview' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <Eye size={16} /> Preview
                </button>
            </div>

            {/* --- Conditional rendering based on active tab --- */}
            {activeTab === 'editor' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1 font-semibold">Email Subject</label>
                        <input 
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-gray-600 rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2 font-semibold">Email Body</label>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs text-gray-500 mr-2">Insert Tag:</span>
                            {tags.map(tag => (
                                <button
                                    key={tag.name}
                                    type="button"
                                    onClick={() => insertTag(tag.value)}
                                    className="flex items-center gap-1.5 bg-gray-700/80 hover:bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-md"
                                >
                                    {tag.icon}
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                        <textarea
                            ref={bodyRef}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-gray-600 rounded-md p-3 h-80 font-mono text-xs"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            You can use HTML for formatting. The tags will be replaced automatically for each student.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'preview' && (
                <div className="space-y-3">
                     <div>
                        <span className="text-sm text-gray-400 font-semibold">Subject: </span>
                        <span className="text-sm text-white">{subject.replace(/{{studentFirstName}}/g, studentFirstNamePreview).replace(/{{schoolName}}/g, '[Your School Name]')}</span>
                    </div>
                    <div 
                        className="bg-white text-black rounded-md p-4 h-96 overflow-y-auto"
                        // It's safe to use here because the HTML is controlled by the admin in the same session
                        dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                    />
                </div>
            )}
        </div>
    );
};

export default EditableEmail;