'use client';

import { useState } from 'react';
import { X, Bell, Sparkles } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  featureKey: 'banking' | 'analytics' | 'blueprint';
  description: string;
  icon?: React.ReactNode;
}

export function ComingSoonModal({
  isOpen,
  onClose,
  feature,
  featureKey,
  description,
  icon
}: ComingSoonModalProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, feature: featureKey }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // Silent fail - still show success for UX
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="liquid-glass rounded-[28px] p-6 relative overflow-hidden">
          {/* Decorative gradient orb */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-accent/30 to-primary/30 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={16} className="text-white/60" />
          </button>

          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-[20px] bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center">
            {icon || <Sparkles size={28} className="text-accent" />}
          </div>

          {/* Content */}
          <h2 className="text-[22px] font-bold text-white text-center mb-2">
            {feature}
          </h2>
          <p className="text-[14px] text-white/60 text-center mb-6 leading-relaxed">
            {description}
          </p>

          {/* Waitlist form or success state */}
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                <Bell size={20} className="text-green-400" />
              </div>
              <p className="text-[15px] font-semibold text-white">You&apos;re on the list!</p>
              <p className="text-[13px] text-white/50 mt-1">We&apos;ll notify you when it&apos;s ready.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full h-12 px-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/40 text-[15px] outline-none focus:border-primary/50 focus:bg-white/15 transition-all"
              />
              <button
                type="submit"
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-[15px] shadow-[0_4px_20px_rgba(0,95,204,0.4)] active:scale-[0.98] transition-transform"
              >
                Join the Waitlist
              </button>
            </form>
          )}

          <p className="text-[11px] text-white/30 text-center mt-4">
            Coming Q3 2026
          </p>
        </div>
      </div>
    </div>
  );
}
