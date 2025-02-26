import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Shield } from "lucide-react";

export default function TOSPage() {
  return (
    <PageLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">
            Terms of Service
          </h1>
          <Shield className="h-6 w-6 text-white" />
        </div>

        <Card className="mb-8 border-white/10 bg-zinc-900/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> 
              DoxNightmare Terms of Service
            </CardTitle>
            <CardDescription>
              Last Updated: February 26, 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-white/80 leading-relaxed">
              Welcome to DoxNightmare. By accessing and using our platform, you agree to comply with and be bound by the following terms and conditions.
            </p>

            <Separator className="my-6 bg-white/10" />

            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              By accessing or using DoxNightmare, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
            </p>

            <h2 className="text-xl font-semibold text-white mb-4">2. User Responsibilities</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Users are responsible for all content they post on the platform. You agree not to use DoxNightmare to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/80 mb-4">
              <li>Post illegal, harmful, threatening, abusive, or otherwise objectionable content</li>
              <li>Impersonate any person or entity or falsely state or misrepresent your affiliation</li>
              <li>Upload or share content that infringes upon intellectual property rights</li>
              <li>Distribute malware, viruses, or any code designed to interfere with our platform</li>
              <li>Collect or harvest user information without explicit consent</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mb-4">3. Content Rights and Ownership</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Users retain ownership of all content they post to the platform. However, by posting content, you grant DoxNightmare a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display the content in connection with providing the service.
            </p>

            <h2 className="text-xl font-semibold text-white mb-4">4. Privacy</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Our Privacy Policy describes how we collect, use, and disclose information about you when you use our platform. By using DoxNightmare, you agree to our collection and use of information as outlined in the Privacy Policy.
            </p>

            <h2 className="text-xl font-semibold text-white mb-4">5. Account Security</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use of your account.
            </p>

            <h2 className="text-xl font-semibold text-white mb-4">6. Termination</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              We reserve the right to terminate or suspend your account and access to DoxNightmare at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.
            </p>

            <h2 className="text-xl font-semibold text-white mb-4">7. Changes to Terms</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              We may revise these Terms of Service at any time by updating this page. Your continued use of the platform after such changes constitutes your acceptance of the new terms.
            </p>

            <h2 className="text-xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              DoxNightmare is provided "as is" without warranties of any kind, either express or implied. We do not guarantee that the platform will be error-free or uninterrupted.
            </p>

            <h2 className="text-xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              To the fullest extent permitted by law, DoxNightmare shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the platform.
            </p>

            <h2 className="text-xl font-semibold text-white mb-4">10. Contact Information</h2>
            <p className="text-white/80 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at support@doxnightmare.com.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
