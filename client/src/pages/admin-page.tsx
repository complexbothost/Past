import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Paste, UserRole } from "@shared/schema";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { Users, FileText, Link, LockOpen, UserX, Shield, Eye, Edit, User as UserIcon, Pin, PinOff } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RoleUsername from "@/components/role-username";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [selectedPaste, setSelectedPaste] = useState<Paste | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [pasteToEdit, setPasteToEdit] = useState<Paste | null>(null);

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
      setIsEditDialogOpen(false);
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

  // Edit paste form schema
  const editPasteSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    isPrivate: z.boolean().default(false),
    isClown: z.boolean().default(false),
    isAdminPaste: z.boolean().default(false),
    isPinned: z.boolean().default(false),
    extraDetails: z.string().optional(),
  });

  // Edit paste form
  const editPasteForm = useForm<z.infer<typeof editPasteSchema>>({
    resolver: zodResolver(editPasteSchema),
    defaultValues: {
      title: "",
      content: "",
      isPrivate: false,
      isClown: false,
      isAdminPaste: false,
      isPinned: false,
      extraDetails: "",
    },
  });

  // Handle opening edit dialog
  const handleEditPaste = (paste: Paste) => {
    setPasteToEdit(paste);
    editPasteForm.reset({
      title: paste.title,
      content: paste.content,
      isPrivate: paste.isPrivate,
      isClown: paste.isClown,
      isAdminPaste: paste.isAdminPaste || false,
      isPinned: paste.isPinned || false,
      extraDetails: paste.extraDetails || "",
    });
    setIsEditDialogOpen(true);
  };

  // Handle submit edit form
  const onSubmitEditForm = (data: z.infer<typeof editPasteSchema>) => {
    if (pasteToEdit) {
      // Calculate pinnedUntil if the paste is being pinned
      let updateData = { ...data };

      if (data.isPinned) {
        // Set pinnedUntil to 24 hours from now
        const pinnedUntil = new Date();
        pinnedUntil.setHours(pinnedUntil.getHours() + 24);
        updateData.pinnedUntil = pinnedUntil;
      } else {
        // Clear pinnedUntil if unpinning
        updateData.pinnedUntil = null;
      }

      updatePasteMutation.mutate({
        id: pasteToEdit.id,
        data: updateData,
      });
    }
  };

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

  const handleTogglePin = (paste: Paste) => {
    // If currently pinned, unpin it
    if (paste.isPinned) {
      updatePasteMutation.mutate({
        id: paste.id,
        data: { 
          isPinned: false,
          pinnedUntil: null
        }
      });
    } 
    // If not pinned, pin it for 24 hours
    else {
      const pinnedUntil = new Date();
      pinnedUntil.setHours(pinnedUntil.getHours() + 24);

      updatePasteMutation.mutate({
        id: paste.id,
        data: { 
          isPinned: true,
          pinnedUntil: pinnedUntil
        }
      });
    }
  };

  const handleToggleAdminPaste = (paste: Paste) => {
    updatePasteMutation.mutate({
      id: paste.id,
      data: { 
        isAdminPaste: !paste.isAdminPaste,
        // If turning on admin paste, also include any existing extraDetails
        extraDetails: paste.extraDetails || ""
      }
    });
  };

  const handleDeletePaste = (pasteId: number) => {
    deletePasteMutation.mutate(pasteId);
  };

  const navigateToUserProfile = (userId: number) => {
    navigate(`/user/${userId}`);
  };

  if (!user?.isAdmin) {
    return (
      <PageLayout>
        <div className="container mx-auto py-16 flex justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-white mx-auto mb-4" />
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
                    <div className="h-8 w-8 text-primary">Loading...</div>
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
                            <TableCell className="font-medium">
                              <Button
                                variant="link"
                                className="p-0 h-auto font-medium"
                                onClick={() => navigateToUserProfile(u.id)}
                              >
                                <RoleUsername user={u} />
                              </Button>
                            </TableCell>
                            <TableCell>{u.ipAddress || 'Unknown'}</TableCell>
                            <TableCell>
                              <Select
                                value={u.role || "none"}
                                onValueChange={(value) => {
                                  apiRequest("PATCH", `/api/admin/users/${u.id}/role`, {
                                    role: value === "none" ? null : value
                                  }).then(() => {
                                    refetchUsers();
                                    toast({
                                      title: "Role updated",
                                      description: `Updated role for ${u.username}`,
                                    });
                                  }).catch((error) => {
                                    toast({
                                      title: "Error",
                                      description: error.message || "Failed to update role",
                                      variant: "destructive",
                                    });
                                  });
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No Role</SelectItem>
                                  <SelectItem value={UserRole.RICH}>Rich</SelectItem>
                                  <SelectItem value={UserRole.FRAUD}>Fraud</SelectItem>
                                  <SelectItem value={UserRole.GANG}>Gang</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>{formatDate(u.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigateToUserProfile(u.id)}
                                >
                                  <UserIcon className="h-4 w-4 mr-1" /> Profile
                                </Button>

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
                              </div>
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
                    <div className="h-8 w-8 text-primary">Loading...</div>
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
                          <TableHead>Admin/Clown</TableHead>
                          <TableHead>Pin Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pastes.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{p.id}</TableCell>
                            <TableCell className="font-medium">{p.title}</TableCell>
                            <TableCell>
                              <Button
                                variant="link"
                                className="p-0 h-auto"
                                onClick={() => navigateToUserProfile(p.userId)}
                              >
                                {p.userId}
                              </Button>
                            </TableCell>
                            <TableCell>
                              {p.isPrivate ? (
                                <Badge variant="outline" className="bg-zinc-900 text-white">
                                  Private
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-zinc-900 text-white">
                                  Public
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Switch
                                    checked={p.isClown}
                                    onCheckedChange={() => handleMarkAsClown(p)}
                                  />
                                  <span className="text-xs">Clown</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <Switch
                                    checked={p.isAdminPaste}
                                    onCheckedChange={() => handleToggleAdminPaste(p)}
                                  />
                                  <span className="text-xs">Admin</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {p.isPinned && p.pinnedUntil && new Date(p.pinnedUntil) > new Date() ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTogglePin(p)}
                                    className="flex items-center gap-1"
                                  >
                                    <PinOff className="h-4 w-4" /> Unpin
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTogglePin(p)}
                                    className="flex items-center gap-1"
                                  >
                                    <Pin className="h-4 w-4" /> Pin (24h)
                                  </Button>
                                )}
                              </div>
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
                                      <pre className="text-sm whitespace-pre-wrap break-words text-white">
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

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditPaste(p)}
                                >
                                  <Edit className="h-4 w-4" />
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

        {/* Edit Paste Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Paste</DialogTitle>
              <DialogDescription>
                Make changes to the paste content
              </DialogDescription>
            </DialogHeader>

            <Form {...editPasteForm}>
              <form onSubmit={editPasteForm.handleSubmit(onSubmitEditForm)} className="space-y-4">
                <FormField
                  control={editPasteForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Paste title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editPasteForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste content..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 flex-wrap">
                  <FormField
                    control={editPasteForm.control}
                    name="isPrivate"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Private</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editPasteForm.control}
                    name="isClown"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Mark as Clown</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editPasteForm.control}
                    name="isAdminPaste"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Admin Paste</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editPasteForm.control}
                    name="isPinned"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Pin for 24h</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editPasteForm.control}
                  name="extraDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Extra Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Extra details for admin paste..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatePasteMutation.isPending}
                  >
                    {updatePasteMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}