import { 
  users, type User, type InsertUser,
  timeSlots, type TimeSlot, type InsertTimeSlot,
  flashcards, type Flashcard, type InsertFlashcard,
  goals, type Goal, type InsertGoal
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // TimeSlot operations
  getTimeSlots(userId: number, date?: Date): Promise<TimeSlot[]>;
  getTimeSlot(id: number): Promise<TimeSlot | undefined>;
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  updateTimeSlot(id: number, timeSlot: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined>;
  deleteTimeSlot(id: number): Promise<boolean>;
  
  // Flashcard operations
  getFlashcards(userId: number, tag?: string): Promise<Flashcard[]>;
  getFlashcard(id: number): Promise<Flashcard | undefined>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: number, flashcard: Partial<InsertFlashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: number): Promise<boolean>;
  getDueFlashcards(userId: number): Promise<Flashcard[]>;
  updateFlashcardReview(id: number, difficulty: number): Promise<Flashcard | undefined>;
  
  // Goal operations
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  toggleGoalCompletion(id: number): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private timeSlotEntries: Map<number, TimeSlot>;
  private flashcardEntries: Map<number, Flashcard>;
  private goalEntries: Map<number, Goal>;
  private currentUserId: number;
  private currentTimeSlotId: number;
  private currentFlashcardId: number;
  private currentGoalId: number;

  constructor() {
    this.users = new Map();
    this.timeSlotEntries = new Map();
    this.flashcardEntries = new Map();
    this.goalEntries = new Map();
    this.currentUserId = 1;
    this.currentTimeSlotId = 1;
    this.currentFlashcardId = 1;
    this.currentGoalId = 1;
    
    // Add demo user
    this.createUser({
      username: "demo",
      password: "password123"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // TimeSlot methods
  async getTimeSlots(userId: number, date?: Date): Promise<TimeSlot[]> {
    const timeSlots = Array.from(this.timeSlotEntries.values())
      .filter(slot => slot.userId === userId);
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return timeSlots.filter(slot => {
        const slotDate = new Date(slot.startTime);
        return slotDate >= startOfDay && slotDate <= endOfDay;
      });
    }
    
    return timeSlots;
  }

  async getTimeSlot(id: number): Promise<TimeSlot | undefined> {
    return this.timeSlotEntries.get(id);
  }

  async createTimeSlot(insertTimeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const id = this.currentTimeSlotId++;
    const timeSlot: TimeSlot = { ...insertTimeSlot, id };
    this.timeSlotEntries.set(id, timeSlot);
    return timeSlot;
  }

  async updateTimeSlot(id: number, timeSlotUpdate: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined> {
    const existingTimeSlot = this.timeSlotEntries.get(id);
    if (!existingTimeSlot) return undefined;
    
    const updatedTimeSlot = { ...existingTimeSlot, ...timeSlotUpdate };
    this.timeSlotEntries.set(id, updatedTimeSlot);
    return updatedTimeSlot;
  }

  async deleteTimeSlot(id: number): Promise<boolean> {
    return this.timeSlotEntries.delete(id);
  }

  // Flashcard methods
  async getFlashcards(userId: number, tag?: string): Promise<Flashcard[]> {
    const flashcards = Array.from(this.flashcardEntries.values())
      .filter(card => card.userId === userId);
    
    if (tag) {
      return flashcards.filter(card => card.tag === tag);
    }
    
    return flashcards;
  }

  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    return this.flashcardEntries.get(id);
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const id = this.currentFlashcardId++;
    const now = new Date();
    const nextReview = new Date();
    nextReview.setDate(now.getDate() + 1); // Default to review tomorrow
    
    const flashcard: Flashcard = { 
      ...insertFlashcard, 
      id,
      lastReviewed: null,
      nextReview, 
      difficulty: 0 
    };
    
    this.flashcardEntries.set(id, flashcard);
    return flashcard;
  }

  async updateFlashcard(id: number, flashcardUpdate: Partial<InsertFlashcard>): Promise<Flashcard | undefined> {
    const existingFlashcard = this.flashcardEntries.get(id);
    if (!existingFlashcard) return undefined;
    
    const updatedFlashcard = { ...existingFlashcard, ...flashcardUpdate };
    this.flashcardEntries.set(id, updatedFlashcard);
    return updatedFlashcard;
  }

  async deleteFlashcard(id: number): Promise<boolean> {
    return this.flashcardEntries.delete(id);
  }

  async getDueFlashcards(userId: number): Promise<Flashcard[]> {
    const now = new Date();
    
    return Array.from(this.flashcardEntries.values())
      .filter(card => card.userId === userId && card.nextReview && card.nextReview <= now);
  }

  async updateFlashcardReview(id: number, difficulty: number): Promise<Flashcard | undefined> {
    const flashcard = this.flashcardEntries.get(id);
    if (!flashcard) return undefined;
    
    const now = new Date();
    
    // Simple spaced repetition algorithm
    let daysToAdd = 1; // Default 1 day
    
    switch(difficulty) {
      case 0: // Easy
        daysToAdd = flashcard.lastReviewed ? 7 : 3;
        break;
      case 1: // Medium
        daysToAdd = flashcard.lastReviewed ? 3 : 1;
        break;
      case 2: // Hard
        daysToAdd = 1;
        break;
      default:
        daysToAdd = 1;
    }
    
    const nextReview = new Date();
    nextReview.setDate(now.getDate() + daysToAdd);
    
    const updatedFlashcard: Flashcard = {
      ...flashcard,
      lastReviewed: now,
      nextReview,
      difficulty
    };
    
    this.flashcardEntries.set(id, updatedFlashcard);
    return updatedFlashcard;
  }

  // Goal methods
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goalEntries.values())
      .filter(goal => goal.userId === userId);
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goalEntries.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.currentGoalId++;
    const goal: Goal = { ...insertGoal, id };
    this.goalEntries.set(id, goal);
    return goal;
  }

  async updateGoal(id: number, goalUpdate: Partial<InsertGoal>): Promise<Goal | undefined> {
    const existingGoal = this.goalEntries.get(id);
    if (!existingGoal) return undefined;
    
    const updatedGoal = { ...existingGoal, ...goalUpdate };
    this.goalEntries.set(id, updatedGoal);
    return updatedGoal;
  }

  async toggleGoalCompletion(id: number): Promise<Goal | undefined> {
    const goal = this.goalEntries.get(id);
    if (!goal) return undefined;
    
    const updatedGoal = { ...goal, completed: !goal.completed };
    this.goalEntries.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return this.goalEntries.delete(id);
  }
}

