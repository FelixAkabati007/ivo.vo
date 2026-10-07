/**
 * Newsletter Signup Modal
 * Prompts users to subscribe to newsletter
 */

import { useState, useEffect } from 'react';
import { X, Mail, Gift } from 'lucide-react';
import { useToast } from './Toast';

export function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const subscribed = localStorage.getItem('newsletter_subscribed');
    const dismissed = localStorage.getItem('newsletter_dismissed');
    
    if (!subscribed && !dismissed) {
      const timer = setTimeout(() => setIsVisible(true), 30000); // Show after 30 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    localStorage.setItem('newsletter_subscribed', 'true');
    addToast({
      type: 'success',
      title: 'Subscribed!',
      message: 'Thank you for subscribing to our newsletter.',
    });
    setIsVisible(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    localStorage.setItem('newsletter_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-scale-in">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Gift size={32} className="text-gray-900" />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Get 10% Off</h3>
            <p className="text-sm text-gray-600 mt-2">
              Subscribe to our newsletter and receive 10% off your first order, plus exclusive deals and updates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gray-900 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe & Get 10% Off'}
            </button>
          </form>

          <p className="text-xs text-gray-500">
            No spam, unsubscribe at any time. By subscribing, you agree to our Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
