import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
          <h1 className="text-4xl font-bold text-primary mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="max-w-4xl mx-auto prose prose-lg">
          <div className="bg-card rounded-lg border p-8">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                Welcome to LeadConnector, a service provided by SARACE DIGITALSOLUTIONS PRIVATE LIMITED 
                ("Company," "we," "our," or "us"). These Terms of Service ("Terms") govern your use of 
                our Facebook Lead Ads integration service ("Service").
              </p>
              <p className="mb-4">
                By accessing or using our Service, you agree to be bound by these Terms. If you do not 
                agree to these Terms, please do not use our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="mb-4">
                LeadConnector provides automated integration between Facebook Lead Ads and your chosen 
                customer relationship management (CRM) systems or webhook endpoints. Our Service includes:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Real-time lead capture from Facebook Lead Ads</li>
                <li>Webhook delivery and integration capabilities</li>
                <li>Analytics dashboard and reporting tools</li>
                <li>Lead management and filtering features</li>
                <li>Data export and synchronization services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Registration</h2>
              <p className="mb-4">
                To use our Service, you must create an account by providing accurate and complete information. 
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Immediately notifying us of any unauthorized use</li>
                <li>Ensuring your account information remains accurate and current</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Facebook Integration</h2>
              <p className="mb-4">
                Our Service integrates with Facebook's Lead Ads platform. By using our Service, you acknowledge:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>You must comply with Facebook's Terms of Service and Advertising Policies</li>
                <li>You are responsible for obtaining necessary permissions for lead data access</li>
                <li>Facebook's API limitations and restrictions may affect service availability</li>
                <li>We are not responsible for changes to Facebook's platform or policies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use Policy</h2>
              <p className="mb-4">You agree not to use our Service to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit spam, malware, or harmful content</li>
                <li>Interfere with or disrupt our Service or servers</li>
                <li>Access data you are not authorized to access</li>
                <li>Use automated scripts to abuse our Service</li>
                <li>Share your account access with unauthorized parties</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Data and Privacy</h2>
              <p className="mb-4">
                Your use of our Service is subject to our Privacy Policy. You acknowledge that:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>You have the right to collect and process lead data through our Service</li>
                <li>You will comply with applicable privacy laws (GDPR, CCPA, etc.)</li>
                <li>You are responsible for obtaining necessary consents from leads</li>
                <li>We process data as outlined in our Privacy Policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Service Availability</h2>
              <p className="mb-4">
                While we strive to provide reliable service, we do not guarantee uninterrupted access. 
                Our Service may be temporarily unavailable due to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Scheduled maintenance and updates</li>
                <li>Third-party service dependencies (Facebook API)</li>
                <li>Technical issues or force majeure events</li>
                <li>Security incidents requiring immediate action</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Subscription and Payment</h2>
              <p className="mb-4">
                If you subscribe to paid features of our Service:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Subscription fees are billed in advance</li>
                <li>All fees are non-refundable unless required by law</li>
                <li>We may change pricing with 30 days' notice</li>
                <li>Unpaid accounts may be suspended or terminated</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
              <p className="mb-4">
                The Service and its original content, features, and functionality are owned by 
                SARACE DIGITALSOLUTIONS PRIVATE LIMITED and are protected by international copyright, 
                trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Disclaimers and Limitations</h2>
              <p className="mb-4">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL 
                WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
              </p>
              <p className="mb-4">
                IN NO EVENT SHALL SARACE DIGITALSOLUTIONS PRIVATE LIMITED BE LIABLE FOR ANY INDIRECT, 
                INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your account immediately, without prior notice, for any 
                reason including breach of these Terms. Upon termination:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Your right to use the Service ceases immediately</li>
                <li>We may delete your account and data</li>
                <li>Surviving provisions of these Terms remain in effect</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these Terms at any time. We will provide notice of 
                material changes by posting updated Terms and updating the "Last updated" date. 
                Continued use of the Service after changes constitutes acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
              <p className="mb-4">
                These Terms shall be governed by and construed in accordance with the laws of India. 
                Any disputes arising from these Terms shall be subject to the exclusive jurisdiction 
                of the courts in the appropriate jurisdiction in India.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
              <div className="bg-muted p-6 rounded-lg">
                <p className="font-semibold mb-2">SARACE DIGITALSOLUTIONS PRIVATE LIMITED</p>
                <p className="mb-1">Email: admin@botpe.com</p>
                <p className="mb-1">Phone: +91 94225 94226</p>
                <p className="mb-4">
                  If you have any questions about these Terms of Service, please contact us using 
                  the information provided above.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}