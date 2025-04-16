import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { TimeSlot, Flashcard, Goal } from "@shared/schema";
import { format, startOfDay, endOfDay, addDays, subDays, differenceInMinutes } from "date-fns";

// Helper to group and count items
function countByProperty<T, K extends keyof T>(items: T[], property: K): Record<string, number> {
  return items.reduce((acc, item) => {
    const key = String(item[property]);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// Get duration in hours
function getDurationInHours(duration: number): number {
  return Math.round((duration / 60) * 10) / 10; // Round to 1 decimal
}

export default function Analytics() {
  // Fetch all data for analytics
  const { data: timeSlots = [] } = useQuery<TimeSlot[]>({
    queryKey: ['/api/time-slots'],
  });
  
  const { data: flashcards = [] } = useQuery<Flashcard[]>({
    queryKey: ['/api/flashcards'],
  });
  
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });
  
  // Calculate study time per subject
  const studyTimeBySubject: { name: string; hours: number }[] = 
    Object.entries(
      timeSlots.reduce((acc, slot) => {
        const subject = slot.subject;
        acc[subject] = (acc[subject] || 0) + slot.duration;
        return acc;
      }, {} as Record<string, number>)
    )
    .map(([subject, minutes]) => ({
      name: subject,
      hours: getDurationInHours(minutes)
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5); // Top 5 subjects
  
  // Calculate goal completion rate
  const goalCompletionData = [
    { name: "Completed", value: goals.filter(goal => goal.completed).length },
    { name: "Active", value: goals.filter(goal => !goal.completed).length }
  ];
  
  // Calculate flashcard difficulty distribution
  const flashcardDifficultyData = [
    { name: "Easy", value: flashcards.filter(card => card.difficulty === 0).length },
    { name: "Medium", value: flashcards.filter(card => card.difficulty === 1).length },
    { name: "Hard", value: flashcards.filter(card => card.difficulty === 2).length }
  ];
  
  // Study time for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    const start = startOfDay(date);
    const end = endOfDay(date);
    
    const slotsOnDay = timeSlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      return slotDate >= start && slotDate <= end;
    });
    
    const totalMinutes = slotsOnDay.reduce((sum, slot) => sum + slot.duration, 0);
    
    return {
      date: format(date, 'EEE'),
      hours: getDurationInHours(totalMinutes)
    };
  }).reverse();
  
  // Calculate total study time
  const totalStudyHours = timeSlots.reduce((sum, slot) => sum + slot.duration, 0) / 60;
  
  // Calculate total subjects studied
  const uniqueSubjects = new Set(timeSlots.map(slot => slot.subject));
  
  // Calculate flashcard mastery (percentage of easy cards)
  const flashcardMastery = flashcards.length > 0 
    ? Math.round((flashcards.filter(card => card.difficulty === 0).length / flashcards.length) * 100) 
    : 0;
  
  // Calculate goal completion rate
  const goalCompletionRate = goals.length > 0 
    ? Math.round((goals.filter(goal => goal.completed).length / goals.length) * 100) 
    : 0;
  
  // Colors for charts
  const COLORS = ['#4F46E5', '#8B5CF6', '#F97316', '#10B981'];
  
  return (
    <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your study progress and habits</p>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{Math.round(totalStudyHours * 10) / 10}h</div>
            <p className="text-sm text-muted-foreground">Total Study Time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{uniqueSubjects.size}</div>
            <p className="text-sm text-muted-foreground">Subjects Studied</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{flashcardMastery}%</div>
            <p className="text-sm text-muted-foreground">Flashcard Mastery</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{goalCompletionRate}%</div>
            <p className="text-sm text-muted-foreground">Goal Completion Rate</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Study Time Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Study Time Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value} hours`, 'Study Time']} />
                <Bar dataKey="hours" fill="#4F46E5" name="Study Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Subject and Goal Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Study Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {studyTimeBySubject.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No study data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={studyTimeBySubject} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => [`${value} hours`, 'Study Time']} />
                    <Bar dataKey="hours" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Goal Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {goals.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No goal data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={goalCompletionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {goalCompletionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#8B5CF6'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Goals']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Flashcard Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Flashcard Difficulty Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {flashcards.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No flashcard data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={flashcardDifficultyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {flashcardDifficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Flashcards']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
