import { Paste } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Lock, ExternalLink, Trash, FileText } from "lucide-react";
import { format } from "date-fns";

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

  const truncateContent = (content: string, maxLength = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className={`py-3 px-4 hover:bg-zinc-800/50 rounded-lg transition-colors ${
      isClown ? 'bg-zinc-900/50' : 
      (paste.isPrivate && showPrivateBadge) ? 'bg-zinc-900/50' : ''
    }`}>
      <div className="flex justify-between items-start gap-4 mb-2">
        <div>
          <h3 
            className="text-lg font-medium hover:text-primary cursor-pointer transition-colors"
            onClick={() => navigate(`/paste/${paste.id}`)}
          >
            {paste.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(paste.createdAt)}</span>
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

        <div className="flex items-center gap-2">
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

      <div className="bg-zinc-900 p-3 rounded-md border border-zinc-800">
        <pre className="text-xs whitespace-pre-wrap text-white">
          {truncateContent(paste.content)}
        </pre>
      </div>
    </div>
  );
}