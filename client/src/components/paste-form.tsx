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
import { Loader2 } from "lucide-react";

interface PasteFormProps {
  onSuccess?: () => void;
}

type FormValues = z.infer<typeof insertPasteSchema>;

export default function PasteForm({ onSuccess }: PasteFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(insertPasteSchema),
    defaultValues: {
      title: "",
      content: "",
      isPrivate: false,
    },
  });

  const createPasteMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/pastes", data);
      return res.json();
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/pastes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/pastes"] });
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  const onSubmit = (data: FormValues) => {
    createPasteMutation.mutate(data);
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
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={createPasteMutation.isPending}
        >
          {createPasteMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Paste"
          )}
        </Button>
      </form>
    </Form>
  );
}
