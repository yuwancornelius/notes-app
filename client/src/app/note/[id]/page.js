'use client';

import { useAuth } from '@/store/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import PasswordModal from '@/components/PasswordModal';
import { formatDate } from '@/utils/formatDate';
import api from '@/services/api';

export default function NoteDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const noteId = params.id;

    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isFav, setIsFav] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editVisibility, setEditVisibility] = useState('public');
    const [editPassword, setEditPassword] = useState('');
    const [editConfirmPassword, setEditConfirmPassword] = useState('');
    const [editOldPassword, setEditOldPassword] = useState('');
    const [editAccountPassword, setEditAccountPassword] = useState('');
    const [editError, setEditError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showVisibilityConfirm, setShowVisibilityConfirm] = useState(false);
    const [pendingVisibility, setPendingVisibility] = useState(null);
    const [showChangePassword, setShowChangePassword] = useState(false);

    useEffect(() => {
        if (!authLoading && noteId) fetchNote();
    }, [authLoading, noteId]);

    async function fetchNote() {
        setLoading(true);
        try {
            const data = await api.getNote(noteId);
            setNote(data.note);
            setIsFav(data.note.is_favorited || false);

            // If protected, always show password modal
            if (data.note.visibility === 'protected' && data.note.content === null) {
                setShowPasswordModal(true);
            }
        } catch (err) {
            console.error('Failed to load note:', err);
        }
        setLoading(false);
    }

    async function handlePasswordVerify(password) {
        const data = await api.verifyNotePassword(noteId, password);
        if (data.verified) {
            setNote(data.note);
            setShowPasswordModal(false);
        }
    }

    async function handleFavorite() {
        try {
            const data = await api.toggleFavorite(noteId);
            setIsFav(data.is_favorited);
        } catch (err) {
            console.error('Favorite error:', err);
        }
    }

    async function handleDelete() {
        try {
            await api.deleteNote(noteId);
            router.push('/my-notes');
        } catch (err) {
            console.error('Delete error:', err);
        }
    }

    function startEditing() {
        setEditTitle(note.title);
        setEditContent(note.content || '');
        setEditVisibility(note.visibility);
        setEditPassword('');
        setEditConfirmPassword('');
        setEditOldPassword('');
        setEditAccountPassword('');
        setEditError('');
        setFieldErrors({});
        setShowChangePassword(false);
        setIsEditing(true);
    }

    function handleVisibilityChange(newVal) {
        // If switching from protected to public/private, show confirmation
        if (note.visibility === 'protected' && newVal !== 'protected') {
            setPendingVisibility(newVal);
            setShowVisibilityConfirm(true);
        } else {
            setEditVisibility(newVal);
        }
    }

    function confirmVisibilityChange() {
        setEditVisibility(pendingVisibility);
        setShowVisibilityConfirm(false);
        setPendingVisibility(null);
    }

    async function handleSaveEdit() {
        setEditError('');
        setFieldErrors({});

        if (!editTitle.trim() || !editContent.trim()) {
            setEditError('Judul dan isi catatan wajib diisi');
            return;
        }

        const errors = {};

        // Switching to protected (from non-protected): require new password
        if (editVisibility === 'protected' && note.visibility !== 'protected') {
            if (!editPassword) {
                errors.new_password = 'Password wajib diisi untuk note protected';
            } else if (editPassword.length < 4) {
                errors.new_password = 'Password minimal 4 karakter';
            } else if (editPassword !== editConfirmPassword) {
                errors.confirm_password = 'Password tidak cocok';
            }
        }

        // Changing password on already-protected note: require old + account passwords
        if (editVisibility === 'protected' && note.visibility === 'protected' && editPassword) {
            if (!editOldPassword) errors.old_password = 'Password lama note harus diisi';
            if (!editAccountPassword) errors.account_password = 'Password akun harus diisi';
            if (editPassword.length < 4) errors.new_password = 'Password minimal 4 karakter';
            else if (editPassword !== editConfirmPassword) errors.confirm_password = 'Password tidak cocok';
        }

        // Switching FROM protected to public/private: require old password
        if (note.visibility === 'protected' && editVisibility !== 'protected') {
            if (!editOldPassword) errors.old_password = 'Password note lama harus diisi untuk mengubah visibilitas';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        try {
            const updateData = {
                title: editTitle.trim(),
                content: editContent.trim(),
                visibility: editVisibility,
            };
            if (editVisibility === 'protected' && editPassword) {
                updateData.password = editPassword;
                if (note.visibility === 'protected') {
                    updateData.old_password = editOldPassword;
                    updateData.account_password = editAccountPassword;
                }
            }
            // Switching from protected to other: send old_password
            if (note.visibility === 'protected' && editVisibility !== 'protected') {
                updateData.old_password = editOldPassword;
            }
            const data = await api.updateNote(noteId, updateData);
            setNote(data.note);
            setIsEditing(false);
        } catch (err) {
            if (err.errorType) {
                setFieldErrors({ [err.errorType]: err.message });
            } else {
                setEditError(err.message);
            }
        }
    }

    const isOwner = user && note && user.id === note.user_id;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!note) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <Sidebar />
                <main className="ml-60 pt-16 p-6">
                    <div className="text-center py-20">
                        <h3 className="text-lg font-semibold text-gray-600">Note not found</h3>
                        <button onClick={() => router.push('/')} className="mt-4 text-blue-500 text-sm hover:underline">Back to explore</button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Sidebar />
            <main className="ml-60 pt-16 p-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => router.back()} className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 flex-1">Detail Note</h1>

                        <div className="flex items-center gap-2">
                            {user && (
                                <button onClick={handleFavorite} className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
                                    {isFav ? (
                                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            {isOwner && !isEditing && (
                                <>
                                    <button onClick={startEditing} className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button onClick={() => setShowDeleteConfirm(true)} className="w-9 h-9 rounded-lg bg-white border border-red-200 flex items-center justify-center hover:bg-red-50 transition">
                                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Note content */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                        {isEditing ? (
                            <div>
                                {editError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{editError}</div>
                                )}
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full text-2xl font-bold text-gray-800 mb-4 px-0 py-2 border-b border-gray-200 focus:outline-none focus:border-blue-400"
                                />
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={10}
                                    className="w-full text-gray-600 leading-relaxed px-0 py-2 border-none focus:outline-none resize-none"
                                />
                                <div className="mt-4 space-y-4">
                                    <div className="flex gap-3 items-center">
                                        <select
                                            value={editVisibility}
                                            onChange={(e) => handleVisibilityChange(e.target.value)}
                                            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        >
                                            <option value="public">🌐 Public</option>
                                            <option value="private">🔒 Private</option>
                                            <option value="protected">🛡️ Protected</option>
                                        </select>
                                        <div className="flex-1" />
                                        <button onClick={() => setIsEditing(false)} className="px-5 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
                                        <button onClick={handleSaveEdit} className="px-5 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition">Save</button>
                                    </div>

                                    {/* Old password required when switching FROM protected to public/private */}
                                    {note.visibility === 'protected' && editVisibility !== 'protected' && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                                            <label className="block text-sm font-medium text-red-800">
                                                🔑 Masukkan password note untuk mengubah visibilitas
                                            </label>
                                            <div>
                                                <input
                                                    type="password"
                                                    value={editOldPassword}
                                                    onChange={(e) => setEditOldPassword(e.target.value)}
                                                    placeholder="Password note saat ini"
                                                    className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent ${fieldErrors.old_password ? 'border-red-400' : 'border-red-200'}`}
                                                />
                                                {fieldErrors.old_password && <p className="text-xs text-red-500 mt-1">⚠️ {fieldErrors.old_password}</p>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Password fields when visibility is protected */}
                                    {editVisibility === 'protected' && (
                                        <div>
                                            {note.visibility === 'protected' ? (
                                                <>
                                                    {!showChangePassword ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowChangePassword(true)}
                                                            className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-100 transition w-full"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                            </svg>
                                                            Ganti Password Note
                                                        </button>
                                                    ) : (
                                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <label className="block text-sm font-medium text-amber-800">
                                                                    🔐 Ganti Password Note
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setShowChangePassword(false);
                                                                        setEditOldPassword('');
                                                                        setEditAccountPassword('');
                                                                        setEditPassword('');
                                                                        setEditConfirmPassword('');
                                                                        setFieldErrors({});
                                                                    }}
                                                                    className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                                                                >
                                                                    ✕ Batal
                                                                </button>
                                                            </div>
                                                            <div>
                                                                <input
                                                                    type="password"
                                                                    value={editOldPassword}
                                                                    onChange={(e) => setEditOldPassword(e.target.value)}
                                                                    placeholder="Password lama note"
                                                                    className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent ${fieldErrors.old_password ? 'border-red-400' : 'border-amber-200'}`}
                                                                />
                                                                {fieldErrors.old_password && <p className="text-xs text-red-500 mt-1">⚠️ {fieldErrors.old_password}</p>}
                                                            </div>
                                                            <div>
                                                                <input
                                                                    type="password"
                                                                    value={editAccountPassword}
                                                                    onChange={(e) => setEditAccountPassword(e.target.value)}
                                                                    placeholder="Password akun kamu"
                                                                    className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent ${fieldErrors.account_password ? 'border-red-400' : 'border-amber-200'}`}
                                                                />
                                                                {fieldErrors.account_password && <p className="text-xs text-red-500 mt-1">⚠️ {fieldErrors.account_password}</p>}
                                                            </div>
                                                            <hr className="border-amber-200" />
                                                            <div>
                                                                <input
                                                                    type="password"
                                                                    value={editPassword}
                                                                    onChange={(e) => setEditPassword(e.target.value)}
                                                                    placeholder="Password baru note"
                                                                    className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent ${fieldErrors.new_password ? 'border-red-400' : 'border-amber-200'}`}
                                                                />
                                                                <p className={`text-xs mt-1 ${fieldErrors.new_password ? 'text-red-500' : 'text-amber-500'}`}>
                                                                    {fieldErrors.new_password ? `⚠️ ${fieldErrors.new_password}` : 'ℹ️ Password minimal 4 karakter'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <input
                                                                    type="password"
                                                                    value={editConfirmPassword}
                                                                    onChange={(e) => setEditConfirmPassword(e.target.value)}
                                                                    placeholder="Konfirmasi password baru"
                                                                    className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent ${fieldErrors.confirm_password ? 'border-red-400' : 'border-amber-200'}`}
                                                                />
                                                                {fieldErrors.confirm_password && <p className="text-xs text-red-500 mt-1">⚠️ {fieldErrors.confirm_password}</p>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                                                    <label className="block text-sm font-medium text-amber-800">
                                                        🔐 Set Password Note
                                                    </label>
                                                    <div>
                                                        <input
                                                            type="password"
                                                            value={editPassword}
                                                            onChange={(e) => setEditPassword(e.target.value)}
                                                            placeholder="Masukkan password"
                                                            className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent ${fieldErrors.new_password ? 'border-red-400' : 'border-amber-200'}`}
                                                        />
                                                        <p className={`text-xs mt-1 ${fieldErrors.new_password ? 'text-red-500' : 'text-amber-500'}`}>
                                                            {fieldErrors.new_password ? `⚠️ ${fieldErrors.new_password}` : 'ℹ️ Password minimal 4 karakter'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="password"
                                                            value={editConfirmPassword}
                                                            onChange={(e) => setEditConfirmPassword(e.target.value)}
                                                            placeholder="Konfirmasi password"
                                                            className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent ${fieldErrors.confirm_password ? 'border-red-400' : 'border-amber-200'}`}
                                                        />
                                                        {fieldErrors.confirm_password && <p className="text-xs text-red-500 mt-1">⚠️ {fieldErrors.confirm_password}</p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Visibility badge */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${note.visibility === 'public' ? 'bg-blue-100 text-blue-600' :
                                        note.visibility === 'private' ? 'bg-red-100 text-red-600' :
                                            'bg-amber-100 text-amber-600'
                                        }`}>
                                        {note.visibility === 'public' ? '🌐 Public' :
                                            note.visibility === 'private' ? '🔒 Private' : '🛡️ Protected'}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-800 mb-4">{note.title}</h2>

                                {/* Author + date */}
                                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.4h19.6v-2.4c0-3.3-6.5-4.9-9.8-4.9z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">{note.author?.username}</p>
                                        <p className="text-xs text-gray-400">{formatDate(note.created_at)}</p>
                                    </div>
                                </div>

                                {/* Content */}
                                {note.content ? (
                                    <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{note.content}</div>
                                ) : (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-3">This note is password protected</p>
                                        <button onClick={() => setShowPasswordModal(true)} className="px-5 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition">
                                            Unlock Note
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Password Modal */}
            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => { setShowPasswordModal(false); if (!note.content) router.back(); }}
                onSubmit={handlePasswordVerify}
                title={note.title}
            />

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Note?</h3>
                        <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Visibility Change Confirmation */}
            {showVisibilityConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowVisibilityConfirm(false); setPendingVisibility(null); }}>
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">Ubah Pengaturan?</h3>
                        <p className="text-sm text-gray-500 mb-5 text-center">
                            Apakah anda yakin ingin mengubah pengaturan ini? Note akan berubah dari <strong>Protected</strong> ke <strong>{pendingVisibility === 'public' ? 'Public' : 'Private'}</strong> dan password protection akan dihapus.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowVisibilityConfirm(false); setPendingVisibility(null); }} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Batal</button>
                            <button onClick={confirmVisibilityChange} className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition">Ya, Ubah</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