export const storage = new MemStorage();

// Add some initial demo data
async function addDemoData() {
  const user = await storage.getUserByUsername("demo");
  if (!user) return;
  
  // No example time slots here - users will create their own
  const today = new Date();
  
  // Add demo flashcards
  await storage.createFlashcard({
    userId: user.id,
    front: "What is the Krebs cycle?",
    back: "The Krebs cycle (or citric acid cycle) is a series of chemical reactions used by all aerobic organisms to release stored energy through the oxidation of acetyl-CoA derived from carbohydrates, fats, and proteins.",
    tag: "Biology",
    difficulty: 1
  });
  
  await storage.createFlashcard({
    userId: user.id,
    front: "What is the law of conservation of energy?",
    back: "The law of conservation of energy states that energy can neither be created nor destroyed - only converted from one form of energy to another.",
    tag: "Physics",
    difficulty: 0
  });
  
  await storage.createFlashcard({
    userId: user.id,
    front: "What is the quadratic formula?",
    back: "For ax² + bx + c = 0, the solutions are x = (-b ± √(b² - 4ac)) / 2a",
    tag: "Mathematics",
    difficulty: 0
  });
  
  // Add demo goals
  await storage.createGoal({
    userId: user.id,
    text: "Complete calculus problem set",
    completed: true,
    dueDate: today
  });
  
  await storage.createGoal({
    userId: user.id,
    text: "Review physics chapter 7",
    completed: false,
    dueDate: today
  });
  
  await storage.createGoal({
    userId: user.id,
    text: "Create flashcards for bio terms",
    completed: false,
    dueDate: today
  });
}

// Add demo data
addDemoData();
