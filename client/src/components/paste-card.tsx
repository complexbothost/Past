import { Paste, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Lock, ExternalLink, Trash, User as UserIcon, Info } from "lucide-react";
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

  // Check if the paste is currently pinned (pinnedUntil time is in the future)
  const isPinned = paste.isPinned && paste.pinnedUntil && new Date(paste.pinnedUntil) > new Date();

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
    <div 
      className={`relative ${paste.isAdminPaste ? 'col-span-1 md:col-span-2 lg:col-span-3 admin-paste-container' : ''}`}
      style={paste.isAdminPaste ? {
        transform: 'scale(1.0)',
        margin: '1rem 0',
        transition: 'transform 0.3s ease',
      } : {}}
    >
      {/* Rainbow background and shooting stars for admin pastes */}
      {paste.isAdminPaste && (
        <>
          <div 
            className="absolute inset-0 rounded-lg z-0 rainbow-bg" 
          ></div>
          <div className="stars-container">
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
          </div>
        </>
      )}

      <div 
        className={`flex items-center justify-between py-2 px-4 hover:bg-zinc-800/50 rounded-lg transition-colors relative z-10 ${
          isClown ? 'bg-zinc-900/50' : 
          (paste.isPrivate && showPrivateBadge) ? 'bg-zinc-900/50' : ''
        } ${paste.isAdminPaste ? 'bg-zinc-900/70 border border-zinc-800 m-[2px]' : ''}`}
      >
        <div className="flex items-center gap-6 min-w-0">
          <h3 
            className={`text-lg font-medium hover:text-primary cursor-pointer transition-colors truncate ${paste.isAdminPaste ? 'text-xl' : ''}`}
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

      {/* Show extra details for admin pastes if available */}
      {paste.isAdminPaste && paste.extraDetails && (
        <div className="mt-2 px-4 py-3 bg-zinc-900/70 rounded-lg border border-zinc-800 text-sm relative z-10">
          <div className="flex items-center gap-2 mb-1 text-white">
            <Info className="h-4 w-4" />
            <span className="font-medium">Admin Note</span>
          </div>
          <p className="text-zinc-400">{paste.extraDetails}</p>
        </div>
      )}
    </div>
  );
}