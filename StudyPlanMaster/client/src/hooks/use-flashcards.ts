import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Flashcard } from "@shared/schema";

export function useFlashcards() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch all flashcards
  const { 
    data: flashcards = [], 
    isLoading, 
    isError,
    refetch 
  } = useQuery<Flashcard[]>({
    queryKey: ['/api/flashcards'],
  });
  
  // Fetch due flashcards
  const { 
    data: dueFlashcards = [], 
    isLoading: isLoadingDue 
  } = useQuery<Flashcard[]>({
    queryKey: ['/api/flashcards/due'],
  });
  
  // Get unique tags
  const tags = Array.from(new Set(flashcards.map(card => card.tag).filter(Boolean)));
  
  // Filter flashcards by active tag
  const filteredFlashcards = activeTag 
    ? flashcards.filter(card => card.tag === activeTag) 
    : flashcards;
  
  // CRUD operations
  const createFlashcard = useMutation({
    mutationFn: async (flashcard: Omit<Flashcard, 'id' | 'lastReviewed' | 'nextReview' | 'difficulty'>) => {
      const response = await apiRequest('POST', '/api/flashcards', flashcard);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards'] });
      toast({
        title: "Success",
        description: "Flashcard created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create flashcard",
        variant: "destructive"
      });
    }
  });
  
  const updateFlashcard = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Flashcard> }) => {
      const response = await apiRequest('PUT', `/api/flashcards/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards'] });
      toast({
        title: "Success",
        description: "Flashcard updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update flashcard",
        variant: "destructive"
      });
    }
  });
  
  const deleteFlashcard = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/flashcards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards'] });
      toast({
        title: "Success",
        description: "Flashcard deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete flashcard",
        variant: "destructive"
      });
    }
  });
  
  // Review flashcard with spaced repetition
  const reviewFlashcard = useMutation({
    mutationFn: async ({ id, difficulty }: { id: number; difficulty: number }) => {
      const response = await apiRequest('POST', `/api/flashcards/${id}/review`, { difficulty });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards/due'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update flashcard review",
        variant: "destructive"
      });
    }
  });
  
  // Quiz mode helpers
  const startQuiz = (cards: Flashcard[] = dueFlashcards.length > 0 ? dueFlashcards : flashcards) => {
    return cards.length > 0 ? cards : [];
  };
  
  return {
    flashcards,
    filteredFlashcards,
    dueFlashcards,
    tags,
    activeTag,
    setActiveTag,
    isLoading,
    isLoadingDue,
    isError,
    refetch,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    reviewFlashcard,
    startQuiz
  };
}
