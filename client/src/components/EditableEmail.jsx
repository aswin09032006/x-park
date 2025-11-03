import React, { useState, useRef, useEffect } from 'react';
import { AtSign, School, Link, Edit3, Eye, Bold, Italic, Link2, Type, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react';

export const defaultSubject = "Your Invitation to Join XPARK";
// --- THIS IS THE FIX ---
export const defaultBody = `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header with Banner -->
        <div style="background-color: #1a1a1a; text-align: center;">
            <img src="https://res.cloudinary.com/dcjyydmzs/image/upload/v1762106928/WhatsApp_Image_2025-11-02_at_23.25.36_ff066a38_hvxjnb.jpg" alt="XPARK Banner" style="max-width: 100%; height: auto; display: block;" />
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Dear {{studentFirstName}},</h2>
            
            <p style="color: #333; line-height: 1.6; margin: 0 0 16px 0; font-size: 16px;">
                You have been invited by your school administrator at <strong>{{schoolName}}</strong> to join the XPARK platform.
            </p>
            
            <p style="color: #333; line-height: 1.6; margin: 0 0 16px 0; font-size: 16px;">
                XPARK Games helps you explore the world of digital careers through fun, interactive games and discover the future that fits you best.
            </p>
            
            <p style="color: #333; line-height: 1.6; margin: 0 0 24px 0; font-size: 16px;">
                To activate your account and set your password, please click the button below:
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 0 0 24px 0;">
                <a href="{{registrationLink}}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Activate Account</a>
            </div>
            
            <!-- Alternative Link -->
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 16px; margin: 0 0 16px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">
                    If the button above doesn't work, copy and paste this link into your web browser:
                </p>
                <p style="margin: 0; font-size: 13px; word-break: break-all;">
                    <a href="{{registrationLink}}" style="color: #007bff; text-decoration: underline;">{{registrationLink}}</a>
                </p>
            </div>
            
            <!-- Expiry Notice -->
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 0 0 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>Important:</strong> This activation link will expire in 14 days.
                </p>
            </div>
            
            <p style="color: #333; line-height: 1.6; margin: 0 0 16px 0; font-size: 16px;">
                We look forward to welcoming you to XPARK!
            </p>
            
            <p style="color: #333; line-height: 1.6; margin: 0; font-size: 16px;">
                Best regards,<br>
                <strong>The XPARK Games Team</strong>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center; line-height: 1.5;">
                This email was sent by XPARK Games. If you believe you received this email in error, please contact your school administrator.
            </p>
        </div>
    </div>
</div>`;

const EditableEmail = ({ subject, setSubject, body, setBody, studentFirstNamePreview = "[Student's First Name]" }) => {
    const editorRef = useRef(null);
    const [activeTab, setActiveTab] = useState('editor');

    const tags = [
        { name: "Student First Name", value: "{{studentFirstName}}", icon: <AtSign size={16} />, color: "bg-blue-500" },
        { name: "School Name", value: "{{schoolName}}", icon: <School size={16} />, color: "bg-purple-500" },
        { name: "Registration Link", value: "{{registrationLink}}", icon: <Link size={16} />, color: "bg-green-500" },
    ];

    useEffect(() => {
        if (editorRef.current && activeTab === 'editor') {
            editorRef.current.innerHTML = body;
        }
    }, [activeTab]);

    const handleEditorInput = () => {
        if (editorRef.current) {
            setBody(editorRef.current.innerHTML);
        }
    };

    const insertTag = (tagValue) => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        const span = document.createElement('span');
        span.className = 'inline-block px-2 py-0.5 mx-0.5 rounded text-xs font-semibold text-white';
        span.contentEditable = 'false';
        span.textContent = tagValue;
        
        if (tagValue.includes('studentFirstName')) {
            span.style.backgroundColor = '#3b82f6';
        } else if (tagValue.includes('schoolName')) {
            span.style.backgroundColor = '#a855f7';
        } else if (tagValue.includes('registrationLink')) {
            span.style.backgroundColor = '#22c55e';
        }
        
        range.insertNode(span);
        range.setStartAfter(span);
        range.setEndAfter(span);
        selection.removeAllRanges();
        selection.addRange(range);
        
        handleEditorInput();
        editorRef.current?.focus();
    };

    const applyFormat = (command, value = null) => {
        document.execCommand(command, false, value);
        handleEditorInput();
        editorRef.current?.focus();
    };

    const getPreviewHtml = () => {
        let previewBody = body;
        previewBody = previewBody.replace(/{{studentFirstName}}/g, studentFirstNamePreview);
        previewBody = previewBody.replace(/{{schoolName}}/g, '[Your School Name]');
        previewBody = previewBody.replace(/{{registrationLink}}/g, '#');
        return previewBody;
    };

    return (
        <div className="space-y-4 border border-gray-700 rounded-lg p-4 bg-[#222]">
            <div className="flex border-b border-gray-600">
                <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'editor' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <Edit3 size={16} /> Edit Email
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'preview' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <Eye size={16} /> Preview
                </button>
            </div>

            {activeTab === 'editor' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1 font-semibold">Email Subject</label>
                        <input 
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-gray-600 rounded-md p-2 text-white"
                            placeholder="Enter email subject..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2 font-semibold">Email Body</label>
                        
                        {/* Formatting Toolbar */}
                        <div className="bg-[#1a1a1a] border border-gray-600 rounded-t-md p-2 flex items-center gap-1 flex-wrap">
                            {/* Text Formatting */}
                            <button
                                type="button"
                                onClick={() => applyFormat('bold')}
                                className="p-2 hover:bg-gray-700 rounded text-gray-300"
                                title="Bold"
                            >
                                <Bold size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFormat('italic')}
                                className="p-2 hover:bg-gray-700 rounded text-gray-300"
                                title="Italic"
                            >
                                <Italic size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFormat('underline')}
                                className="p-2 hover:bg-gray-700 rounded text-gray-300"
                                title="Underline"
                            >
                                <Underline size={16} />
                            </button>
                            
                            <div className="w-px h-6 bg-gray-600 mx-1"></div>
                            
                            {/* Font Size */}
                            <select
                                onChange={(e) => applyFormat('fontSize', e.target.value)}
                                className="bg-[#2a2a2a] text-gray-300 text-xs px-2 py-1 rounded border border-gray-600 hover:bg-gray-700"
                                defaultValue=""
                            >
                                <option value="" disabled>Font Size</option>
                                <option value="1">Small</option>
                                <option value="3">Normal</option>
                                <option value="5">Large</option>
                                <option value="7">Extra Large</option>
                            </select>
                            
                            {/* Text Color */}
                            <input
                                type="color"
                                onChange={(e) => applyFormat('foreColor', e.target.value)}
                                className="w-8 h-8 rounded border border-gray-600 cursor-pointer"
                                title="Text Color"
                            />
                            
                            {/* Background Color */}
                            <input
                                type="color"
                                onChange={(e) => applyFormat('backColor', e.target.value)}
                                className="w-8 h-8 rounded border border-gray-600 cursor-pointer"
                                title="Highlight"
                            />
                            
                            <div className="w-px h-6 bg-gray-600 mx-1"></div>
                            
                            {/* Alignment */}
                            <button
                                type="button"
                                onClick={() => applyFormat('justifyLeft')}
                                className="p-2 hover:bg-gray-700 rounded text-gray-300"
                                title="Align Left"
                            >
                                <AlignLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFormat('justifyCenter')}
                                className="p-2 hover:bg-gray-700 rounded text-gray-300"
                                title="Align Center"
                            >
                                <AlignCenter size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFormat('justifyRight')}
                                className="p-2 hover:bg-gray-700 rounded text-gray-300"
                                title="Align Right"
                            >
                                <AlignRight size={16} />
                            </button>
                            
                            <div className="w-px h-6 bg-gray-600 mx-1"></div>
                            
                            {/* Lists */}
                            <button
                                type="button"
                                onClick={() => applyFormat('insertUnorderedList')}
                                className="p-2 hover:bg-gray-700 rounded text-gray-300"
                                title="Bullet List"
                            >
                                <List size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFormat('insertOrderedList')}
                                className="p-2 hover:bg-gray-700 rounded text-gray-300"
                                title="Numbered List"
                            >
                                <ListOrdered size={16} />
                            </button>
                            
                            <div className="w-px h-6 bg-gray-600 mx-1"></div>
                            
                            {/* Heading and Link */}
                            <button
                                type="button"
                                onClick={() => applyFormat('formatBlock', 'h2')}
                                className="px-2 py-1 hover:bg-gray-700 rounded text-gray-300 text-sm"
                                title="Heading"
                            >
                                <Type size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const url = prompt('Enter URL:');
                                    if (url) applyFormat('createLink', url);
                                }}
                                className="p-2 hover:bg-gray-700 rounded text-gray-300"
                                title="Add Link"
                            >
                                <Link2 size={16} />
                            </button>
                        </div>

                        {/* Dynamic Tags */}
                        <div className="bg-[#1a1a1a] border-x border-gray-600 p-2 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">Insert:</span>
                            {tags.map(tag => (
                                <button
                                    key={tag.name}
                                    type="button"
                                    onClick={() => insertTag(tag.value)}
                                    className={`flex items-center gap-1.5 ${tag.color} hover:opacity-80 text-white text-xs px-2 py-1 rounded-md transition-opacity`}
                                >
                                    {tag.icon}
                                    {tag.name}
                                </button>
                            ))}
                        </div>

                        {/* Rich Text Editor */}
                        <div
                            ref={editorRef}
                            contentEditable
                            onInput={handleEditorInput}
                            className="w-full bg-white text-black border border-gray-600 rounded-b-md p-4 h-96 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ minHeight: '300px' }}
                        />
                        
                        <p className="text-xs text-gray-500 mt-2">
                            💡 Tip: Use the colored tags above to insert personalized fields. They'll be automatically replaced with each student's information.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'preview' && (
                <div className="space-y-3">
                    <div className="bg-[#1a1a1a] rounded-md p-3">
                        <span className="text-sm text-gray-400 font-semibold">Subject: </span>
                        <span className="text-sm text-white">
                            {subject.replace(/{{studentFirstName}}/g, studentFirstNamePreview).replace(/{{schoolName}}/g, '[Your School Name]')}
                        </span>
                    </div>
                    <div 
                        className="bg-white text-black rounded-md p-6 h-96 overflow-y-auto shadow-lg"
                        dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                    />
                    <p className="text-xs text-gray-400 italic">
                        This is how your email will look when sent to students.
                    </p>
                </div>
            )}
        </div>
    );
};

export default EditableEmail;