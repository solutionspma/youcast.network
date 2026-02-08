'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const contactReasons = [
  { label: 'Creator Application', value: 'creator' },
  { label: 'Enterprise / Network Inquiry', value: 'enterprise' },
  { label: 'Partnership', value: 'partnership' },
  { label: 'Technical Support', value: 'support' },
  { label: 'Press & Media', value: 'press' },
  { label: 'General Question', value: 'general' },
];

export default function ContactPage() {
  const [reason, setReason] = useState('');

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 mb-4">
            <span className="w-8 h-px bg-brand-500" />GET IN TOUCH
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-6 max-w-2xl">
            Let&apos;s build something together
          </h1>
          <p className="text-lg text-surface-400 max-w-xl">
            Whether you&apos;re a creator, church, enterprise, or partner — we&apos;re here to help.
          </p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="section-padding">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-display font-bold text-white mb-6">Send us a message</h2>
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input label="First Name" placeholder="Your first name" />
                  <Input label="Last Name" placeholder="Your last name" />
                </div>
                <Input label="Email" type="email" placeholder="you@example.com" />
                <Input label="Organization" placeholder="Company or channel name (optional)" />

                {/* Reason Select */}
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Reason for Contact</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
                  >
                    <option value="">Select a reason...</option>
                    {contactReasons.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Message</label>
                  <textarea
                    rows={5}
                    placeholder="Tell us how we can help..."
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors resize-none"
                  />
                </div>

                <Button type="submit" size="lg" fullWidth>
                  Send Message
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-3">Quick Contact</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-surface-300">
                  <svg className="w-5 h-5 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  hello@youcast.network
                </div>
                <div className="flex items-center gap-3 text-surface-300">
                  <svg className="w-5 h-5 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Austin, TX — Remote-first
                </div>
              </div>
            </div>

            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-3">For Enterprise</h3>
              <p className="text-sm text-surface-400 mb-4">
                Running a media network or need white-label infrastructure? Our enterprise team can build a custom solution.
              </p>
              <Button variant="outline" size="sm" fullWidth>Schedule a Demo</Button>
            </div>

            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-3">Support</h3>
              <p className="text-sm text-surface-400 mb-4">
                Existing creators can reach our support team directly from the dashboard or via our help center.
              </p>
              <Button variant="ghost" size="sm" fullWidth>Visit Help Center</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
