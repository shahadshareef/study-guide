import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Plus, Search, ChevronLeft, ChevronRight, Edit, Trash } from "lucide-react";
import Flashcard from "@/components/ui/flashcard";
import FlashcardDialog from "@/components/dialogs/FlashcardDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Flashcard as FlashcardType } from "@shared/schema";

export default function Flashcards() {
  const [location, setLocation] = useLocation();
  const [showQuizMode, setShowQuizMode] = useState(location.includes('quiz=true'));
  const [searchQuery, setSearchQuery] = useState("");
  const [showFlashcardDialog, setShowFlashcardDialog] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardType | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // Quiz mode state
  const [quizCards, setQuizCards] = useState<FlashcardType[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Get all flashcards
  const { data: flashcards = [], isLoading } = useQuery<FlashcardType[]>({
    queryKey: ['/api/flashcards'],
  });

  // Get due flashcards
  const { data: dueFlashcards = [], isLoading: isLoadingDue } = useQuery<FlashcardType[]>({
    queryKey: ['/api/flashcards/due'],
  });

  // Delete flashcard mutation
  const deleteFlashcardMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/flashcards/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards'] });
      toast({
        title: "Flashcard deleted",
        description: "The flashcard has been removed from your collection.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the flashcard. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Review flashcard mutation
  const reviewFlashcardMutation = useMutation({
    mutationFn: async ({ id, difficulty }: { id: number; difficulty: number }) => {
      const response = await apiRequest('POST', `/api/flashcards/${id}/review`, { difficulty });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards/due'] });
    },
  });

  // Initialize quiz mode with due cards or all cards if none are due
  useEffect(() => {
    if (showQuizMode && dueFlashcards.length > 0) {
      setQuizCards(dueFlashcards);
    } else if (showQuizMode && flashcards.length > 0) {
      setQuizCards(flashcards);
    }
  }, [showQuizMode, dueFlashcards, flashcards]);

  // Extract unique tags for filtering
  const tags = Array.from(new Set(flashcards.map(card => card.tag).filter(Boolean)));

  // Filter flashcards based on search and active tab
  const filteredFlashcards = flashcards.filter(card => {
    // Search filtering
    const matchesSearch = searchQuery === "" || 
      card.front.toLowerCase().includes(searchQuery.toLowerCase()) || 
      card.back.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tab filtering
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "due" && dueFlashcards.some(due => due.id === card.id)) ||
      card.tag === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const handleEditFlashcard = (flashcard: FlashcardType) => {
    setEditingFlashcard(flashcard);
    setShowFlashcardDialog(true);
  };

  const handleDeleteFlashcard = (id: number) => {
    if (confirm("Are you sure you want to delete this flashcard?")) {
      deleteFlashcardMutation.mutate(id);
    }
  };

  const handleQuizNavigation = (direction: 'prev' | 'next') => {
    setIsFlipped(false);
    if (direction === 'prev') {
      setCurrentCardIndex(prev => (prev === 0 ? quizCards.length - 1 : prev - 1));
    } else {
      setCurrentCardIndex(prev => (prev === quizCards.length - 1 ? 0 : prev + 1));
    }
  };

  const handleQuizDifficulty = (difficulty: number) => {
    const currentCard = quizCards[currentCardIndex];
    reviewFlashcardMutation.mutate({ id: currentCard.id, difficulty });
    
    // Move to next card
    setIsFlipped(false);
    setCurrentCardIndex(prev => (prev === quizCards.length - 1 ? 0 : prev + 1));
    
    const difficultyLabels = ["Easy", "Good", "Hard"];
    toast({
      title: `Marked as ${difficultyLabels[difficulty]}`,
      description: "Your progress has been saved."
    });
  };

  return (
    <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {showQuizMode ? (
        // Quiz Mode
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Flashcard Quiz</CardTitle>
            <Button variant="outline" onClick={() => setShowQuizMode(false)}>
              Exit Quiz
            </Button>
          </CardHeader>
          <CardContent>
            {quizCards.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {isLoadingDue ? "Loading flashcards..." : "No flashcards available for quiz."}
                </p>
                <Button variant="outline" onClick={() => setShowQuizMode(false)}>
                  Return to Flashcards
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-full max-w-lg mb-6">
                  <Flashcard 
                    flashcard={quizCards[currentCardIndex]} 
                    isFlipped={isFlipped} 
                    onFlip={() => setIsFlipped(!isFlipped)} 
                    className="h-64 mb-6"
                  />
                  
                  <div className="flex justify-between items-center mb-6">
                    <Button 
                      variant="outline" 
                      onClick={() => handleQuizNavigation('prev')}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentCardIndex + 1} of {quizCards.length}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => handleQuizNavigation('next')}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  
                  {isFlipped && (
                    <div className="flex justify-center space-x-2">
                      <Button 
                        onClick={() => handleQuizDifficulty(2)} 
                        variant="outline" 
                        className="border-red-200 bg-red-50 hover:bg-red-100 text-red-600"
                      >
                        Hard
                      </Button>
                      <Button 
                        onClick={() => handleQuizDifficulty(1)} 
                        variant="outline" 
                        className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-600"
                      >
                        Good
                      </Button>
                      <Button 
                        onClick={() => handleQuizDifficulty(0)} 
                        variant="outline" 
                        className="border-green-200 bg-green-50 hover:bg-green-100 text-green-600"
                      >
                        Easy
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Flashcards Management Mode
        <>
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Flashcards</h1>
            <div className="flex gap-2">
              {dueFlashcards.length > 0 && (
                <Button 
                  onClick={() => setShowQuizMode(true)}
                  variant="secondary"
                >
                  Start Quiz ({dueFlashcards.length} due)
                </Button>
              )}
              <Button onClick={() => {
                setEditingFlashcard(null);
                setShowFlashcardDialog(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Create Flashcard
              </Button>
            </div>
          </div>
          
          <div className="mb-6 flex gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search flashcards..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              {dueFlashcards.length > 0 && (
                <TabsTrigger value="due">Due ({dueFlashcards.length})</TabsTrigger>
              )}
              {tags.map(tag => (
                <TabsTrigger key={tag} value={tag}>{tag}</TabsTrigger>
              ))}
            </TabsList>
          
            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground">Loading flashcards...</div>
              ) : filteredFlashcards.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No flashcards found.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditingFlashcard(null);
                      setShowFlashcardDialog(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create your first flashcard
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFlashcards.map(flashcard => (
                    <Card key={flashcard.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <Flashcard 
                        flashcard={flashcard} 
                        className="h-48"
                      />
                      <div className="p-2 border-t flex justify-between items-center">
                        {flashcard.tag && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {flashcard.tag}
                          </span>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditFlashcard(flashcard)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteFlashcard(flashcard.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
      
      <FlashcardDialog 
        open={showFlashcardDialog} 
        onOpenChange={setShowFlashcardDialog} 
        flashcard={editingFlashcard} 
      />
    </main>
  );
}
