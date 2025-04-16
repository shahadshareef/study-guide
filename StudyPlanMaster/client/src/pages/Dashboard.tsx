import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import TimeSlot from "@/components/ui/time-slot";
import Flashcard from "@/components/ui/flashcard";
import GoalItem from "@/components/ui/goal-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Play } from "lucide-react";
import TimeSlotDialog from "@/components/dialogs/TimeSlotDialog";
import FlashcardDialog from "@/components/dialogs/FlashcardDialog";
import GoalDialog from "@/components/dialogs/GoalDialog";
import type { TimeSlot as TimeSlotType, Flashcard as FlashcardType, Goal as GoalType } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [currentDate] = useState(new Date());
  const [showTimeSlotDialog, setShowTimeSlotDialog] = useState(false);
  const [showFlashcardDialog, setShowFlashcardDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);

  // Get today's time slots
  const { data: timeSlots = [], isLoading: isLoadingTimeSlots } = useQuery<TimeSlotType[]>({
    queryKey: ['/api/time-slots', format(currentDate, 'yyyy-MM-dd')],
    refetchOnWindowFocus: true,
  });

  // Get due flashcards
  const { data: dueFlashcards = [], isLoading: isLoadingFlashcards } = useQuery<FlashcardType[]>({
    queryKey: ['/api/flashcards/due'],
    refetchOnWindowFocus: true,
  });

  // Get goals
  const { data: goals = [], isLoading: isLoadingGoals } = useQuery<GoalType[]>({
    queryKey: ['/api/goals'],
    refetchOnWindowFocus: true,
  });

  // Get study recommendation
  const { data: recommendation } = useQuery({
    queryKey: ['/api/recommendations'],
  });

  // Calculate goal completion percentage
  const completedGoals = goals.filter(goal => goal.completed).length;
  const goalProgress = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  // For the flashcard preview
  const [activeFlashcard, setActiveFlashcard] = useState<FlashcardType | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  // Set the first due flashcard as active when data loads
  if (dueFlashcards.length > 0 && !activeFlashcard) {
    setActiveFlashcard(dueFlashcards[0]);
  }

  return (
    <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Section */}
        <div className="col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Today's Schedule</CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-gray-700 font-medium">
                  {format(currentDate, 'EEEE, MMMM d')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pb-4 px-4 pt-0">
              <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                {isLoadingTimeSlots ? (
                  <div className="py-4 text-center text-muted-foreground">Loading schedule...</div>
                ) : timeSlots.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">No study sessions scheduled for today</div>
                ) : (
                  timeSlots
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map(slot => (
                      <TimeSlot key={slot.id} timeSlot={slot} />
                    ))
                )}
                
                <div className="time-slot flex border-b border-gray-100 py-2 hover:bg-gray-50">
                  <div className="w-16 text-sm text-gray-500 pt-1"></div>
                  <div className="flex-grow">
                    <button 
                      onClick={() => setShowTimeSlotDialog(true)} 
                      className="bg-gray-100 text-gray-800 rounded p-2 border-2 border-dashed border-gray-300 flex items-center justify-center w-full"
                    >
                      <span className="text-sm text-gray-500">+ Add study session</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {recommendation && (
                <div className="bg-indigo-50 p-4 rounded-md mt-4">
                  <h3 className="text-sm font-medium text-indigo-800 mb-2">Study Time Recommendation</h3>
                  <div className="bg-white rounded-md shadow-sm p-3">
                    <p className="text-sm text-gray-600">Based on your schedule and performance, we recommend adding:</p>
                    <div className="flex items-center mt-2">
                      <Button 
                        variant="default" 
                        className="mr-2 text-sm h-8" 
                        onClick={() => {
                          setShowTimeSlotDialog(true);
                          toast({
                            title: "Recommendation applied",
                            description: "Fill in details to add this study session",
                          });
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> {recommendation.subject} ({recommendation.duration}m)
                      </Button>
                      <span className="text-xs text-gray-500">Best time: {recommendation.suggestedStartTime}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar Content */}
        <div className="col-span-1 space-y-6">
          {/* Daily Goals */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Daily Goals</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                {isLoadingGoals ? (
                  <div className="py-2 text-center text-muted-foreground">Loading goals...</div>
                ) : goals.length === 0 ? (
                  <div className="py-2 text-center text-muted-foreground">No goals added yet</div>
                ) : (
                  goals.map(goal => (
                    <GoalItem key={goal.id} goal={goal} />
                  ))
                )}
                
                <div className="pt-2">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary"
                    onClick={() => setShowGoalDialog(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add goal
                  </Button>
                </div>
              </div>
            </CardContent>
            
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex items-center">
                <Progress value={goalProgress} className="w-full" />
                <span className="ml-2 text-sm text-gray-600">{Math.round(goalProgress)}%</span>
              </div>
            </div>
          </Card>
          
          {/* Flashcards Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Flashcards</CardTitle>
              <Button variant="link" className="p-0 h-auto text-primary" asChild>
                <a href="/flashcards">View all</a>
              </Button>
            </CardHeader>
            <CardContent className="pb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Due for review today:</h3>
              
              {isLoadingFlashcards ? (
                <div className="py-4 text-center text-muted-foreground">Loading flashcards...</div>
              ) : dueFlashcards.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">No flashcards due for review</div>
              ) : activeFlashcard ? (
                <>
                  <Flashcard 
                    flashcard={activeFlashcard} 
                    isFlipped={isFlipped} 
                    onFlip={handleFlipCard} 
                    className="h-40 mb-4"
                  />
                  
                  <div className="flex justify-center space-x-2 mb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-error"
                      onClick={() => {
                        // Handle review with difficulty = hard
                        toast({
                          title: "Marked as Hard",
                          description: "You'll see this card again soon",
                        });
                        // Move to next card or reset
                        const currentIndex = dueFlashcards.findIndex(f => f.id === activeFlashcard.id);
                        const nextIndex = (currentIndex + 1) % dueFlashcards.length;
                        setActiveFlashcard(dueFlashcards[nextIndex]);
                        setIsFlipped(false);
                      }}
                    >
                      <span className="text-red-500">Again</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Handle review with difficulty = medium
                        toast({
                          title: "Marked as Good",
                          description: "You'll see this card in a few days",
                        });
                        // Move to next card or reset
                        const currentIndex = dueFlashcards.findIndex(f => f.id === activeFlashcard.id);
                        const nextIndex = (currentIndex + 1) % dueFlashcards.length;
                        setActiveFlashcard(dueFlashcards[nextIndex]);
                        setIsFlipped(false);
                      }}
                    >
                      <span className="text-amber-500">Good</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Handle review with difficulty = easy
                        toast({
                          title: "Marked as Easy",
                          description: "You'll see this card in a longer period",
                        });
                        // Move to next card or reset
                        const currentIndex = dueFlashcards.findIndex(f => f.id === activeFlashcard.id);
                        const nextIndex = (currentIndex + 1) % dueFlashcards.length;
                        setActiveFlashcard(dueFlashcards[nextIndex]);
                        setIsFlipped(false);
                      }}
                    >
                      <span className="text-green-500">Easy</span>
                    </Button>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">{dueFlashcards.length} cards due today</span>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-secondary"
                      asChild
                    >
                      <a href="/flashcards?quiz=true">
                        <Play className="h-3.5 w-3.5 mr-1" /> Start Quiz
                      </a>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFlashcardDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Create Flashcard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Dialogs */}
      <TimeSlotDialog open={showTimeSlotDialog} onOpenChange={setShowTimeSlotDialog} />
      <FlashcardDialog open={showFlashcardDialog} onOpenChange={setShowFlashcardDialog} />
      <GoalDialog open={showGoalDialog} onOpenChange={setShowGoalDialog} />
    </main>
  );
}
