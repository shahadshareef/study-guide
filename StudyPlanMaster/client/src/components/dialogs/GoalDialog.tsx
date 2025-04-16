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
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Goal } from "@shared/schema";

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
}

const formSchema = z.object({
  text: z.string().min(1, "Goal text is required"),
  completed: z.boolean().default(false),
  dueDate: z.date().optional(),
});

export default function GoalDialog({
  open,
  onOpenChange,
  goal,
}: GoalDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!goal;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      completed: false,
      dueDate: undefined,
    },
  });

  // Reset form when dialog opens with different goal
  useEffect(() => {
    if (open) {
      if (goal) {
        form.reset({
          text: goal.text,
          completed: goal.completed,
          dueDate: goal.dueDate ? new Date(goal.dueDate) : undefined,
        });
      } else {
        form.reset({
          text: "",
          completed: false,
          dueDate: undefined,
        });
      }
    }
  }, [open, goal, form]);

  const createGoalMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload = {
        text: data.text,
        completed: data.completed,
        dueDate: data.dueDate,
        userId: 1, // Using demo user id
      };
      
      const response = await apiRequest("POST", "/api/goals", payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Goal created",
        description: "Your goal has been added to your list.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof formSchema> }) => {
      const payload = {
        text: data.text,
        completed: data.completed,
        dueDate: data.dueDate,
      };
      
      const response = await apiRequest("PUT", `/api/goals/${id}`, payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Goal updated",
        description: "Your goal has been updated.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (isEditMode && goal) {
      updateGoalMutation.mutate({ id: goal.id, data });
    } else {
      createGoalMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Goal" : "Add New Goal"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Complete math assignment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date (optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="completed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Mark as completed
                    </FormLabel>
                  </div>
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
                disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
              >
                {isEditMode ? "Update Goal" : "Save Goal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
