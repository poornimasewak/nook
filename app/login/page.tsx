'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

declare global {
  interface Window {
    MojoAuth: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState(false);
  const [mojoAuthLoaded, setMojoAuthLoaded] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      // User is already logged in, redirect to nook
      router.push('/nook');
      return;
    }

    // Load MojoAuth SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.mojoauth.com/js/mojoauth.min.js';
    script.async = true;
    script.onload = () => {
      setMojoAuthLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNameError(false);

    // Validate full name
    if (!fullName.trim()) {
      setNameError(true);
      setError('Please enter your full name');
      setLoading(false);
      return;
    }

    // Validate email
    if (!email.trim()) {
      setError('Please enter your email');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      // In development, always use fallback API to see OTP in console
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      // Use MojoAuth for email OTP (only in production)
      if (!isDevelopment && mojoAuthLoaded && window.MojoAuth) {
        const mojoauth = new window.MojoAuth(process.env.NEXT_PUBLIC_MOJOAUTH_API_KEY || 'test-key');
        
        try {
          await mojoauth.signInWithEmailOTP({ email });
          
          // Store user data for verification
          localStorage.setItem('tempEmail', email);
          localStorage.setItem('tempFullName', fullName);
          
          // Redirect to OTP verification page
          window.location.href = '/login/verify';
        } catch (mojoError: any) {
          console.error('MojoAuth error:', mojoError);
          setError(mojoError.message || 'Failed to send OTP. Please try again.');
        }
      } else {
        // Fallback: Use custom API endpoint (logs OTP to console in dev mode)
        const response = await fetch('/api/auth/send-email-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, fullName }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store user data for verification
          localStorage.setItem('tempEmail', email);
          localStorage.setItem('tempFullName', fullName);
          
          // Redirect to OTP verification page
          window.location.href = '/login/verify';
        } else {
          setError(data.error || 'Failed to send OTP. Please try again.');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-300 via-teal-300 to-orange-300 p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 via-green-400 to-orange-400 flex items-center justify-center shadow-lg">
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold text-gray-800">
              Nook
            </h1>
          </div>
          <p className="text-center text-gray-600 mb-8">
            Your cozy space to connect
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Input */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (nameError) setNameError(false);
                  }}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    nameError ? 'border-red-400' : 'border-gray-200'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all`}
                  required
                />
                {nameError && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="bg-red-500 text-white rounded-lg px-3 py-1 text-xs flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 via-green-500 to-orange-500 hover:from-teal-600 hover:via-green-600 hover:to-orange-600 text-white font-semibold py-3.5 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                'Verify for your cozy nook'
              )}
            </button>
          </form>

          {/* Footer Text */}
          <p className="text-center text-gray-500 text-sm mt-8">
            Connect with others in a vibrant, colorful space
          </p>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium text-sm transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

