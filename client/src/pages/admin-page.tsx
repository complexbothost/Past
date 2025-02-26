import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Paste } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/page-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Users, FileText, Link, LockOpen, UserX, Shield, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPaste, setSelectedPaste] = useState<Paste | null>(null);
  
  // Get all users
  const { 
    data: users, 
    isLoading: usersLoading,
    refetch: refetchUsers
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Get all public pastes
  const { 
    data: pastes, 
    isLoading: pastesLoading,
    refetch: refetchPastes
  } = useQuery<Paste[]>({
    queryKey: ["/api/pastes"],
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "The user has been successfully deleted",
      });
      refetchUsers();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });
  
  // Update paste mutation
  const updatePasteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Paste> }) => {
      const res = await apiRequest("PATCH", `/api/admin/pastes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Paste updated",
        description: "The paste has been successfully updated",
      });
      refetchPastes();
      queryClient.invalidateQueries({ queryKey: ["/api/pastes/clown"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update paste",
        variant: "destructive",
      });
    },
  });
  
  // Delete paste mutation
  const deletePasteMutation = useMutation({
    mutationFn: async (pasteId: number) => {
      await apiRequest("DELETE", `/api/pastes/${pasteId}`);
    },
    onSuccess: () => {
      toast({
        title: "Paste deleted",
        description: "The paste has been successfully deleted",
      });
      refetchPastes();
      queryClient.invalidateQueries({ queryKey: ["/api/pastes/clown"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete paste",
        variant: "destructive",
      });
    },
  });
  
  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMM d, yyyy");
  };
  
  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };
  
  const handleMarkAsClown = (paste: Paste) => {
    updatePasteMutation.mutate({
      id: paste.id,
      data: { isClown: !paste.isClown }
    });
  };
  
  const handleDeletePaste = (pasteId: number) => {
    deletePasteMutation.mutate(pasteId);
  };
  
  if (!user?.isAdmin) {
    return (
      <PageLayout>
        <div className="container mx-auto py-16 flex justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users and pastes on your platform
          </p>
        </div>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid grid-cols-2 mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="pastes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pastes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : users && users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>{u.id}</TableCell>
                            <TableCell className="font-medium">{u.username}</TableCell>
                            <TableCell>{u.ipAddress || 'Unknown'}</TableCell>
                            <TableCell>
                              {u.isAdmin ? (
                                <Badge variant="outline" className="bg-primary/20 text-primary">
                                  Admin
                                </Badge>
                              ) : (
                                <Badge variant="outline">User</Badge>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(u.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              {u.id !== user.id && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <UserX className="h-4 w-4 mr-1" /> Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the user and all their pastes.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteUser(u.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found in the system.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pastes" className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Paste Management</CardTitle>
                <CardDescription>
                  Manage all pastes in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pastesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pastes && pastes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Private</TableHead>
                          <TableHead>Clown</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pastes.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{p.id}</TableCell>
                            <TableCell className="font-medium">{p.title}</TableCell>
                            <TableCell>{p.userId}</TableCell>
                            <TableCell>
                              {p.isPrivate ? (
                                <Badge variant="outline" className="bg-amber-900/20 text-amber-500">
                                  Private
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-900/20 text-green-500">
                                  Public
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Switch 
                                checked={p.isClown}
                                onCheckedChange={() => handleMarkAsClown(p)}
                              />
                            </TableCell>
                            <TableCell>{formatDate(p.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedPaste(p)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>{selectedPaste?.title}</DialogTitle>
                                      <DialogDescription>
                                        Paste ID: {selectedPaste?.id} | User ID: {selectedPaste?.userId}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="bg-zinc-900 p-4 rounded-md border border-zinc-800 mt-2 max-h-[400px] overflow-y-auto">
                                      <pre className="text-sm whitespace-pre-wrap break-words text-slate-200">
                                        {selectedPaste?.content}
                                      </pre>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                
                                <Button variant="outline" size="sm" asChild>
                                  <a href={`/paste/${p.id}`} target="_blank" rel="noopener noreferrer">
                                    <Link className="h-4 w-4" />
                                  </a>
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <UserX className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete this paste.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeletePaste(p.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No pastes found in the system.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
