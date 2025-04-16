import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Goal } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

interface GoalItemProps {
  goal: Goal;
  onEdit?: () => void;
}

export default function GoalItem({ goal, onEdit }: GoalItemProps) {
  const [isChecked, setIsChecked] = useState(goal.completed);
  
  const toggleGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/goals/${id}/toggle`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    },
  });
  
  const handleToggle = () => {
    setIsChecked(!isChecked);
    toggleGoalMutation.mutate(goal.id);
  };
  
  return (
    <div className="flex items-center">
      <Checkbox
        id={`goal-${goal.id}`}
        checked={isChecked}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
      />
      <label
        htmlFor={`goal-${goal.id}`}
        className={`ml-2 text-sm ${isChecked ? "line-through text-gray-500" : "text-gray-700"}`}
      >
        {goal.text}
        {goal.dueDate && (
          <span className="ml-2 text-xs text-gray-400">
            (Due: {format(new Date(goal.dueDate), "MMM d")})
          </span>
        )}
      </label>
    </div>
  );
}
