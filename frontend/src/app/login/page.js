'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authAPI } from '@/lib/api';
import { setToken, getToken } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const [needsSetup, setNeedsSetup] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Already signed in with a live session — no reason to show the form.
    if (getToken()) {
      router.replace('/');
      return;
    }
    authAPI
      .status()
      .then((res) => setNeedsSetup(res.data.needsSetup))
      .catch(() => setNeedsSetup(false));
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (needsSetup && password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const call = needsSetup ? authAPI.register : authAPI.login;
      const res = await call({ email, password });
      setToken(res.data.token);
      router.replace('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (needsSetup === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            💰 BillEase
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {needsSetup ? 'Create your account to get started' : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={needsSetup ? 8 : undefined}
            autoComplete={needsSetup ? 'new-password' : 'current-password'}
            placeholder={needsSetup ? 'At least 8 characters' : '••••••••'}
          />
          {needsSetup && (
            <Input
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />
          )}

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Please wait…' : needsSetup ? 'Create account' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
