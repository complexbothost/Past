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
import { useLocation } from "wouter";

interface PasteFormProps {
  onSuccess?: () => void;
  skipRedirect?: boolean;
}

type FormValues = z.infer<typeof insertPasteSchema>;

export default function PasteForm({ onSuccess, skipRedirect }: PasteFormProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const [_, navigate] = useLocation();

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
      const pasteData = { ...data };
      const res = await apiRequest("POST", "/api/pastes", pasteData);
      return res.json();
    },
    onSuccess: (data) => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/pastes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/pastes"] });
      if (onSuccess) {
        onSuccess();
      } else if (!skipRedirect) {
        navigate(`/paste/${data.id}`);
      }
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isAdmin) {
      createPasteMutation.mutate(data);
    } else {
      const { isAdminPaste, isPinned, extraDetails, ...regularData } = data;
      createPasteMutation.mutate(regularData as FormValues);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-sm">Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter title" className="h-8" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-sm">Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter content..."
                  className="min-h-[100px] resize-none text-sm"
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPrivate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 space-y-0">
              <div>
                <FormLabel className="text-sm">Private Paste</FormLabel>
                <FormDescription className="text-xs">
                  Only you can see this paste
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

        {isAdmin && (
          <>
            <Separator className="my-2" />
            <div className="p-2 border rounded-lg border-white/20 bg-zinc-900 space-y-2">
              <h3 className="text-xs font-medium">Admin Options</h3>

              <FormField
                control={form.control}
                name="isAdminPaste"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <FormLabel className="text-sm">Admin Paste</FormLabel>
                      <FormDescription className="text-xs">
                        Rainbow highlight & 2x size
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
                  <FormItem className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <FormLabel className="text-sm">Pin to Top</FormLabel>
                      <FormDescription className="text-xs">
                        Pin for 24 hours
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
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">Extra Details</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add admin note..."
                        className="min-h-[60px] resize-none text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        <Button 
          type="submit" 
          className="w-full h-8 text-sm"
          disabled={createPasteMutation.isPending}
        >
          {createPasteMutation.isPending ? "Creating..." : "Create Paste"}
        </Button>
      </form>
    </Form>
  );
}