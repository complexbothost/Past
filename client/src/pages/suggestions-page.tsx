import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSuggestionSchema, updateSuggestionResponseSchema, Suggestion } from "@shared/schema";

import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, MessageSquare, Check, X, Clock, ArrowUpCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type SuggestionFormValues = z.infer<typeof insertSuggestionSchema>;
type ResponseFormValues = z.infer<typeof updateSuggestionResponseSchema>;
type SuggestionStatus = "pending" | "approved" | "rejected" | "implemented";

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-500 border-green-500/30",
  rejected: "bg-red-500/20 text-red-500 border-red-500/30",
  implemented: "bg-blue-500/20 text-blue-500 border-blue-500/30",
};

const statusIcons = {
  pending: <Clock className="h-3.5 w-3.5 mr-1" />,
  approved: <Check className="h-3.5 w-3.5 mr-1" />,
  rejected: <X className="h-3.5 w-3.5 mr-1" />,
  implemented: <ArrowUpCircle className="h-3.5 w-3.5 mr-1" />,
};

export default function SuggestionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [activeTab, setActiveTab] = useState<string>("submit");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isAdmin = user?.isAdmin;

  // Form for creating a new suggestion
  const suggestionForm = useForm<SuggestionFormValues>({
    resolver: zodResolver(insertSuggestionSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Form for admin response
  const responseForm = useForm<ResponseFormValues>({
    resolver: zodResolver(updateSuggestionResponseSchema),
    defaultValues: {
      adminResponse: "",
      status: "pending",
    },
  });

  // Fetch user's suggestions
  const { data: userSuggestions, isLoading: isUserSuggestionsLoading, refetch: refetchUserSuggestions } = useQuery<Suggestion[]>({
    queryKey: ["/api/suggestions/user"],
    enabled: !!user,
  });

  // Fetch all suggestions (admin only)
  const { data: allSuggestions, isLoading: isAllSuggestionsLoading, refetch: refetchAllSuggestions } = useQuery<Suggestion[]>({
    queryKey: ["/api/suggestions"],
    enabled: !!isAdmin,
  });

  // Create suggestion mutation
  const createSuggestionMutation = useMutation({
    mutationFn: async (data: SuggestionFormValues) => {
      const res = await apiRequest("POST", "/api/suggestions", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Suggestion submitted",
        description: "Thank you for your feedback!",
      });
      suggestionForm.reset();
      refetchUserSuggestions();
      if (isAdmin) refetchAllSuggestions();
      setActiveTab("my-suggestions");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit suggestion",
        variant: "destructive",
      });
    },
  });

  // Respond to suggestion mutation (admin only)
  const respondToSuggestionMutation = useMutation({
    mutationFn: async (data: { id: number; response: ResponseFormValues }) => {
      const res = await apiRequest("PATCH", `/api/suggestions/${data.id}`, data.response);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Response submitted",
        description: "Your response has been saved",
      });
      responseForm.reset();
      setSelectedSuggestion(null);
      refetchAllSuggestions();
      refetchUserSuggestions();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit response",
        variant: "destructive",
      });
    },
  });

  const onSubmitSuggestion = (data: SuggestionFormValues) => {
    createSuggestionMutation.mutate(data);
  };

  const onSubmitResponse = (data: ResponseFormValues) => {
    if (!selectedSuggestion) return;
    respondToSuggestionMutation.mutate({
      id: selectedSuggestion.id,
      response: data,
    });
  };

  const selectSuggestionForResponse = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    // Convert the status string to the appropriate type
    const status = suggestion.status as SuggestionStatus || "pending";
    responseForm.setValue("status", status);
    responseForm.setValue("adminResponse", suggestion.adminResponse || "");
  };

  const filterSuggestions = (suggestions: Suggestion[] | undefined) => {
    if (!suggestions) return [];
    if (statusFilter === "all") return suggestions;
    return suggestions.filter(suggestion => suggestion.status === statusFilter);
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  // Render status badge
  const StatusBadge = ({ status }: { status: string }) => (
    <Badge variant="outline" className={`${statusColors[status as keyof typeof statusColors]} flex items-center px-2 py-0.5`}>
      {statusIcons[status as keyof typeof statusIcons]}
      <span className="capitalize">{status}</span>
    </Badge>
  );

  return (
    <PageLayout>
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 flex items-center justify-center mb-4">
            <Lightbulb className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Suggestions</h1>
          <p className="text-white/70 mt-2 text-center max-w-2xl">
            Share your ideas to improve Pastebin or request new features you'd like to see
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  {isAdmin ? "Manage Suggestions" : "Your Suggestions"}
                </CardTitle>
                <CardDescription className="text-white/70">
                  {isAdmin
                    ? "View and respond to user suggestions"
                    : "Submit new suggestions and track their status"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  defaultValue="submit"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-800">
                    <TabsTrigger value="submit" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                      Submit Suggestion
                    </TabsTrigger>
                    <TabsTrigger
                      value={isAdmin ? "all-suggestions" : "my-suggestions"}
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                    >
                      {isAdmin ? "All Suggestions" : "My Suggestions"}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="submit">
                    <Form {...suggestionForm}>
                      <form onSubmit={suggestionForm.handleSubmit(onSubmitSuggestion)} className="space-y-6">
                        <FormField
                          control={suggestionForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Brief title for your suggestion"
                                  className="bg-zinc-800 border-white/10 text-white"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={suggestionForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe your suggestion in detail..."
                                  className="min-h-[150px] bg-zinc-800 border-white/10 text-white"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-white/50">
                                Be specific and provide examples if possible
                              </FormDescription>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          disabled={createSuggestionMutation.isPending}
                        >
                          {createSuggestionMutation.isPending ? "Submitting..." : "Submit Suggestion"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value={isAdmin ? "all-suggestions" : "my-suggestions"}>
                    {isAdmin && (
                      <div className="mb-6">
                        <FormLabel className="text-white mb-2 block">Filter by Status</FormLabel>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-full md:w-[200px] bg-zinc-800 border-white/10 text-white">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-white/10 text-white">
                            <SelectItem value="all">All Suggestions</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="implemented">Implemented</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Display Suggestions */}
                    {(isAdmin ? isAllSuggestionsLoading : isUserSuggestionsLoading) ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-[120px] bg-zinc-800/50 rounded-lg animate-pulse"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filterSuggestions(isAdmin ? allSuggestions : userSuggestions)?.length === 0 ? (
                          <div className="py-12 text-center">
                            <AlertCircle className="h-12 w-12 text-white/30 mx-auto mb-4" />
                            <p className="text-white/70">
                              {isAdmin
                                ? "No suggestions found matching the selected filter"
                                : "You haven't submitted any suggestions yet"}
                            </p>
                          </div>
                        ) : (
                          filterSuggestions(isAdmin ? allSuggestions : userSuggestions)?.map((suggestion) => (
                            <Card key={suggestion.id} className="border-white/10 bg-zinc-800/50">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-lg text-white">{suggestion.title}</CardTitle>
                                    <div className="text-xs text-white/50 mt-1">
                                      Submitted on {formatDate(suggestion.createdAt)}
                                    </div>
                                  </div>
                                  <StatusBadge status={suggestion.status} />
                                </div>
                              </CardHeader>
                              <CardContent className="pt-2 pb-3">
                                <p className="text-white/80 whitespace-pre-line text-sm">{suggestion.content}</p>

                                {suggestion.adminResponse && (
                                  <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="h-4 w-4 text-purple-400" />
                                      <span className="text-sm font-medium text-purple-400">Admin Response</span>
                                    </div>
                                    <p className="text-white/80 text-sm whitespace-pre-line">{suggestion.adminResponse}</p>
                                  </div>
                                )}
                              </CardContent>
                              {isAdmin && !selectedSuggestion && (
                                <CardFooter>
                                  <Button
                                    variant="outline"
                                    className="w-full border-white/10 text-white hover:bg-white/5"
                                    onClick={() => selectSuggestionForResponse(suggestion)}
                                  >
                                    {suggestion.adminResponse ? "Update Response" : "Respond"}
                                  </Button>
                                </CardFooter>
                              )}
                            </Card>
                          ))
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Admin Response Panel */}
          <div className="lg:col-span-1">
            {isAdmin && selectedSuggestion ? (
              <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Respond to Suggestion</CardTitle>
                  <CardDescription className="text-white/70">
                    Review and respond to: {selectedSuggestion.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...responseForm}>
                    <form onSubmit={responseForm.handleSubmit(onSubmitResponse)} className="space-y-6">
                      <FormField
                        control={responseForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-zinc-800 border-white/10 text-white">
                                  <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-zinc-800 border-white/10 text-white">
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="implemented">Implemented</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={responseForm.control}
                        name="adminResponse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Response</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Write your response..."
                                className="min-h-[120px] bg-zinc-800 border-white/10 text-white"
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
                          className="flex-1 border-white/10 text-white hover:bg-white/5"
                          onClick={() => setSelectedSuggestion(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                          disabled={respondToSuggestionMutation.isPending}
                        >
                          {respondToSuggestionMutation.isPending ? "Saving..." : "Submit Response"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-purple-400" />
                    <CardTitle className="text-lg text-white">About Suggestions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-white/70 space-y-4 text-sm">
                  <p>
                    The suggestions system allows you to submit ideas for improving Pastebin or request new features you'd like to see.
                  </p>
                  <p>
                    Our team reviews all suggestions and will respond with updates on the status of your idea.
                  </p>
                  <div className="space-y-2 pt-2">
                    <p className="font-medium text-white">Status meanings:</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status="pending" />
                      <span>Being reviewed by our team</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status="approved" />
                      <span>Accepted for future implementation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status="rejected" />
                      <span>Not planned for implementation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status="implemented" />
                      <span>Added to the platform</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}