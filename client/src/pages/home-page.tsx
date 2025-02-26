import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Paste } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layout/page-layout";
import PasteForm from "@/components/paste-form";
import PasteCard from "@/components/paste-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, FileText, User, ScrollText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch public pastes
  const { 
    data: publicPastes, 
    isLoading: publicPastesLoading,
    error: publicPastesError,
    refetch: refetchPublicPastes
  } = useQuery<Paste[]>({
    queryKey: ["/api/pastes"],
  });

  // Fetch user's pastes
  const { 
    data: userPastes, 
    isLoading: userPastesLoading,
    error: userPastesError,
    refetch: refetchUserPastes
  } = useQuery<Paste[]>({
    queryKey: ["/api/user/pastes"],
  });

  // Fetch clown pastes
  const { 
    data: clownPastes, 
    isLoading: clownPastesLoading,
    error: clownPastesError
  } = useQuery<Paste[]>({
    queryKey: ["/api/pastes/clown"],
  });

  const handlePasteCreated = () => {
    setCreateDialogOpen(false);
    refetchPublicPastes();
    refetchUserPastes();
    toast({
      title: "Paste created",
      description: "Your paste was successfully created",
    });
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              DoxNightmare
            </span>
          </h1>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Paste
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Paste</DialogTitle>
              </DialogHeader>
              <PasteForm onSuccess={handlePasteCreated} />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="public" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="public" className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              Public Pastes
            </TabsTrigger>
            <TabsTrigger value="my-pastes" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              My Pastes
            </TabsTrigger>
            <TabsTrigger value="clown" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Clown Pastes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="public" className="pt-2">
            {publicPastesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : publicPastesError ? (
              <div className="text-center py-8 text-destructive">Error loading pastes</div>
            ) : publicPastes && publicPastes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicPastes.map((paste) => (
                  <PasteCard 
                    key={paste.id} 
                    paste={paste} 
                    onDelete={() => refetchPublicPastes()}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No public pastes available yet. Be the first to create one!
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-pastes" className="pt-2">
            {userPastesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : userPastesError ? (
              <div className="text-center py-8 text-destructive">Error loading your pastes</div>
            ) : userPastes && userPastes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPastes.map((paste) => (
                  <PasteCard 
                    key={paste.id} 
                    paste={paste} 
                    onDelete={() => refetchUserPastes()}
                    showPrivateBadge
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                You haven't created any pastes yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="clown" className="pt-2">
            {clownPastesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : clownPastesError ? (
              <div className="text-center py-8 text-destructive">Error loading clown pastes</div>
            ) : clownPastes && clownPastes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clownPastes.map((paste) => (
                  <PasteCard 
                    key={paste.id} 
                    paste={paste} 
                    onDelete={() => refetchPublicPastes()}
                    isClown
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No clown pastes available yet.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
