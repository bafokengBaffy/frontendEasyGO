import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

function LoginPage() {
  const { login, loginWithGoogle, loading } = useAuth();
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    try {
      await login(email, password);
      setMessage('Login successful! Redirecting to your dashboard...');
    } catch (error) {
      setMessage(error.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setMessage(null);

    try {
      await loginWithGoogle('rider');
    } catch (error) {
      setMessage(error.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <section
      className="min-h-screen px-4 py-8 sm:px-6 lg:px-8"
      style={{
        background: isDark
          ? 'radial-gradient(circle at top, #020617, #111827 70%)'
          : 'radial-gradient(circle at top, #f8fafc, #eef2ff 70%)',
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center">
        <div className="max-w-xl flex-1 space-y-4">
          <p className={isDark ? 'text-sm font-semibold uppercase tracking-[0.2em] text-slate-400' : 'text-sm font-semibold uppercase tracking-[0.2em] text-slate-500'}>EasyGo Lesotho</p>
          <h1 className={isDark ? 'text-3xl font-semibold text-white sm:text-4xl' : 'text-3xl font-semibold text-slate-900 sm:text-4xl'}>Move people, power operations, and manage growth from one dashboard.</h1>
          <p className={isDark ? 'text-base leading-7 text-slate-300' : 'text-base leading-7 text-slate-600'}>Secure sign-in for riders, drivers, and admin teams with a responsive experience designed for mobile, tablet, and desktop.</p>
        </div>
        <div className={isDark ? 'w-full max-w-xl rounded-[2rem] border border-slate-700 bg-slate-950 p-6 shadow-2xl shadow-black/30 sm:p-8' : 'w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8'}>
          <h2 className={isDark ? 'text-2xl font-semibold text-white' : 'text-2xl font-semibold text-slate-900'}>Sign in</h2>
          <p className={isDark ? 'mt-2 text-sm text-slate-300' : 'mt-2 text-sm text-slate-600'}>Use your admin, driver, or rider credentials to continue.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className={isDark ? 'mb-2 block text-sm font-medium text-slate-200' : 'mb-2 block text-sm font-medium text-slate-700'} htmlFor="email">Email address</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={isDark ? 'w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-slate-700' : 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200'} />
            </div>
            <div>
              <label className={isDark ? 'mb-2 block text-sm font-medium text-slate-200' : 'mb-2 block text-sm font-medium text-slate-700'} htmlFor="password">Password</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={isDark ? 'w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-slate-700' : 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200'} />
            </div>
            <button type="submit" disabled={loading || googleLoading} className={isDark ? 'w-full rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70' : 'w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70'}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="relative my-6">
              <div className={isDark ? 'absolute inset-0 flex items-center' : 'absolute inset-0 flex items-center'}>
                <div className={isDark ? 'w-full border-t border-slate-700' : 'w-full border-t border-slate-300'}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={isDark ? 'bg-slate-950 px-2 text-slate-400' : 'bg-white px-2 text-slate-600'}>Or continue with</span>
              </div>
            </div>

            <button 
              type="button" 
              disabled={loading || googleLoading}
              onClick={handleGoogleSignIn}
              className={isDark ? 'w-full rounded-full border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2' : 'w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2'}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Signing in…' : 'Sign in with Google'}
            </button>

            {message ? <p className={isDark ? 'rounded-2xl bg-slate-900 p-3 text-sm text-slate-200 border border-slate-700' : 'rounded-2xl bg-slate-50 p-3 text-sm text-slate-700'}>{message}</p> : null}
          </form>

          <p className={isDark ? 'mt-6 text-sm text-slate-300' : 'mt-6 text-sm text-slate-600'}>
            New to EasyGo?{' '}
            <Link className={isDark ? 'font-semibold text-sky-300 hover:text-sky-200' : 'font-semibold text-slate-900 hover:text-slate-700'} to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
