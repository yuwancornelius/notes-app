'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1=email, 2=answer, 3=reset
    const [email, setEmail] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Submit email to get security question
    async function handleEmailSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await api.forgotPassword(email);
            setSecurityQuestion(data.security_question);
            setStep(2);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }

    // Step 2: Answer security question
    async function handleAnswerSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await api.verifySecurityAnswer(email, securityAnswer);
            setResetToken(data.reset_token);
            setStep(3);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }

    // Step 3: Reset password
    async function handleResetSubmit(e) {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Password tidak cocok');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await api.resetPassword(resetToken, newPassword);
            setSuccess(data.message);
            setTimeout(() => router.push('/login'), 2000);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Lupa Password</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {step === 1 && 'Masukkan email untuk memulai proses reset'}
                        {step === 2 && 'Jawab pertanyaan keamanan Anda'}
                        {step === 3 && 'Buat password baru'}
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {step > s ? '✓' : s}
                            </div>
                            {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-blue-500' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    {success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Berhasil!</h3>
                            <p className="text-sm text-gray-500">{success}</p>
                            <p className="text-xs text-gray-400 mt-2">Mengalihkan ke halaman login...</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            {/* Step 1: Email */}
                            {step === 1 && (
                                <form onSubmit={handleEmailSubmit}>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition disabled:opacity-50 text-sm"
                                    >
                                        {loading ? 'Memproses...' : 'Lanjutkan'}
                                    </button>
                                </form>
                            )}

                            {/* Step 2: Security Answer */}
                            {step === 2 && (
                                <form onSubmit={handleAnswerSubmit}>
                                    <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                        <p className="text-xs text-blue-500 font-medium mb-1">Pertanyaan Keamanan</p>
                                        <p className="text-sm font-semibold text-blue-800">{securityQuestion}</p>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Jawaban Anda</label>
                                        <input
                                            type="text"
                                            value={securityAnswer}
                                            onChange={(e) => setSecurityAnswer(e.target.value)}
                                            placeholder="Masukkan jawaban"
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Tidak case-sensitive</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setStep(1); setError(''); }}
                                            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition text-sm"
                                        >
                                            Kembali
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition disabled:opacity-50 text-sm"
                                        >
                                            {loading ? 'Memverifikasi...' : 'Verifikasi'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Step 3: New Password */}
                            {step === 3 && (
                                <form onSubmit={handleResetSubmit}>
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                                        ✅ Jawaban benar! Silakan buat password baru.
                                    </div>
                                    <div className="mb-5">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min. 6 karakter"
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition disabled:opacity-50 text-sm"
                                    >
                                        {loading ? 'Menyimpan...' : 'Reset Password'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    <p className="text-center text-sm text-gray-500 mt-6">
                        <Link href="/login" className="text-blue-500 font-medium hover:underline">
                            ← Kembali ke Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
