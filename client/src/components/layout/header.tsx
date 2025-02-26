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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, LogOut, Shield, Plus, Users, Code, User, Menu, FileTerminal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import PasteForm from "@/components/paste-form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

  const NavLinks = () => (
    <>
      <Link href="/">
        <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
          <FileText className="h-4 w-4 mr-2" />
          Pastes
        </Button>
      </Link>
      <Link href="/users">
        <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
          <Users className="h-4 w-4 mr-2" />
          Users
        </Button>
      </Link>
      <Link href="/tos">
        <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
          <FileTerminal className="h-4 w-4 mr-2" />
          Terms of Service
        </Button>
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-900/80 backdrop-blur-lg">
      <div className="container max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-600 to-zinc-800">
              <Code className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              DoxNightmare
            </span>
          </Link>

          <div className="hidden md:flex space-x-1">
            <NavLinks />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-zinc-900 border-white/5">
              <div className="flex flex-col space-y-4 mt-8">
                <NavLinks />
                <Button 
                  variant="default" 
                  className="w-full gap-2" 
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  New Paste
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 hidden md:flex bg-zinc-800 hover:bg-zinc-700 border border-white/10">
                <Plus className="h-4 w-4" />
                New Paste
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] bg-zinc-900 border-white/10">
              <DialogHeader>
                <DialogTitle>Create New Paste</DialogTitle>
              </DialogHeader>
              <PasteForm onSuccess={handlePasteCreated} />
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full overflow-hidden">
                <Avatar className="h-8 w-8 border border-white/10">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                  ) : (
                    <AvatarFallback className="bg-zinc-800 text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-zinc-900 border-white/10" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">{user.username}</p>
                  <p className="text-xs leading-none text-white/50">
                    {user.isAdmin ? 'Administrator' : 'Member'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={() => navigate(`/user/${user.id}`)} className="text-white/70 hover:text-white focus:text-white">
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/")} className="text-white/70 hover:text-white focus:text-white">
                <FileText className="mr-2 h-4 w-4" />
                <span>My Pastes</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreateDialogOpen(true)} className="md:hidden text-white/70 hover:text-white focus:text-white">
                <Plus className="mr-2 h-4 w-4" />
                <span>New Paste</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/tos")} className="text-white/70 hover:text-white focus:text-white">
                <FileTerminal className="mr-2 h-4 w-4" />
                <span>Terms of Service</span>
              </DropdownMenuItem>
              {user.isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/admin")} className="text-white/70 hover:text-white focus:text-white">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Admin Panel</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={handleLogout} className="text-white/70 hover:text-white focus:text-white">
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