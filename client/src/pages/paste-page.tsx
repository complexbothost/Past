import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Paste, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Eye, Lock, Trash, User as UserIcon, Info } from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import RoleUsername from "@/components/role-username";

export default function PastePage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: paste,
    isLoading,
    error,
    refetch
  } = useQuery<Paste>({
    queryKey: [`/api/pastes/${id}`],
  });

  // Get paste author
  const {
    data: pasteAuthor,
    isLoading: authorLoading
  } = useQuery<User>({
    queryKey: [paste ? `/api/users/${paste.userId}` : null],
    enabled: !!paste
  });

  const handleDeletePaste = async () => {
    try {
      await apiRequest("DELETE", `/api/pastes/${id}`);
      toast({
        title: "Paste deleted",
        description: "The paste has been successfully deleted",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete paste",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto py-16 flex justify-center">
          <div className="h-8 w-8 text-primary">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !paste) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8">
          <Button variant="outline" className="mb-6" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pastes
          </Button>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-destructive">
                {error ? "Error loading paste" : "Paste not found"}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const isOwner = user?.id === paste.userId;
  const isAdmin = user?.isAdmin;
  const canDelete = isOwner || isAdmin;

  // Check if the paste is currently pinned (pinnedUntil time is in the future)
  const isPinned = paste.isPinned && paste.pinnedUntil && new Date(paste.pinnedUntil) > new Date();

  // Create rainbow animation styles for admin pastes
  const rainbowStyle = paste.isAdminPaste ? {
    background: 'linear-gradient(-45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
    backgroundSize: '400% 400%',
    animation: 'rainbow-bg 3s ease infinite',
    padding: '3px', // Border thickness
    borderRadius: '0.5rem',
  } : {};

  return (
    <PageLayout>
      <style>
        {`
        @keyframes rainbow-bg {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        `}
      </style>

      <div className="container mx-auto py-8">
        <Button variant="outline" className="mb-6" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pastes
        </Button>

        <div className={`relative ${paste.isAdminPaste ? 'transform scale-125 my-12' : ''}`}>
          {/* Rainbow border for admin pastes */}
          {paste.isAdminPaste && (
            <div 
              className="absolute inset-0 rounded-lg z-0" 
              style={rainbowStyle}
            ></div>
          )}

          <Card className={`border-zinc-800 relative z-10 ${paste.isAdminPaste ? 'bg-zinc-900 border-0 m-[3px]' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className={`${paste.isAdminPaste ? 'text-3xl' : 'text-2xl'} font-bold mb-2`}>
                    {paste.title}
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(paste.createdAt)}
                    </span>
                    {pasteAuthor ? (
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <RoleUsername user={pasteAuthor} />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        User #{paste.userId}
                      </span>
                    )}
                    {paste.isPrivate && (
                      <span className="flex items-center gap-1 text-white">
                        <Lock className="h-4 w-4" />
                        Private
                      </span>
                    )}
                    {paste.isClown && (
                      <Badge variant="secondary" className="bg-zinc-800 text-white">
                        Clown
                      </Badge>
                    )}
                    {isPinned && (
                      <Badge variant="outline" className="bg-zinc-800 text-white">
                        Pinned
                      </Badge>
                    )}
                    {paste.isAdminPaste && (
                      <Badge variant="outline" className="bg-black text-white border-white">
                        Admin
                      </Badge>
                    )}
                  </CardDescription>
                </div>

                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the paste.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePaste}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Admin paste extra details */}
              {paste.isAdminPaste && paste.extraDetails && (
                <div className="mb-4 p-3 bg-zinc-800/50 rounded-md border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2 text-white">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">Admin Note</span>
                  </div>
                  <p className="text-zinc-300">{paste.extraDetails}</p>
                </div>
              )}

              <div className="bg-zinc-900 p-5 rounded-md border border-zinc-800 overflow-x-auto">
                <pre className={`text-sm whitespace-pre-wrap break-words text-white ${paste.isAdminPaste ? 'text-base' : ''}`}>
                  {paste.content}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}