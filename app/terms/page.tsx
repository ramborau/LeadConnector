export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="prose max-w-none space-y-6">
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-2xl font-semibold mb-3">Acceptance of Terms</h2>
          <p>
            By accessing and using LeadConnector, you accept and agree to be bound by the terms 
            and provision of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Use of Service</h2>
          <p>
            LeadConnector is a service that helps you manage and integrate your Facebook Lead Ads 
            with other platforms. You agree to use this service only for lawful purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Facebook Integration</h2>
          <p>
            By connecting your Facebook account, you grant us permission to access your Facebook 
            pages and lead ads data as authorized through Facebook&apos;s OAuth process.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Data Responsibility</h2>
          <p>
            You are responsible for ensuring you have the necessary permissions to collect 
            and process lead data from your Facebook campaigns.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Limitation of Liability</h2>
          <p>
            LeadConnector shall not be liable for any indirect, incidental, special, 
            consequential, or punitive damages.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at support@lct.botpe.com
          </p>
        </section>
      </div>
    </div>
  )
}