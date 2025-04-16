import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays, subDays, startOfDay, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock } from "lucide-react";
import TimeSlot from "@/components/ui/time-slot";
import TimeSlotDialog from "@/components/dialogs/TimeSlotDialog";
import DailyScheduleDialog from "@/components/dialogs/DailyScheduleDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TimeSlot as TimeSlotType } from "@shared/schema";

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTimeSlotDialog, setShowTimeSlotDialog] = useState(false);
  const [showDailyScheduleDialog, setShowDailyScheduleDialog] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlotType | null>(null);
  const { toast } = useToast();

  // Get time slots for the selected date
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { data: timeSlots = [], isLoading } = useQuery<TimeSlotType[]>({
    queryKey: ['/api/time-slots', dateString],
  });

  // Delete time slot mutation
  const deleteTimeSlotMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/time-slots/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots'] });
      toast({
        title: "Time slot deleted",
        description: "The study session has been removed from your schedule.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the time slot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePrevDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleEditTimeSlot = (timeSlot: TimeSlotType) => {
    setEditingTimeSlot(timeSlot);
    setShowTimeSlotDialog(true);
  };

  const handleDeleteTimeSlot = (id: number) => {
    if (confirm("Are you sure you want to delete this time slot?")) {
      deleteTimeSlotMutation.mutate(id);
    }
  };

  // Sort time slots by start time
  const sortedTimeSlots = [...timeSlots].sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  return (
    <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            onClick={() => setShowDailyScheduleDialog(true)}
          >
            <Calendar className="mr-2 h-4 w-4" /> Generate Study Schedule
          </Button>
          <Button onClick={() => {
            setEditingTimeSlot(null);
            setShowTimeSlotDialog(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Add Study Session
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Study Schedule</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={handlePrevDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-gray-700 font-medium">
              {format(selectedDate, 'EEEE, MMMM d')}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading schedule...</div>
            ) : sortedTimeSlots.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground mb-4">No study sessions scheduled for this day.</p>
                <div className="flex flex-col gap-3 items-center">
                  <Button 
                    variant="outline" 
                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    onClick={() => setShowDailyScheduleDialog(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" /> Generate optimal study schedule
                  </Button>
                  <Button 
                    variant="link" 
                    onClick={() => {
                      setEditingTimeSlot(null);
                      setShowTimeSlotDialog(true);
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Or add a session manually
                  </Button>
                </div>
              </div>
            ) : (
              sortedTimeSlots.map(timeSlot => (
                <TimeSlot 
                  key={timeSlot.id} 
                  timeSlot={timeSlot} 
                  onEdit={() => handleEditTimeSlot(timeSlot)} 
                  onDelete={() => handleDeleteTimeSlot(timeSlot.id)} 
                />
              ))
            )}
            
            {sortedTimeSlots.length > 0 && (
              <div className="time-slot flex border-b border-gray-100 py-2 hover:bg-gray-50">
                <div className="w-16 text-sm text-gray-500 pt-1"></div>
                <div className="flex-grow">
                  <button 
                    onClick={() => {
                      setEditingTimeSlot(null);
                      setShowTimeSlotDialog(true);
                    }} 
                    className="bg-gray-100 text-gray-800 rounded p-2 border-2 border-dashed border-gray-300 flex items-center justify-center w-full"
                  >
                    <span className="text-sm text-gray-500">+ Add study session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <TimeSlotDialog 
        open={showTimeSlotDialog} 
        onOpenChange={setShowTimeSlotDialog} 
        timeSlot={editingTimeSlot} 
        selectedDate={selectedDate}
      />
      
      <DailyScheduleDialog
        open={showDailyScheduleDialog}
        onOpenChange={setShowDailyScheduleDialog}
        selectedDate={selectedDate}
      />
    </main>
  );
}
