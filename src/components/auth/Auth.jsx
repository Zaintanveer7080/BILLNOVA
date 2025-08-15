import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import OtpForm from '@/components/auth/OtpForm';
import { Toaster } from '@/components/ui/toaster';

const Auth = () => {
  const [view, setView] = useState('signin'); // 'signin', 'signup', 'forgot', 'otp'
  const [authData, setAuthData] = useState({ email: '' });

  const handleSwitchToOtp = (email) => {
    setAuthData({ email });
    setView('otp');
  };

  const renderContent = () => {
    switch (view) {
      case 'signup':
        return <SignUpForm onSwitchView={() => setView('signin')} />;
      case 'forgot':
        return <ForgotPasswordForm onSwitchView={() => setView('signin')} />;
      case 'otp':
        return <OtpForm email={authData.email} onSwitchView={() => setView('signin')} />;
      case 'signin':
      default:
        return <SignInForm onSwitchView={setView} onSuccessfulSignIn={handleSwitchToOtp} />;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-800 dark:via-black dark:to-black">
      <Toaster forAuth={true} />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md mx-auto shadow-2xl dark:shadow-primary/10 border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold gradient-text">
              {view === 'otp' ? 'Two-Factor Authentication' : 'Welcome!'}
            </CardTitle>
            <CardDescription>
              {view === 'signin' && 'Sign in to access your dashboard'}
              {view === 'signup' && 'Create an account to get started'}
              {view === 'forgot' && 'Reset your password'}
              {view === 'otp' && `Enter the OTP sent to ${authData.email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;