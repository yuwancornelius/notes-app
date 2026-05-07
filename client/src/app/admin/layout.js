'use client';

import { useAuth } from '@/store/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function AdminLayout({ children }) {
    const { user, loading, isSuperAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (!isSuperAdmin) {
                router.push('/');
            }
        }
    }, [loading, user, isSuperAdmin, router]);

    if (loading || !user || !isSuperAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Sidebar />
            <main className="ml-60 pt-16 p-6">
                {children}
            </main>
        </div>
    );
}
