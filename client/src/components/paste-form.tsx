import { useState } from "react";
import { insertPasteSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter"; // Import useLocation for navigation

interface PasteFormProps {
  onSuccess?: () => void;
  skipRedirect?: boolean; // New prop to optionally skip redirect
}

type FormValues = z.infer<typeof insertPasteSchema>;

export default function PasteForm({ onSuccess, skipRedirect }: PasteFormProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const [_, navigate] = useLocation(); // Get the navigate function for redirection

  const form = useForm<FormValues>({
    resolver: zodResolver(insertPasteSchema),
    defaultValues: {
      title: "",
      content: "",
      isPrivate: false,
      isAdminPaste: false,
      isPinned: false,
      extraDetails: "",
    },
  });

  const createPasteMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Calculate pinnedUntil date (24 hours from now) if isPinned is true
      const pasteData = { ...data };

      const res = await apiRequest("POST", "/api/pastes", pasteData);
      return res.json();
    },
    onSuccess: (data) => {
      // Reset the form
      form.reset();

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/pastes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/pastes"] });

      // If onSuccess callback is provided, call it (for dialog-based scenarios)
      if (onSuccess) {
        onSuccess();
      } 
      // If skipRedirect is not true, navigate to the newly created paste
      else if (!skipRedirect) {
        navigate(`/paste/${data.id}`);
      }
    },
  });

  const onSubmit = (data: FormValues) => {
    // Only include admin fields if user is admin
    if (isAdmin) {
      createPasteMutation.mutate(data);
    } else {
      // Strip out admin-only fields if somehow included
      const { isAdminPaste, isPinned, extraDetails, ...regularData } = data;
      createPasteMutation.mutate(regularData as FormValues);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter a title for your paste" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter your paste content here..."
                  className="min-h-[150px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPrivate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Private Paste</FormLabel>
                <FormDescription>
                  Only you will be able to see this paste
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Admin-only options */}
        {isAdmin && (
          <>
            <Separator className="my-4" />
            <div className="p-3 border rounded-lg border-white/20 bg-zinc-900">
              <h3 className="text-sm font-medium mb-2">Admin Options</h3>

              <FormField
                control={form.control}
                name="isAdminPaste"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between mb-2">
                    <div className="space-y-0.5">
                      <FormLabel>Admin Paste</FormLabel>
                      <FormDescription>
                        Highlight with rainbow colors and make 2x larger
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPinned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between mb-2">
                    <div className="space-y-0.5">
                      <FormLabel>Pin to Top</FormLabel>
                      <FormDescription>
                        Pin this paste to the top for 24 hours
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="extraDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extra Details</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add extra information for this admin paste..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={createPasteMutation.isPending}
        >
          {createPasteMutation.isPending ? "Creating..." : "Create Paste"}
        </Button>
      </form>
    </Form>
  );
}