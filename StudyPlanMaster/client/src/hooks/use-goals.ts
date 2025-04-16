import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Goal } from "@shared/schema";

export function useGoals() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const { toast } = useToast();
  
  // Fetch all goals
  const { 
    data: goals = [], 
    isLoading, 
    isError,
    refetch 
  } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });
  
  // Filter goals based on current filter
  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    if (filter === 'active') return !goal.completed;
    if (filter === 'completed') return goal.completed;
    return true;
  });
  
  // Sort by completion status and due date
  const sortedGoals = [...filteredGoals].sort((a, b) => {
    // First by completion status (incomplete first)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Then by due date if both have one (earlier dates first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    
    // Put goals with due dates before those without
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    // If no other sorting criteria, maintain original order
    return 0;
  });
  
  // Calculate progress
  const totalGoals = goals.length;
  const completedGoals = goals.filter(goal => goal.completed).length;
  const progressPercentage = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
  
  // CRUD operations
  const createGoal = useMutation({
    mutationFn: async (goal: Omit<Goal, 'id'>) => {
      const response = await apiRequest('POST', '/api/goals', goal);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Success",
        description: "Goal created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive"
      });
    }
  });
  
  const updateGoal = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Goal> }) => {
      const response = await apiRequest('PUT', `/api/goals/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Success",
        description: "Goal updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update goal",
        variant: "destructive"
      });
    }
  });
  
  const deleteGoal = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Success",
        description: "Goal deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive"
      });
    }
  });
  
  const toggleGoalCompletion = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/goals/${id}/toggle`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to toggle goal completion",
        variant: "destructive"
      });
    }
  });
  
  return {
    goals: sortedGoals,
    filter,
    setFilter,
    isLoading,
    isError,
    refetch,
    totalGoals,
    completedGoals,
    progressPercentage,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleGoalCompletion
  };
}
