import { Paste, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Lock, ExternalLink, Trash, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import RoleUsername from "@/components/role-username";

interface PasteCardProps {
  paste: Paste;
  onDelete?: () => void;
  showPrivateBadge?: boolean;
  isClown?: boolean;
}

export default function PasteCard({ paste, onDelete, showPrivateBadge = false, isClown = false }: PasteCardProps) {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch the author information
  const { data: author } = useQuery<User>({
    queryKey: [`/api/users/${paste.userId}`],
    // Only fetch if we're rendering the component (optimization)
    enabled: true,
    // Don't refetch on window focus for this data
    refetchOnWindowFocus: false,
    // Cache for longer as user data doesn't change often
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const canDelete = user && (user.id === paste.userId || user.isAdmin);

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/pastes/${paste.id}`);
      toast({
        title: "Paste deleted",
        description: "The paste has been successfully deleted",
      });
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete paste",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  return (
    <div className={`flex items-center justify-between py-2 px-4 hover:bg-zinc-800/50 rounded-lg transition-colors ${
      isClown ? 'bg-zinc-900/50' : 
      (paste.isPrivate && showPrivateBadge) ? 'bg-zinc-900/50' : ''
    }`}>
      <div className="flex items-center gap-6 min-w-0">
        <h3 
          className="text-lg font-medium hover:text-primary cursor-pointer transition-colors truncate"
          onClick={() => navigate(`/paste/${paste.id}`)}
        >
          {paste.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-zinc-400 whitespace-nowrap">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(paste.createdAt)}</span>
          <span>•</span>
          {author ? (
            <span className="flex items-center gap-1">
              <UserIcon className="h-3 w-3" />
              <RoleUsername user={author} />
            </span>
          ) : (
            <span>User #{paste.userId}</span>
          )}
          {(paste.isPrivate && showPrivateBadge) && (
            <Badge variant="outline" className="bg-zinc-800 text-white flex items-center gap-1">
              <Lock className="h-3 w-3" /> Private
            </Badge>
          )}
          {isClown && (
            <Badge variant="secondary" className="bg-zinc-800 text-white">
              Clown
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={() => navigate(`/paste/${paste.id}`)}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>

        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-white">
                <Trash className="h-3 w-3" />
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
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}