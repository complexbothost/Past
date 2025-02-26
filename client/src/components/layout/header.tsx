import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, LogOut, Shield, Menu, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import PasteForm from "@/components/paste-form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Header() {
  const [_, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handlePasteCreated = () => {
    setCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/pastes"] });
    queryClient.invalidateQueries({ queryKey: ["/api/user/pastes"] });
    toast({
      title: "Paste created",
      description: "Your paste was successfully created",
    });
  };

  if (!user) return null;

  return (
    <header className="bg-zinc-900 border-b border-zinc-800">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-white">
          <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            DoxNightmare
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 hidden sm:flex">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                {user.username}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/")}>
                <FileText className="mr-2 h-4 w-4" />
                <span>My Pastes</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreateDialogOpen(true)} className="sm:hidden">
                <Plus className="mr-2 h-4 w-4" />
                <span>New Paste</span>
              </DropdownMenuItem>
              {user.isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Admin Panel</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
