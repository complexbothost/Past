import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Paste } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input component
import PageLayout from "@/components/layout/page-layout";
import PasteForm from "@/components/paste-form";
import PasteCard from "@/components/paste-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, User, ScrollText, Search } from "lucide-react"; // Import Search icon
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // Add state for search query
  const [isSearching, setIsSearching] = useState(false); // Add state to track if user is searching

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

  // Add query for search results
  const {
    data: searchResults,
    isLoading: searchResultsLoading,
    error: searchResultsError,
    refetch: refetchSearchResults
  } = useQuery<Paste[]>({
    queryKey: [`/api/pastes/search?q=${encodeURIComponent(searchQuery)}`],
    enabled: isSearching && searchQuery.trim().length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      refetchSearchResults();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

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
            Pastebin
          </h1>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10">
                <Plus className="h-4 w-4" />
                New Paste
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[375px] bg-zinc-900 border-white/10 p-3">
              <DialogHeader className="space-y-2 pb-2">
                <DialogTitle className="text-lg">Create New Paste</DialogTitle>
              </DialogHeader>
              <PasteForm onSuccess={handlePasteCreated} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Add search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pastes by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700"
            />
          </div>
          <Button type="submit" className="bg-zinc-800 hover:bg-zinc-700 border border-white/10">
            Search
          </Button>
          {isSearching && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClearSearch}
              className="border-zinc-700"
            >
              Clear
            </Button>
          )}
        </form>

        {/* Display search results if searching */}
        {isSearching ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Search Results</h2>
              <Button variant="link" onClick={handleClearSearch} className="text-zinc-400">
                Back to All Pastes
              </Button>
            </div>

            {searchResultsLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 text-white">Loading...</div>
              </div>
            ) : searchResultsError ? (
              <div className="text-center py-8 text-red-400">Error searching pastes</div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((paste) => (
                  <PasteCard 
                    key={paste.id} 
                    paste={paste} 
                    onDelete={() => {
                      refetchSearchResults();
                      refetchPublicPastes();
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/50">
                No pastes found matching "{searchQuery}"
              </div>
            )}
          </div>
        ) : (
          // Regular tabs view (only shown when not searching)
          <Tabs defaultValue="public" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8 bg-zinc-900/70">
              <TabsTrigger value="public" className="flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                <ScrollText className="h-4 w-4" />
                Public Pastes
              </TabsTrigger>
              <TabsTrigger value="my-pastes" className="flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                <User className="h-4 w-4" />
                My Pastes
              </TabsTrigger>
              <TabsTrigger value="clown" className="flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                <FileText className="h-4 w-4" />
                Clown Pastes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="public" className="pt-2">
              {publicPastesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 text-white">Loading...</div>
                </div>
              ) : publicPastesError ? (
                <div className="text-center py-8 text-red-400">Error loading pastes</div>
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
                <div className="text-center py-12 text-white/50">
                  No public pastes available yet. Be the first to create one!
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-pastes" className="pt-2">
              {userPastesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 text-white">Loading...</div>
                </div>
              ) : userPastesError ? (
                <div className="text-center py-8 text-red-400">Error loading your pastes</div>
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
                <div className="text-center py-12 text-white/50">
                  You haven't created any pastes yet.
                </div>
              )}
            </TabsContent>

            <TabsContent value="clown" className="pt-2">
              {clownPastesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 text-white">Loading...</div>
                </div>
              ) : clownPastesError ? (
                <div className="text-center py-8 text-red-400">Error loading clown pastes</div>
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
                <div className="text-center py-12 text-white/50">
                  No clown pastes available yet.
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageLayout>
  );
}