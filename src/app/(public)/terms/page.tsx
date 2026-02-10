import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | YouCast',
  description: 'YouCast Network terms of service and user agreement.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-950 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-display font-bold text-white mb-4">Terms of Service</h1>
        <p className="text-surface-400 mb-12">Last updated: February 2025</p>

        <div className="prose prose-invert prose-surface max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-surface-300 leading-relaxed">
              By accessing or using YouCast Network (&quot;the Platform&quot;), you agree to be bound by these 
              Terms of Service. If you do not agree to these terms, do not use the Platform. We may 
              modify these terms at any time, and such modifications will be effective immediately 
              upon posting.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">2. Account Registration</h2>
            <p className="text-surface-300 leading-relaxed mb-4">
              To use certain features of the Platform, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-surface-300 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update any changes to your information</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">3. User Content</h2>
            <p className="text-surface-300 leading-relaxed mb-4">
              You retain ownership of content you create and upload to the Platform. By uploading 
              content, you grant YouCast a non-exclusive, worldwide, royalty-free license to use, 
              display, and distribute your content in connection with operating the Platform.
            </p>
            <p className="text-surface-300 leading-relaxed">
              You are solely responsible for your content and must ensure it does not violate any 
              third-party rights or applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">4. Prohibited Conduct</h2>
            <p className="text-surface-300 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-surface-300 space-y-2">
              <li>Upload illegal, harmful, or offensive content</li>
              <li>Infringe on intellectual property rights</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate others or misrepresent affiliation</li>
              <li>Interfere with or disrupt the Platform</li>
              <li>Attempt to gain unauthorized access</li>
              <li>Use the Platform for spam or commercial solicitation</li>
              <li>Collect user information without consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">5. Subscription Tiers</h2>
            <p className="text-surface-300 leading-relaxed mb-4">
              YouCast offers various subscription tiers with different features and capabilities:
            </p>
            <ul className="list-disc list-inside text-surface-300 space-y-2">
              <li><strong className="text-white">Free:</strong> Basic viewing and limited features</li>
              <li><strong className="text-white">Creator:</strong> Streaming capabilities and content management</li>
              <li><strong className="text-white">Pro:</strong> Advanced analytics, multi-platform streaming</li>
              <li><strong className="text-white">Enterprise:</strong> White-label options and dedicated support</li>
            </ul>
            <p className="text-surface-300 leading-relaxed mt-4">
              Subscription fees are billed according to your selected plan. You may cancel at any 
              time, with access continuing until the end of your billing period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">6. Monetization</h2>
            <p className="text-surface-300 leading-relaxed">
              Creators may monetize their content through subscriptions, donations, and other 
              mechanisms provided by the Platform. YouCast may retain a percentage of earnings 
              as specified in your tier agreement. Payments are processed through third-party 
              payment processors and subject to their terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">7. Intellectual Property</h2>
            <p className="text-surface-300 leading-relaxed">
              The Platform, including its design, features, and content (excluding user content), 
              is owned by YouCast Network and protected by intellectual property laws. You may not 
              copy, modify, distribute, or create derivative works without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">8. Termination</h2>
            <p className="text-surface-300 leading-relaxed">
              We may suspend or terminate your account at any time for violations of these terms 
              or for any other reason at our discretion. Upon termination, your right to use the 
              Platform ceases immediately. Provisions that by their nature should survive termination 
              will survive.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">9. Disclaimers</h2>
            <p className="text-surface-300 leading-relaxed">
              THE PLATFORM IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE 
              UNINTERRUPTED OR ERROR-FREE SERVICE. YOUR USE OF THE PLATFORM IS AT YOUR OWN RISK.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">10. Limitation of Liability</h2>
            <p className="text-surface-300 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, YOUCAST SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE 
              PLATFORM.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">11. Governing Law</h2>
            <p className="text-surface-300 leading-relaxed">
              These terms are governed by and construed in accordance with applicable laws. Any 
              disputes shall be resolved through binding arbitration or in the courts of competent 
              jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">12. Contact</h2>
            <p className="text-surface-300 leading-relaxed">
              For questions about these Terms of Service, please contact us at legal@youcast.network 
              or through our contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
