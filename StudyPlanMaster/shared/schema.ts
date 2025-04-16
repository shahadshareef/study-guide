import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema - kept from original
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Time Slots schema
export const timeSlots = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  startTime: timestamp("start_time").notNull(),
  duration: integer("duration").notNull(), // Duration in minutes
  notes: text("notes"),
  color: text("color").notNull(),
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
});

export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;

// Flashcards schema
export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  tag: text("tag"),
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review"),
  difficulty: integer("difficulty").default(0), // 0-easy, 1-medium, 2-hard
});

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({
  id: true,
  lastReviewed: true,
  nextReview: true,
});

export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;

// Goals schema
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  text: text("text").notNull(),
  completed: boolean("completed").default(false),
  dueDate: timestamp("due_date"),
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
});

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;
