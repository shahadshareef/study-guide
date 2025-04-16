import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Flashcard } from "@shared/schema";

interface FlashcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashcard?: Flashcard | null;
}

const formSchema = z.object({
  front: z.string().min(1, "Front content is required"),
  back: z.string().min(1, "Back content is required"),
  tag: z.string().optional(),
});

export default function FlashcardDialog({
  open,
  onOpenChange,
  flashcard,
}: FlashcardDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!flashcard;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      front: "",
      back: "",
      tag: "",
    },
  });

  // Reset form when dialog opens with different flashcard
  useEffect(() => {
    if (open) {
      if (flashcard) {
        form.reset({
          front: flashcard.front,
          back: flashcard.back,
          tag: flashcard.tag || "",
        });
      } else {
        form.reset({
          front: "",
          back: "",
          tag: "",
        });
      }
    }
  }, [open, flashcard, form]);

  const createFlashcardMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload = {
        front: data.front,
        back: data.back,
        tag: data.tag || null,
        userId: 1, // Using demo user id
      };
      
      const response = await apiRequest("POST", "/api/flashcards", payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards'] });
      toast({
        title: "Flashcard created",
        description: "Your flashcard has been added to your collection.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create flashcard. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateFlashcardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof formSchema> }) => {
      const payload = {
        front: data.front,
        back: data.back,
        tag: data.tag || null,
      };
      
      const response = await apiRequest("PUT", `/api/flashcards/${id}`, payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards'] });
      toast({
        title: "Flashcard updated",
        description: "Your flashcard has been updated.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update flashcard. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (isEditMode && flashcard) {
      updateFlashcardMutation.mutate({ id: flashcard.id, data });
    } else {
      createFlashcardMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Flashcard" : "Create New Flashcard"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Front Side</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Question or term" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="back"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Back Side</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Answer or definition" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Biology, Chapter 5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createFlashcardMutation.isPending || updateFlashcardMutation.isPending}
              >
                {isEditMode ? "Update Card" : "Save Card"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
