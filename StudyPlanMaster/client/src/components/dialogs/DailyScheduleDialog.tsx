import { useState } from "react";
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
  DialogDescription,
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

interface DailyScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
}

type TimeBlockType = {
  activity: string;
  startTime: string;
  endTime: string;
};

const formSchema = z.object({
  wakeUpTime: z.string().min(1, "Wake up time is required"),
  sleepTime: z.string().min(1, "Sleep time is required"),
  studyHoursGoal: z.number().min(1).max(12),
  maxSessionLength: z.number().min(30).max(180),
  breakLength: z.number().min(5).max(30),
  timeBlocks: z.array(
    z.object({
      activity: z.string(),
      startTime: z.string(),
      endTime: z.string()
    })
  ).optional().default([])
});

export default function DailyScheduleDialog({
  open,
  onOpenChange,
  selectedDate,
}: DailyScheduleDialogProps) {
  const { toast } = useToast();
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockType[]>([
    { activity: "", startTime: "", endTime: "" }
  ]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wakeUpTime: "07:00",
      sleepTime: "23:00",
      studyHoursGoal: 4,
      maxSessionLength: 60,
      breakLength: 15,
      timeBlocks: [{ activity: "", startTime: "", endTime: "" }]
    },
  });

  const addTimeBlock = () => {
    setTimeBlocks([...timeBlocks, { activity: "", startTime: "", endTime: "" }]);
    const currentBlocks = form.getValues("timeBlocks") || [];
    form.setValue("timeBlocks", [...currentBlocks, { activity: "", startTime: "", endTime: "" }]);
  };

  const removeTimeBlock = (index: number) => {
    const newBlocks = [...timeBlocks];
    newBlocks.splice(index, 1);
    setTimeBlocks(newBlocks);
    
    const currentFormBlocks = form.getValues("timeBlocks") || [];
    const newFormBlocks = [...currentFormBlocks];
    newFormBlocks.splice(index, 1);
    form.setValue("timeBlocks", newFormBlocks);
  };

  // Handle time block changes
  const handleTimeBlockChange = (index: number, field: keyof TimeBlockType, value: string) => {
    const newBlocks = [...timeBlocks];
    newBlocks[index] = {
      ...newBlocks[index],
      [field]: value
    };
    setTimeBlocks(newBlocks);
    
    const currentBlocks = form.getValues("timeBlocks") || [];
    const newFormBlocks = [...currentBlocks];
    newFormBlocks[index] = {
      ...newFormBlocks[index],
      [field]: value
    };
    form.setValue("timeBlocks", newFormBlocks);
  };

  const generateScheduleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Prepare the payload with user's daily schedule
      const dateToUse = selectedDate || new Date();
      const payload = {
        date: dateToUse.toISOString().split('T')[0],
        wakeUpTime: data.wakeUpTime,
        sleepTime: data.sleepTime,
        studyHoursGoal: data.studyHoursGoal,
        maxSessionLength: data.maxSessionLength,
        breakLength: data.breakLength,
        timeBlocks: data.timeBlocks,
        userId: 1, // Demo user
      };
      
      // Call the API to generate recommended study time slots
      const response = await apiRequest("POST", "/api/generate-schedule", payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots'] });
      toast({
        title: "Schedule generated",
        description: "Your study schedule has been created based on your daily routine.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    generateScheduleMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Your Daily Schedule</DialogTitle>
          <DialogDescription>
            Enter your daily routine to generate optimized study time slots.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="wakeUpTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wake Up Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sleepTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sleep Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="studyHoursGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Study Hours Goal: {field.value} hours</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={12}
                      step={0.5}
                      defaultValue={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxSessionLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Session Length: {field.value} minutes</FormLabel>
                    <FormControl>
                      <Slider
                        min={30}
                        max={180}
                        step={15}
                        defaultValue={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="breakLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Break Length: {field.value} minutes</FormLabel>
                    <FormControl>
                      <Slider
                        min={5}
                        max={30}
                        step={5}
                        defaultValue={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-semibold">Daily Activities (Classes, Work, etc.)</h3>
                <Button type="button" variant="outline" size="sm" onClick={addTimeBlock}>
                  Add Activity
                </Button>
              </div>
              
              {timeBlocks.map((block, index) => (
                <div key={index} className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Activity</FormLabel>
                    <Input 
                      placeholder="Class, Work, Lunch, etc."
                      value={block.activity}
                      onChange={(e) => handleTimeBlockChange(index, "activity", e.target.value)}
                    />
                  </div>
                  <div>
                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Start Time</FormLabel>
                    <Input 
                      type="time" 
                      value={block.startTime}
                      onChange={(e) => handleTimeBlockChange(index, "startTime", e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-grow">
                      <FormLabel className={index !== 0 ? "sr-only" : ""}>End Time</FormLabel>
                      <Input 
                        type="time" 
                        value={block.endTime}
                        onChange={(e) => handleTimeBlockChange(index, "endTime", e.target.value)}
                      />
                    </div>
                    {timeBlocks.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        className="self-end"
                        onClick={() => removeTimeBlock(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
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
                disabled={generateScheduleMutation.isPending}
              >
                Generate Schedule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}