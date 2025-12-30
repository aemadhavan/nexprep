import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export const metadata = {
  title: "Cookie Policy - NexPrep",
  description: "Learn about how NexPrep uses cookies and similar technologies to enhance your experience.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What Are Cookies?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Cookies are small text files that are placed on your device when you visit our website.
              They help us provide you with a better experience by remembering your preferences and
              understanding how you use our site.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How We Use Cookies</CardTitle>
            <CardDescription>
              NexPrep uses cookies through Google Tag Manager and Google Analytics to improve your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Our Cookie Implementation</h3>
              <p className="mb-3">
                We implement Google Consent Mode v2, which ensures that cookies are only set with your
                explicit consent. By default, all non-essential cookies are blocked until you provide consent.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3">Categories of Cookies We Use</h3>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Essential</Badge>
                    <h4 className="font-semibold">Strictly Necessary Cookies</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    These cookies are essential for the website to function properly. They enable core
                    functionality such as security, authentication, and network management.
                  </p>
                  <div className="text-sm">
                    <strong>Consent Required:</strong> No (Always Active)
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>Analytics</Badge>
                    <h4 className="font-semibold">Analytics Cookies</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    These cookies help us understand how visitors interact with our website by collecting
                    and reporting information anonymously.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Provider:</strong> Google Analytics (GA4)
                    </div>
                    <div>
                      <strong>Measurement ID:</strong> G-SYSZQQRBC6
                    </div>
                    <div>
                      <strong>Purpose:</strong> Website analytics, user behavior tracking, performance monitoring
                    </div>
                    <div>
                      <strong>Consent Required:</strong> Yes (analytics_storage)
                    </div>
                    <div>
                      <strong>Data Collected:</strong> Page views, session duration, user interactions, device information
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>Advertising</Badge>
                    <h4 className="font-semibold">Advertising Cookies</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    These cookies are used to deliver advertisements relevant to you and your interests.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Provider:</strong> Google Tag Manager
                    </div>
                    <div>
                      <strong>Container ID:</strong> GTM-MJ43C7TS
                    </div>
                    <div>
                      <strong>Purpose:</strong> Ad targeting, remarketing, conversion tracking
                    </div>
                    <div>
                      <strong>Consent Required:</strong> Yes (ad_storage, ad_user_data, ad_personalization)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3">Google Consent Mode v2</h3>
              <p className="mb-3">
                We use Google Consent Mode v2 (Advanced Implementation), which manages four types of consent:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="list-disc">
                  <strong>ad_storage:</strong> Controls storage of cookies for advertising purposes
                </li>
                <li className="list-disc">
                  <strong>ad_user_data:</strong> Controls sending user data related to advertising to Google
                </li>
                <li className="list-disc">
                  <strong>ad_personalization:</strong> Controls whether data can be used for personalized advertising
                </li>
                <li className="list-disc">
                  <strong>analytics_storage:</strong> Controls storage of cookies for analytics purposes
                </li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                By default, all four consent types are set to "denied" until you explicitly accept cookies through our consent banner.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Cookie Choices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Managing Your Consent</h3>
              <p className="mb-3">
                When you first visit NexPrep, you'll see a cookie consent banner at the bottom of the page.
                You can choose to:
              </p>
              <ul className="space-y-2 ml-6 mb-4">
                <li className="list-disc">
                  <strong>Accept All:</strong> Allows all cookies including analytics and advertising
                </li>
                <li className="list-disc">
                  <strong>Reject All:</strong> Blocks all non-essential cookies
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Your choice is stored locally in your browser and will be remembered on future visits.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Changing Your Mind</h3>
              <p className="mb-3">
                You can change your cookie preferences at any time by:
              </p>
              <ol className="space-y-2 ml-6">
                <li className="list-decimal">
                  Clearing your browser's local storage for nexprep.com
                </li>
                <li className="list-decimal">
                  Refreshing the page to see the consent banner again
                </li>
                <li className="list-decimal">
                  Making a new selection
                </li>
              </ol>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Browser Settings</h3>
              <p className="mb-3">
                Most web browsers allow you to control cookies through their settings. You can typically:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="list-disc">View what cookies are stored and delete them individually</li>
                <li className="list-disc">Block third-party cookies</li>
                <li className="list-disc">Block all cookies</li>
                <li className="list-disc">Delete all cookies when you close your browser</li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Note: Blocking all cookies may impact your ability to use some features of our website.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Google Tag Manager</h3>
              <p className="mb-2">
                We use Google Tag Manager (GTM-MJ43C7TS) to manage tracking tags on our website.
                GTM itself doesn't collect personal data but facilitates the deployment of other tracking services.
              </p>
              <Link
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Google Privacy Policy →
              </Link>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Google Analytics</h3>
              <p className="mb-2">
                We use Google Analytics 4 (G-SYSZQQRBC6) to analyze how visitors use our website.
                This helps us improve our services and user experience.
              </p>
              <div className="space-y-2">
                <Link
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm block"
                >
                  How Google uses data when you use our partners' sites →
                </Link>
                <Link
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm block"
                >
                  Google Analytics Opt-out Browser Add-on →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3">
              Cookie data is retained according to the following schedules:
            </p>
            <ul className="space-y-2 ml-6">
              <li className="list-disc">
                <strong>Consent Preferences:</strong> Stored locally until you clear your browser data
              </li>
              <li className="list-disc">
                <strong>Google Analytics:</strong> User-level and event-level data retained for 14 months (Google default)
              </li>
              <li className="list-disc">
                <strong>Session Cookies:</strong> Deleted when you close your browser
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Updates to This Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or
              for other operational, legal, or regulatory reasons. We encourage you to review this policy
              periodically to stay informed about how we use cookies.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us.
            </p>
            <div className="space-y-2">
              <Link href="/" className="text-primary hover:underline block">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
