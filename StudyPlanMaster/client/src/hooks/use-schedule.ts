import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays, subDays, startOfDay, endOfDay } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TimeSlot } from "@shared/schema";

export function useSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();
  
  // Format date for API query
  const dateString = format(currentDate, 'yyyy-MM-dd');
  
  // Fetch time slots for the current date
  const { 
    data: timeSlots = [], 
    isLoading, 
    isError,
    refetch 
  } = useQuery<TimeSlot[]>({
    queryKey: ['/api/time-slots', dateString],
  });
  
  // Navigation functions
  const goToNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };
  
  const goToPrevDay = () => {
    setCurrentDate(prev => subDays(prev, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Set a specific date
  const setDate = (date: Date) => {
    setCurrentDate(date);
  };
  
  // CRUD operations
  const createTimeSlot = useMutation({
    mutationFn: async (timeSlot: Omit<TimeSlot, 'id'>) => {
      const response = await apiRequest('POST', '/api/time-slots', timeSlot);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots'] });
      toast({
        title: "Success",
        description: "Study session created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create study session",
        variant: "destructive"
      });
    }
  });
  
  const updateTimeSlot = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TimeSlot> }) => {
      const response = await apiRequest('PUT', `/api/time-slots/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots'] });
      toast({
        title: "Success",
        description: "Study session updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update study session",
        variant: "destructive"
      });
    }
  });
  
  const deleteTimeSlot = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/time-slots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots'] });
      toast({
        title: "Success",
        description: "Study session deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete study session",
        variant: "destructive"
      });
    }
  });
  
  // Get time recommendations
  const { data: recommendation } = useQuery({
    queryKey: ['/api/recommendations'],
  });
  
  // Sort time slots by start time
  const sortedTimeSlots = [...timeSlots].sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
  
  return {
    currentDate,
    timeSlots: sortedTimeSlots,
    isLoading,
    isError,
    refetch,
    recommendation,
    goToNextDay,
    goToPrevDay,
    goToToday,
    setDate,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot
  };
}
