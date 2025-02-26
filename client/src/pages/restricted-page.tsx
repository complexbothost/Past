import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import PageLayout from "@/components/layout/page-layout";
import { useLocation } from "wouter";

export default function RestrictedPage() {
  const [_, navigate] = useLocation();

  return (
    <PageLayout>
      <div className="container mx-auto py-16 flex justify-center">
        <Card className="max-w-lg w-full bg-black border-white/5">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-red-500/10 mb-4 w-fit">
              <ShieldAlert className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-2xl">Access Restricted</CardTitle>
            <CardDescription className="text-white/70 mt-2">
              Your IP address has been restricted from accessing this site.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-white/60 mb-6">
              This may have happened for various reasons, including violation of our terms of service
              or suspicious activity detected from your IP address.
            </p>
            <p className="text-white/60">
              If you believe this is a mistake, please contact the site administrator
              with information about your account and circumstances.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-8">
            <Button variant="outline" className="bg-black border-white/10 hover:bg-zinc-900" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
}