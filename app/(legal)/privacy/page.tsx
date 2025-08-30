import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-primary mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="max-w-4xl mx-auto prose prose-lg">
          <div className="bg-card rounded-lg border p-8">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                SARACE DIGITALSOLUTIONS PRIVATE LIMITED ("we," "our," or "us") operates the LeadConnector service. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
                use our Facebook Lead Ads integration service.
              </p>
              <p className="mb-4">We collect information you provide directly to us, such as:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Account registration information (name, email address)</li>
                <li>Facebook account information through OAuth authentication</li>
                <li>Lead data from your Facebook Lead Ads campaigns</li>
                <li>Webhook configuration and delivery preferences</li>
                <li>Usage data and analytics information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and deliver lead data from Facebook</li>
                <li>Send you technical notices and support messages</li>
                <li>Monitor and analyze usage patterns</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
              <p className="mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties without 
                your consent, except as described in this policy. We may share your information:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>In connection with a business transfer</li>
                <li>With service providers under strict confidentiality agreements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
              <p className="mb-4">
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. This includes:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Encryption of sensitive data at rest and in transit</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Secure data storage and backup procedures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
              <p className="mb-4">
                We retain your personal information only for as long as necessary to provide our services 
                and comply with legal obligations. Lead data is typically retained according to your 
                configured retention policies or for a maximum of 2 years.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your personal information</li>
                <li>Object to processing of your personal information</li>
                <li>Request data portability</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
              <p className="mb-4">
                We use cookies and similar technologies to enhance your experience, analyze usage, 
                and provide personalized content. You can control cookie preferences through your 
                browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
              <p className="mb-4">
                Our service is not intended for individuals under 18 years of age. We do not knowingly 
                collect personal information from children under 18.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy periodically. We will notify you of any material 
                changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
              <div className="bg-muted p-6 rounded-lg">
                <p className="font-semibold mb-2">SARACE DIGITALSOLUTIONS PRIVATE LIMITED</p>
                <p className="mb-1">Email: admin@botpe.com</p>
                <p className="mb-1">Phone: +91 94225 94226</p>
                <p className="mb-4">
                  For privacy-related inquiries, data deletion requests, or to exercise your rights 
                  under this policy, please contact us using the information above.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}