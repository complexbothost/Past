import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/page-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollText, UserPlus, Crown, Pin, Shield, MessageCircle } from "lucide-react";
import { SiDiscord } from "react-icons/si";

export default function ShopPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const copyDiscordToClipboard = () => {
    navigator.clipboard.writeText("@tylire").then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Discord username copied to clipboard",
      });
    });
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">DoxNightmare Shop</h1>
          <p className="text-muted-foreground">
            Purchase premium roles and special paste features
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">How to purchase</h2>
          </div>
          <p className="text-zinc-400 mb-3">
            All purchases must be completed manually by contacting our admin on Discord.
            After payment is confirmed, your purchase will be activated.
          </p>
          <div className="flex items-center gap-2">
            <SiDiscord className="h-5 w-5 text-[#5865F2]" />
            <code className="bg-zinc-950 px-3 py-1 rounded font-mono text-white">@tylire</code>
            <Button variant="outline" size="sm" onClick={copyDiscordToClipboard}>
              Copy
            </Button>
          </div>
        </div>

        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid grid-cols-2 mb-8">
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              User Roles
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              Special Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fraud Role */}
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <div className="h-2 bg-red-600"></div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Fraud Role</CardTitle>
                    <Badge className="bg-red-600 text-white">$5</Badge>
                  </div>
                  <CardDescription>
                    Get recognized as a Fraud member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Fraud badge next to your name
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Access to fraud-only features
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Distinctive profile appearance
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2" onClick={copyDiscordToClipboard}>
                    <SiDiscord className="h-4 w-4" />
                    Contact to Purchase
                  </Button>
                </CardFooter>
              </Card>

              {/* Gang Role */}
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <div className="h-2 bg-blue-600"></div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Gang Role</CardTitle>
                    <Badge className="bg-blue-600 text-white">$10</Badge>
                  </div>
                  <CardDescription>
                    Join the Gang with exclusive benefits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Gang badge next to your name
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Create up to 10 private pastes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Priority customer support
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2" onClick={copyDiscordToClipboard}>
                    <SiDiscord className="h-4 w-4" />
                    Contact to Purchase
                  </Button>
                </CardFooter>
              </Card>

              {/* Rich Role */}
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <div className="h-2 bg-yellow-500"></div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Rich Role</CardTitle>
                    <Badge className="bg-yellow-500 text-black font-medium">$25</Badge>
                  </div>
                  <CardDescription>
                    Premium status with elite benefits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Rich golden badge next to your name
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Unlimited private pastes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> One free 24-hour pinned paste
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> VIP status in community
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2" onClick={copyDiscordToClipboard}>
                    <SiDiscord className="h-4 w-4" />
                    Contact to Purchase
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 72h Pinned Paste */}
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <div className="h-2 bg-purple-600"></div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">72h Pinned Paste</CardTitle>
                    <Badge className="bg-purple-600 text-white">$50</Badge>
                  </div>
                  <CardDescription>
                    Get your paste featured at the top for 72 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Your paste pinned at the top of public feeds
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Special pinned indicator badge
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Maximum visibility for 72 hours
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Applies to any paste of your choice
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2" onClick={copyDiscordToClipboard}>
                    <SiDiscord className="h-4 w-4" />
                    Contact to Purchase
                  </Button>
                </CardFooter>
              </Card>

              {/* Admin Paste */}
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Admin Paste</CardTitle>
                    <Badge className="bg-black border border-white text-white">$100</Badge>
                  </div>
                  <CardDescription>
                    Premium admin-styled paste with special effects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Exclusive admin styling with rainbow effects
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Admin badge on your paste
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Permanently featured in special collections
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Add custom admin notes to your paste
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Extra-large display size
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2" onClick={copyDiscordToClipboard}>
                    <SiDiscord className="h-4 w-4" />
                    Contact to Purchase
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
