import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Paste, Comment, updateBioSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import PasteCard from "@/components/paste-card";
import { Calendar, User as UserIcon, Pencil, Camera, ChevronLeft, MessageSquare, Shield, FileText } from "lucide-react";
import { format } from "date-fns";
import RoleUsername from "@/components/role-username";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const commentFormSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment must be 1000 characters or less"),
});

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = parseInt(id);
  const [isEditingBio, setIsEditingBio] = useState(false);

  // User profile data
  const {
    data: profileUser,
    isLoading: isUserLoading,
    error: userError,
    refetch: refetchUser
  } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });

  // User's pastes
  const {
    data: userPastes,
    isLoading: isPastesLoading,
    error: pastesError,
  } = useQuery<Paste[]>({
    queryKey: [`/api/users/${userId}/pastes`],
  });

  // User's comments
  const {
    data: comments,
    isLoading: isCommentsLoading,
    error: commentsError,
    refetch: refetchComments
  } = useQuery<Comment[]>({
    queryKey: [`/api/users/${userId}/comments`],
  });

  // Update bio mutation
  const updateBioMutation = useMutation({
    mutationFn: async (data: { bio: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/bio`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bio updated",
        description: "Your bio has been updated successfully",
      });
      setIsEditingBio(false);
      refetchUser();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bio",
        variant: "destructive",
      });
    },
  });

  // Update avatar mutation
  const updateAvatarMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest("POST", `/api/users/${userId}/avatar`, formData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully",
      });
      refetchUser();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile picture",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const res = await apiRequest("POST", `/api/users/${userId}/comments`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
      refetchComments();
      commentForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Bio form
  const bioForm = useForm<z.infer<typeof updateBioSchema>>({
    resolver: zodResolver(updateBioSchema),
    defaultValues: {
      bio: profileUser?.bio || "",
    },
  });

  // Comment form
  const commentForm = useForm<z.infer<typeof commentFormSchema>>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const onBioSubmit = (data: z.infer<typeof updateBioSchema>) => {
    updateBioMutation.mutate(data);
  };

  const onCommentSubmit = (data: z.infer<typeof commentFormSchema>) => {
    addCommentMutation.mutate(data);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('avatar', file);
      updateAvatarMutation.mutate(formData);
    }
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  if (isUserLoading) {
    return (
      <PageLayout>
        <div className="container max-w-7xl mx-auto py-16 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-black/50 border border-white/5 animate-pulse"></div>
            <div className="h-8 w-48 bg-black/50 border border-white/5 rounded mt-4 animate-pulse"></div>
            <div className="h-4 w-24 bg-black/50 border border-white/5 rounded mt-2 animate-pulse"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (userError || !profileUser) {
    return (
      <PageLayout>
        <div className="container max-w-7xl mx-auto py-8 px-4">
          <Button 
            variant="outline" 
            className="mb-6 border-white/10 text-white/70 hover:bg-black hover:text-white bg-black" 
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Card className="border-white/10 bg-black">
            <CardContent className="pt-6">
              <div className="text-center py-8 text-red-400">
                {userError ? "Error loading user profile" : "User not found"}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const isOwnProfile = user?.id === profileUser.id;

  return (
    <PageLayout>
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <Button 
          variant="outline" 
          className="mb-6 border-white/10 text-white/70 hover:bg-black hover:text-white bg-black" 
          onClick={() => navigate("/")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-white/10 bg-black overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-purple-600/10 to-indigo-600/10"></div>
              <div className="-mt-12 px-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-black">
                      {profileUser.avatarUrl ? (
                        <AvatarImage src={profileUser.avatarUrl} alt={profileUser.username} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 text-white text-2xl">
                          {profileUser.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {isOwnProfile && (
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 p-2 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-700 transition-colors"
                      >
                        <Camera className="h-4 w-4 text-white" />
                        <input
                          id="avatar-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <h2 className="text-2xl font-bold text-white">
                    <RoleUsername user={profileUser} />
                  </h2>

                  {profileUser.isAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30">
                      <Shield className="h-3 w-3 mr-1" />
                      Administrator
                    </span>
                  )}

                  <div className="flex items-center justify-center text-white/50 text-sm gap-2 mt-3">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {formatDate(profileUser.createdAt)}</span>
                  </div>
                </div>

                <Separator className="my-6 bg-white/10" />

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">Bio</h3>
                    {isOwnProfile && !isEditingBio && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingBio(true)}
                        className="text-white/50 hover:text-white hover:bg-white/5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {isOwnProfile && isEditingBio ? (
                    <Form {...bioForm}>
                      <form onSubmit={bioForm.handleSubmit(onBioSubmit)} className="space-y-4">
                        <FormField
                          control={bioForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us about yourself..." 
                                  className="resize-none bg-black border-white/10 text-white"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingBio(false)}
                            className="border-white/10 text-white/70 hover:bg-white/5 bg-black"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={updateBioMutation.isPending}
                          >
                            {updateBioMutation.isPending ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <p className="text-sm text-white/70">
                      {profileUser.bio || "This user hasn't written a bio yet."}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Comments section */}
            <Card className="mt-6 border-white/10 bg-black">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                  <CardTitle className="text-xl text-white">Comments</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {/* Comment form - now available to everyone */}
                <Form {...commentForm}>
                  <form onSubmit={commentForm.handleSubmit(onCommentSubmit)} className="space-y-4 mb-6">
                    <FormField
                      control={commentForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Leave a comment..." 
                              className="resize-none bg-black border-white/10 text-white"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={addCommentMutation.isPending}
                    >
                      {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                    </Button>
                  </form>
                </Form>

                {isCommentsLoading ? (
                  <div className="py-4 space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-black/50 border border-white/5 animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-24 bg-black/50 border border-white/5 rounded animate-pulse"></div>
                          <div className="h-16 bg-black/50 border border-white/5 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : commentsError ? (
                  <div className="py-4 text-center text-red-400">
                    Error loading comments
                  </div>
                ) : comments && comments.length > 0 ? (
                  <div className="space-y-6">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-t border-white/10 pt-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 text-white text-xs">
                              {comment.userId === 0 ? 'A' : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">
                              {comment.userId === 0 ? 'Anonymous' : `User #${comment.userId}`}
                            </div>
                            <div className="text-xs text-white/50">
                              {format(new Date(comment.createdAt), "MMM d, yyyy")}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-white/80 ml-11">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black/50 border border-white/10 mb-3">
                      <MessageSquare className="h-6 w-6 text-white/30" />
                    </div>
                    <p className="text-white/50">No comments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User's pastes */}
          <div className="lg:col-span-3">
            <Card className="border-white/10 bg-black">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-400" />
                  <CardTitle className="text-xl text-white">
                    {profileUser.username}'s Pastes
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isPastesLoading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-28 bg-black/50 border border-white/5 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : pastesError ? (
                  <div className="py-8 text-center text-red-400">
                    Error loading pastes
                  </div>
                ) : userPastes && userPastes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {userPastes.map((paste) => (
                      <PasteCard 
                        key={paste.id} 
                        paste={paste} 
                        showPrivateBadge={true}
                        isClown={paste.isClown}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black/50 border border-white/10 mb-4">
                      <FileText className="h-8 w-8 text-white/30" />
                    </div>
                    <p className="text-white/50">No pastes found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}