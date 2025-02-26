import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Paste } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Eye, Lock, Trash } from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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

  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <Button variant="outline" className="mb-6" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pastes
        </Button>

        <Card className="border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold mb-2">{paste.title}</CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(paste.createdAt)}
                  </span>
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
            <div className="bg-zinc-900 p-5 rounded-md border border-zinc-800 overflow-x-auto">
              <pre className="text-sm whitespace-pre-wrap break-words text-white">
                {paste.content}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}