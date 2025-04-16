import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash, CheckCircle, Circle } from "lucide-react";
import GoalDialog from "@/components/dialogs/GoalDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Goal as GoalType } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Goals() {
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalType | null>(null);
  const { toast } = useToast();

  // Get all goals
  const { data: goals = [], isLoading } = useQuery<GoalType[]>({
    queryKey: ['/api/goals'],
  });

  // Toggle goal completion mutation
  const toggleGoalMutation = useMutation({
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
        description: "Failed to update the goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/goals/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Goal deleted",
        description: "The goal has been removed from your list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleGoal = (id: number) => {
    toggleGoalMutation.mutate(id);
  };

  const handleEditGoal = (goal: GoalType) => {
    setEditingGoal(goal);
    setShowGoalDialog(true);
  };

  const handleDeleteGoal = (id: number) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      deleteGoalMutation.mutate(id);
    }
  };

  // Calculate completion percentage
  const completedGoals = goals.filter(goal => goal.completed).length;
  const goalProgress = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  // Separate active and completed goals
  const activeGoals = goals.filter(goal => !goal.completed);
  const completedGoalsList = goals.filter(goal => goal.completed);

  return (
    <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Goals</h1>
        <Button onClick={() => {
          setEditingGoal(null);
          setShowGoalDialog(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add Goal
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Goal Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{completedGoals} of {goals.length} completed</span>
            </div>
            <Progress value={goalProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Goals</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="py-4 text-center text-muted-foreground">Loading goals...</div>
              ) : activeGoals.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">
                  No active goals. Add a new goal to get started!
                </div>
              ) : (
                <ul className="space-y-2">
                  {activeGoals.map(goal => (
                    <li key={goal.id} className="flex items-start p-3 hover:bg-gray-50 rounded-md">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-0.5 h-5 w-5 p-0 mr-3"
                        onClick={() => handleToggleGoal(goal.id)}
                      >
                        <Circle className="h-5 w-5" />
                      </Button>
                      <div className="flex-grow">
                        <p className="text-sm font-medium">{goal.text}</p>
                        {goal.dueDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {format(new Date(goal.dueDate), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="flex">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditGoal(goal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="py-4 text-center text-muted-foreground">Loading goals...</div>
              ) : completedGoalsList.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">
                  No completed goals yet.
                </div>
              ) : (
                <ul className="space-y-2">
                  {completedGoalsList.map(goal => (
                    <li key={goal.id} className="flex items-start p-3 hover:bg-gray-50 rounded-md">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-0.5 h-5 w-5 p-0 mr-3 text-green-500"
                        onClick={() => handleToggleGoal(goal.id)}
                      >
                        <CheckCircle className="h-5 w-5 fill-green-100" />
                      </Button>
                      <div className="flex-grow">
                        <p className="text-sm font-medium line-through text-muted-foreground">{goal.text}</p>
                        {goal.dueDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {format(new Date(goal.dueDate), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <GoalDialog 
        open={showGoalDialog} 
        onOpenChange={setShowGoalDialog} 
        goal={editingGoal} 
      />
    </main>
  );
}
