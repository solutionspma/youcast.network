import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | YouCast',
  description: 'YouCast Network privacy policy and data handling practices.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-950 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-display font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-surface-400 mb-12">Last updated: February 2025</p>

        <div className="prose prose-invert prose-surface max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="text-surface-300 leading-relaxed mb-4">
              YouCast Network collects information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-surface-300 space-y-2">
              <li>Account information (name, email, password)</li>
              <li>Profile information (display name, avatar, bio)</li>
              <li>Content you create (streams, videos, posts, comments)</li>
              <li>Communications with us and other users</li>
              <li>Payment information (processed securely via Stripe)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <p className="text-surface-300 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-surface-300 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Personalize your experience and content recommendations</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">3. Information Sharing</h2>
            <p className="text-surface-300 leading-relaxed mb-4">
              We do not sell your personal information. We may share information:
            </p>
            <ul className="list-disc list-inside text-surface-300 space-y-2">
              <li>With your consent or at your direction</li>
              <li>With service providers who assist in our operations</li>
              <li>To comply with legal obligations</li>
              <li>To protect the rights and safety of YouCast and our users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">4. Data Security</h2>
            <p className="text-surface-300 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction. 
              This includes encryption of data in transit and at rest, regular security assessments, 
              and access controls.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">5. Your Rights</h2>
            <p className="text-surface-300 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-surface-300 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">6. Cookies and Tracking</h2>
            <p className="text-surface-300 leading-relaxed">
              We use cookies and similar technologies to provide functionality, analyze usage, 
              and personalize content. You can manage cookie preferences through your browser settings. 
              Essential cookies required for the platform to function cannot be disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">7. Children&apos;s Privacy</h2>
            <p className="text-surface-300 leading-relaxed">
              YouCast is not intended for children under 13 years of age. We do not knowingly 
              collect personal information from children under 13. If we learn we have collected 
              information from a child under 13, we will delete that information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">8. Changes to This Policy</h2>
            <p className="text-surface-300 leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any 
              changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-4">9. Contact Us</h2>
            <p className="text-surface-300 leading-relaxed">
              If you have any questions about this privacy policy or our data practices, 
              please contact us at privacy@youcast.network or through our contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
