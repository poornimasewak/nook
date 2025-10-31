'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [verificationType, setVerificationType] = useState<'phone' | 'email'>('phone');

  useEffect(() => {
    // Check for email verification first
    const tempEmail = localStorage.getItem('tempEmail');
    const tempFullName = localStorage.getItem('tempFullName');
    
    if (tempEmail) {
      setEmail(tempEmail);
      setFullName(tempFullName || '');
      setVerificationType('email');
      return;
    }

    // Fall back to phone verification
    const tempPhone = localStorage.getItem('tempPhone');
    if (tempPhone) {
      setPhoneNumber(tempPhone);
      setVerificationType('phone');
    } else {
      // If no verification data, redirect to login
      window.location.href = '/login';
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      setLoading(false);
      return;
    }

    try {
      const isNewUser = localStorage.getItem('isNewUser') === 'true';
      
      const endpoint = verificationType === 'email' ? '/api/auth/verify-email-otp' : '/api/auth/verify-otp';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          verificationType === 'email'
            ? { email, otp: otpString, fullName }
            : { phoneNumber, otp: otpString, name: isNewUser ? 'User' : undefined }
        ),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Store tokens
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Clear temp data
        localStorage.removeItem('tempPhone');
        localStorage.removeItem('tempEmail');
        localStorage.removeItem('tempFullName');
        localStorage.removeItem('isNewUser');
        
        // Redirect to Your Nook dashboard
        setTimeout(() => {
          window.location.href = '/nook';
        }, 1500);
      } else {
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = verificationType === 'email' ? '/api/auth/send-email-otp' : '/api/auth/send-otp';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          verificationType === 'email'
            ? { email, fullName }
            : { phoneNumber }
        ),
      });

      if (response.ok) {
        setError('');
        alert('New OTP sent successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!phoneNumber && !email) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <div className="mb-6">
          <Link 
            href="/login" 
            className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
          </Link>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <svg className="mx-auto h-12 w-12 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-700 font-medium">Verification successful! Redirecting...</p>
            </div>
          )}

          {/* Logo */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Nook
            </h1>
            <p className="text-gray-600 font-medium">Enter Verification Code</p>
          </div>

          {/* Instructions */}
          <div className="mb-6 text-center">
            <p className="text-gray-600">We sent a 6-digit code to</p>
            <p className="font-semibold text-gray-900 mt-1">
              {verificationType === 'email' ? email : phoneNumber}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Inputs */}
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  disabled={loading || success}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || success || otp.join('').length !== 6}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            {/* Resend Code */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || success}
                  className="text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50"
                >
                  Resend
                </button>
              </p>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-700 text-center">
              <strong>Note:</strong> In development mode, check your terminal console for the OTP code.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Powered by Nook - Secure & Private 🏠
        </p>
      </div>
    </div>
  );
}

