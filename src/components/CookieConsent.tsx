/**
 * Cookie Consent Banner
 * GDPR-compliant cookie consent
 */

import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie size={24} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-900 font-medium">We use cookies</p>
              <p className="text-xs text-gray-600 mt-1">
                We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. 
                By clicking "Accept All", you consent to our use of cookies.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={declineCookies}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Decline
            </button>
            <button
              onClick={acceptCookies}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
