'use client';

import { useRouter } from 'next/navigation';
import { formatDate } from '@/utils/formatDate';
import api from '@/services/api';
import { useState } from 'react';

export default function NoteCard({ note, onFavoriteToggle }) {
    const router = useRouter();
    const [isFav, setIsFav] = useState(note.is_favorited || false);

    async function handleFavorite(e) {
        e.stopPropagation();
        try {
            const data = await api.toggleFavorite(note.id);
            setIsFav(data.is_favorited);
            if (onFavoriteToggle) onFavoriteToggle(note.id, data.is_favorited);
        } catch (err) {
            console.error('Favorite error:', err);
        }
    }

    function handleShare(e) {
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({ title: note.title, url: `${window.location.origin}/note/${note.id}` });
        } else {
            navigator.clipboard.writeText(`${window.location.origin}/note/${note.id}`);
        }
    }

    function handleClick() {
        router.push(`/note/${note.id}`);
    }

    const visibilityColors = {
        public: 'bg-blue-50 border-blue-100',
        private: 'bg-red-50 border-red-100',
        protected: 'bg-amber-50 border-amber-100',
    };

    const cardBg = visibilityColors[note.visibility] || 'bg-blue-50 border-blue-100';

    return (
        <div
            onClick={handleClick}
            className={`rounded-xl border p-5 cursor-pointer hover:shadow-md transition-all duration-200 ${cardBg}`}
        >
            {/* Title */}
            <h3 className="font-bold text-gray-800 text-base mb-1 line-clamp-1">{note.title}</h3>

            {/* Content preview */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {note.visibility === 'protected' && !note.content ? '🔒 Protected note' : note.content}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.4h19.6v-2.4c0-3.3-6.5-4.9-9.8-4.9z" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">
                            {note.author?.username || 'Unknown'}
                        </p>
                        <p className="text-[10px] text-gray-400">{formatDate(note.created_at)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Visibility badge */}
                    {note.visibility === 'protected' && (
                        <span className="text-amber-500" title="Protected">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                            </svg>
                        </span>
                    )}
                    {note.visibility === 'private' && (
                        <span className="text-red-400" title="Private">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                            </svg>
                        </span>
                    )}

                    {/* Favorite button */}
                    <button onClick={handleFavorite} className="hover:scale-110 transition-transform">
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

                    {/* Share button */}
                    <button onClick={handleShare} className="hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
