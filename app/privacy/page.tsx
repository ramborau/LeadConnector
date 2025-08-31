export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose max-w-none space-y-6">
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
          <p>
            When you use our LeadConnector service, we collect information you provide directly to us, such as:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Name and email address (from Facebook login)</li>
            <li>Profile picture (from Facebook login)</li>
            <li>Facebook page information you choose to connect</li>
            <li>Lead data from your Facebook Lead Ads</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Process and manage your Facebook Lead Ads data</li>
            <li>Send lead information to your connected integrations</li>
            <li>Communicate with you about our services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Facebook Data</h2>
          <p>
            We only access Facebook data that you explicitly authorize through Facebook&apos;s OAuth process.
            We do not store unnecessary Facebook data and only use it for the purposes you&apos;ve consented to.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at support@lct.botpe.com
          </p>
        </section>
      </div>
    </div>
  )
}