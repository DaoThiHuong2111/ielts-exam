'use client';

import React from 'react';
import { useSession } from '@/hooks/useSession';

interface SessionWarningProps {
  className?: string;
}

/**
 * Component that displays a warning when the session is about to expire
 */
export function SessionWarning({ className = '' }: SessionWarningProps) {
  const {
    showWarning,
    timeLeft,
    continueSession,
    logout,
    formatTimeLeft,
  } = useSession();

  if (!showWarning) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-md ${className}`}>
      <div className="bg-white border border-yellow-300 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Phiên đăng nhập sắp hết hạn
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Phiên đăng nhập của bạn sẽ hết hạn sau{' '}
                <span className="font-semibold">{formatTimeLeft(timeLeft)}</span>.
              </p>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                type="button"
                onClick={continueSession}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Tiếp tục phiên làm việc
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Component that displays session status information
 */
export function SessionStatus({ className = '' }: SessionWarningProps) {
  const {
    sessionInfo,
    isLoading,
    getSessionStatusText,
    getSessionStatusColor,
    extendSession,
  } = useSession();

  if (isLoading || !sessionInfo) {
    return (
      <div className={`text-sm ${className}`}>
        <span className="text-gray-500">Đang kiểm tra phiên đăng nhập...</span>
      </div>
    );
  }

  return (
    <div className={`text-sm ${className}`}>
      <span className={getSessionStatusColor()}>
        {getSessionStatusText()}
      </span>
      {sessionInfo.isAuthenticated && !sessionInfo.isExpired && (
        <button
          onClick={extendSession}
          className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
          title="Gia hạn phiên đăng nhập"
        >
          Gia hạn
        </button>
      )}
    </div>
  );
}