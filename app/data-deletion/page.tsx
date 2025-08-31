export default function DataDeletionPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Data Deletion Request</h1>
      
      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">Request Data Deletion</h2>
          <p>
            If you would like to delete your data from LeadConnector, you can submit a request 
            and we will process it within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">What Data We Delete</h2>
          <p>Upon your request, we will delete:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Your account information</li>
            <li>Connected Facebook page data</li>
            <li>Lead data we&apos;ve collected from your Facebook campaigns</li>
            <li>Integration configurations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">How to Request Deletion</h2>
          <p>
            To request deletion of your data, please email us at support@lct.botpe.com with 
            the subject line &quot;Data Deletion Request&quot; and include:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Your email address associated with the account</li>
            <li>Your Facebook page name (if applicable)</li>
            <li>Confirmation that you want all your data deleted</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Processing Time</h2>
          <p>
            We will process your data deletion request within 30 days of receiving it. 
            You will receive a confirmation email once the deletion is complete.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Facebook Data Deletion</h2>
          <p>
            This page also serves as the data deletion callback URL for Facebook. 
            When users delete our app from their Facebook account, their data is automatically 
            queued for deletion from our systems.
          </p>
        </section>
      </div>
    </div>
  )
}