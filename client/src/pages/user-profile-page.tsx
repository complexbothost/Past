import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Paste, Comment } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import PasteCard from "@/components/paste-card";
import { ArrowLeft, User as UserIcon, AtSign, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";

const bioFormSchema = z.object({
  bio: z.string().max(500, "Bio must be 500 characters or less"),
});

const commentFormSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment must be 1000 characters or less"),
});

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = parseInt(id);

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
    refetch: refetchPastes
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
  const bioForm = useForm<z.infer<typeof bioFormSchema>>({
    resolver: zodResolver(bioFormSchema),
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

  // Update form defaults when user data loads
  useState(() => {
    if (profileUser) {
      bioForm.reset({ bio: profileUser.bio || "" });
    }
  }, [profileUser]);

  const onBioSubmit = (data: z.infer<typeof bioFormSchema>) => {
    updateBioMutation.mutate(data);
  };

  const onCommentSubmit = (data: z.infer<typeof commentFormSchema>) => {
    addCommentMutation.mutate(data);
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  if (isUserLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto py-16 flex justify-center">
          <div className="h-8 w-8 text-primary">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (userError || !profileUser) {
    return (
      <PageLayout>
        <div className="container mx-auto py-8">
          <Button variant="outline" className="mb-6" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-destructive">
                {userError ? "Error loading user profile" : "User not found"}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const isOwnProfile = user?.id === profileUser.id;
  const isAdmin = user?.isAdmin;

  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <Button variant="outline" className="mb-6" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <div className="md:col-span-1">
            <Card className="border-zinc-800">
              <CardHeader className="pb-2">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-zinc-800 text-white text-2xl">
                      {profileUser.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl font-bold text-center">
                  {profileUser.username}
                </CardTitle>
                <CardDescription className="text-center">
                  {profileUser.isAdmin && (
                    <span className="text-white bg-zinc-800 px-2 py-1 rounded text-xs">
                      Admin
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center text-zinc-400 text-sm gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {formatDate(profileUser.createdAt)}</span>
                  </div>

                  <div className="border-t border-zinc-800 pt-4">
                    <h3 className="font-medium mb-2">Bio</h3>
                    {isOwnProfile || isAdmin ? (
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
                                    className="resize-none h-32"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            size="sm"
                            disabled={updateBioMutation.isPending}
                          >
                            {updateBioMutation.isPending ? "Saving..." : "Save Bio"}
                          </Button>
                        </form>
                      </Form>
                    ) : (
                      <p className="text-sm text-zinc-300">
                        {profileUser.bio || "This user hasn't written a bio yet."}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments section */}
            <Card className="mt-6 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-xl">Comments</CardTitle>
              </CardHeader>
              <CardContent>
                {user && (
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
                                className="resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={addCommentMutation.isPending}
                      >
                        {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                      </Button>
                    </form>
                  </Form>
                )}

                {isCommentsLoading ? (
                  <div className="py-4 text-center">
                    <div className="h-8 w-8 text-primary mx-auto">Loading...</div>
                  </div>
                ) : commentsError ? (
                  <div className="py-4 text-center text-destructive">
                    Error loading comments
                  </div>
                ) : comments && comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-t border-zinc-800 pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-zinc-800 text-white text-xs">
                              {/* Would need a way to get the commenter's username */}
                              U
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-xs text-zinc-400">
                            User #{comment.userId} • {format(new Date(comment.createdAt), "MMM d, yyyy")}
                          </div>
                        </div>
                        <p className="text-sm text-zinc-300">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-zinc-400">
                    No comments yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User's pastes */}
          <div className="md:col-span-2">
            <Card className="border-zinc-800">
              <CardHeader>
                <CardTitle className="text-xl">
                  {profileUser.username}'s Pastes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPastesLoading ? (
                  <div className="py-8 text-center">
                    <div className="h-8 w-8 text-primary mx-auto">Loading...</div>
                  </div>
                ) : pastesError ? (
                  <div className="py-8 text-center text-destructive">
                    Error loading pastes
                  </div>
                ) : userPastes && userPastes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {userPastes.map((paste) => (
                      <PasteCard 
                        key={paste.id} 
                        paste={paste} 
                        onDelete={refetchPastes}
                        showPrivateBadge={true}
                        isClown={paste.isClown}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-400">
                    No pastes found
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