/**
 * Back to Top Button
 * Appears when user scrolls down
 */

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 right-4 z-40 p-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-700 transition-all hover:scale-110 animate-fade-in"
      aria-label="Back to top"
    >
      <ArrowUp size={20} />
    </button>
  );
}
