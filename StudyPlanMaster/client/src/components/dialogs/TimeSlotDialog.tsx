import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TimeSlot } from "@shared/schema";

interface TimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeSlot?: TimeSlot | null;
  selectedDate?: Date;
}

const formSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  startTime: z.string().min(1, "Start time is required"),
  duration: z.number().min(1, "Duration is required"),
  notes: z.string().optional(),
  color: z.string().min(1, "Color is required"),
});

const colors = [
  { value: "indigo", label: "Indigo" },
  { value: "violet", label: "Violet" },
  { value: "orange", label: "Orange" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
  { value: "blue", label: "Blue" },
];

const durations = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
];

export default function TimeSlotDialog({
  open,
  onOpenChange,
  timeSlot,
  selectedDate,
}: TimeSlotDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!timeSlot;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      startTime: "09:00",
      duration: 60,
      notes: "",
      color: "indigo",
    },
  });

  // Reset form when dialog opens with different timeSlot
  useEffect(() => {
    if (open) {
      if (timeSlot) {
        const date = new Date(timeSlot.startTime);
        form.reset({
          subject: timeSlot.subject,
          startTime: format(date, "HH:mm"),
          duration: timeSlot.duration,
          notes: timeSlot.notes || "",
          color: timeSlot.color,
        });
      } else {
        form.reset({
          subject: "",
          startTime: "09:00",
          duration: 60,
          notes: "",
          color: "indigo",
        });
      }
    }
  }, [open, timeSlot, form]);

  const createTimeSlotMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const dateToUse = selectedDate || new Date();
      const [hours, minutes] = data.startTime.split(":").map(Number);
      
      const startTime = new Date(dateToUse);
      startTime.setHours(hours, minutes, 0, 0);
      
      const payload = {
        subject: data.subject,
        startTime,
        duration: data.duration,
        notes: data.notes,
        color: data.color,
        userId: 1, // Using demo user id
      };
      
      const response = await apiRequest("POST", "/api/time-slots", payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots'] });
      toast({
        title: "Study session created",
        description: "Your study session has been added to your schedule.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create study session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTimeSlotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof formSchema> }) => {
      const currentTimeSlot = timeSlot as TimeSlot;
      const currentDate = new Date(currentTimeSlot.startTime);
      const [hours, minutes] = data.startTime.split(":").map(Number);
      
      const startTime = new Date(currentDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const payload = {
        subject: data.subject,
        startTime,
        duration: data.duration,
        notes: data.notes,
        color: data.color,
      };
      
      const response = await apiRequest("PUT", `/api/time-slots/${id}`, payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots'] });
      toast({
        title: "Study session updated",
        description: "Your study session has been updated.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update study session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (isEditMode && timeSlot) {
      updateTimeSlotMutation.mutate({ id: timeSlot.id, data });
    } else {
      createTimeSlotMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Study Session" : "Add Study Session"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Calculus, English Literature" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value.toString()}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {durations.map((duration) => (
                          <SelectItem key={duration.value} value={duration.value.toString()}>
                            {duration.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What do you plan to study?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center">
                            <div 
                              className={`w-4 h-4 rounded-full mr-2 bg-${color.value}-200`}
                              style={{ backgroundColor: `var(--${color.value}-200, #c7d2fe)` }}
                            ></div>
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                disabled={createTimeSlotMutation.isPending || updateTimeSlotMutation.isPending}
              >
                {isEditMode ? "Update Session" : "Add Session"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
