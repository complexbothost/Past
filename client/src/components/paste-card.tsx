import { Paste } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className={`h-full flex flex-col border-zinc-800 ${
      isClown ? 'bg-zinc-900' : 
      (paste.isPrivate && showPrivateBadge) ? 'bg-zinc-900' : ''
    }`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-bold">{paste.title}</CardTitle>
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
        <CardDescription className="flex items-center gap-1 text-xs">
          <Calendar className="h-3 w-3" />
          {formatDate(paste.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="bg-zinc-900 p-3 rounded-md border border-zinc-800 h-28 overflow-hidden">
          <pre className="text-xs whitespace-pre-wrap text-white">
            {truncateContent(paste.content)}
          </pre>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={() => navigate(`/paste/${paste.id}`)}
        >
          <ExternalLink className="h-3 w-3 mr-1" /> View Full
        </Button>

        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-white">
                <Trash className="h-3 w-3 mr-1" /> Delete
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
      </CardFooter>
    </Card>
  );
}