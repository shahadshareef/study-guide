// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  timeSlotEntries;
  flashcardEntries;
  goalEntries;
  currentUserId;
  currentTimeSlotId;
  currentFlashcardId;
  currentGoalId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.timeSlotEntries = /* @__PURE__ */ new Map();
    this.flashcardEntries = /* @__PURE__ */ new Map();
    this.goalEntries = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentTimeSlotId = 1;
    this.currentFlashcardId = 1;
    this.currentGoalId = 1;
    this.createUser({
      username: "demo",
      password: "password123"
    });
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  // TimeSlot methods
  async getTimeSlots(userId, date) {
    const timeSlots2 = Array.from(this.timeSlotEntries.values()).filter((slot) => slot.userId === userId);
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      return timeSlots2.filter((slot) => {
        const slotDate = new Date(slot.startTime);
        return slotDate >= startOfDay && slotDate <= endOfDay;
      });
    }
    return timeSlots2;
  }
  async getTimeSlot(id) {
    return this.timeSlotEntries.get(id);
  }
  async createTimeSlot(insertTimeSlot) {
    const id = this.currentTimeSlotId++;
    const timeSlot = { ...insertTimeSlot, id };
    this.timeSlotEntries.set(id, timeSlot);
    return timeSlot;
  }
  async updateTimeSlot(id, timeSlotUpdate) {
    const existingTimeSlot = this.timeSlotEntries.get(id);
    if (!existingTimeSlot) return void 0;
    const updatedTimeSlot = { ...existingTimeSlot, ...timeSlotUpdate };
    this.timeSlotEntries.set(id, updatedTimeSlot);
    return updatedTimeSlot;
  }
  async deleteTimeSlot(id) {
    return this.timeSlotEntries.delete(id);
  }
  // Flashcard methods
  async getFlashcards(userId, tag) {
    const flashcards2 = Array.from(this.flashcardEntries.values()).filter((card) => card.userId === userId);
    if (tag) {
      return flashcards2.filter((card) => card.tag === tag);
    }
    return flashcards2;
  }
  async getFlashcard(id) {
    return this.flashcardEntries.get(id);
  }
  async createFlashcard(insertFlashcard) {
    const id = this.currentFlashcardId++;
    const now = /* @__PURE__ */ new Date();
    const nextReview = /* @__PURE__ */ new Date();
    nextReview.setDate(now.getDate() + 1);
    const flashcard = {
      ...insertFlashcard,
      id,
      lastReviewed: null,
      nextReview,
      difficulty: 0
    };
    this.flashcardEntries.set(id, flashcard);
    return flashcard;
  }
  async updateFlashcard(id, flashcardUpdate) {
    const existingFlashcard = this.flashcardEntries.get(id);
    if (!existingFlashcard) return void 0;
    const updatedFlashcard = { ...existingFlashcard, ...flashcardUpdate };
    this.flashcardEntries.set(id, updatedFlashcard);
    return updatedFlashcard;
  }
  async deleteFlashcard(id) {
    return this.flashcardEntries.delete(id);
  }
  async getDueFlashcards(userId) {
    const now = /* @__PURE__ */ new Date();
    return Array.from(this.flashcardEntries.values()).filter((card) => card.userId === userId && card.nextReview && card.nextReview <= now);
  }
  async updateFlashcardReview(id, difficulty) {
    const flashcard = this.flashcardEntries.get(id);
    if (!flashcard) return void 0;
    const now = /* @__PURE__ */ new Date();
    let daysToAdd = 1;
    switch (difficulty) {
      case 0:
        daysToAdd = flashcard.lastReviewed ? 7 : 3;
        break;
      case 1:
        daysToAdd = flashcard.lastReviewed ? 3 : 1;
        break;
      case 2:
        daysToAdd = 1;
        break;
      default:
        daysToAdd = 1;
    }
    const nextReview = /* @__PURE__ */ new Date();
    nextReview.setDate(now.getDate() + daysToAdd);
    const updatedFlashcard = {
      ...flashcard,
      lastReviewed: now,
      nextReview,
      difficulty
    };
    this.flashcardEntries.set(id, updatedFlashcard);
    return updatedFlashcard;
  }
  // Goal methods
  async getGoals(userId) {
    return Array.from(this.goalEntries.values()).filter((goal) => goal.userId === userId);
  }
  async getGoal(id) {
    return this.goalEntries.get(id);
  }
  async createGoal(insertGoal) {
    const id = this.currentGoalId++;
    const goal = { ...insertGoal, id };
    this.goalEntries.set(id, goal);
    return goal;
  }
  async updateGoal(id, goalUpdate) {
    const existingGoal = this.goalEntries.get(id);
    if (!existingGoal) return void 0;
    const updatedGoal = { ...existingGoal, ...goalUpdate };
    this.goalEntries.set(id, updatedGoal);
    return updatedGoal;
  }
  async toggleGoalCompletion(id) {
    const goal = this.goalEntries.get(id);
    if (!goal) return void 0;
    const updatedGoal = { ...goal, completed: !goal.completed };
    this.goalEntries.set(id, updatedGoal);
    return updatedGoal;
  }
  async deleteGoal(id) {
    return this.goalEntries.delete(id);
  }
};
var storage = new MemStorage();
async function addDemoData() {
  const user = await storage.getUserByUsername("demo");
  if (!user) return;
  const today = /* @__PURE__ */ new Date();
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
    back: "For ax\xB2 + bx + c = 0, the solutions are x = (-b \xB1 \u221A(b\xB2 - 4ac)) / 2a",
    tag: "Mathematics",
    difficulty: 0
  });
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
addDemoData();

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var timeSlots = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  startTime: timestamp("start_time").notNull(),
  duration: integer("duration").notNull(),
  // Duration in minutes
  notes: text("notes"),
  color: text("color").notNull()
});
var insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true
});
var flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  tag: text("tag"),
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review"),
  difficulty: integer("difficulty").default(0)
  // 0-easy, 1-medium, 2-hard
});
var insertFlashcardSchema = createInsertSchema(flashcards).omit({
  id: true,
  lastReviewed: true,
  nextReview: true
});
var goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  text: text("text").notNull(),
  completed: boolean("completed").default(false),
  dueDate: timestamp("due_date")
});
var insertGoalSchema = createInsertSchema(goals).omit({
  id: true
});

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  app2.use(async (req, res, next) => {
    const demoUser = await storage.getUserByUsername("demo");
    if (demoUser) {
      req.body.userId = demoUser.id;
    }
    next();
  });
  app2.get("/api/time-slots", async (req, res) => {
    try {
      const userId = req.body.userId;
      let date = void 0;
      if (req.query.date) {
        date = new Date(req.query.date);
      }
      const timeSlots2 = await storage.getTimeSlots(userId, date);
      res.json(timeSlots2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get time slots", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.get("/api/time-slots/:id", async (req, res) => {
    try {
      const timeSlot = await storage.getTimeSlot(parseInt(req.params.id));
      if (!timeSlot) {
        return res.status(404).json({ message: "Time slot not found" });
      }
      res.json(timeSlot);
    } catch (error) {
      res.status(500).json({ message: "Failed to get time slot", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.post("/api/time-slots", async (req, res) => {
    try {
      const timeSlotData = insertTimeSlotSchema.parse(req.body);
      const timeSlot = await storage.createTimeSlot(timeSlotData);
      res.status(201).json(timeSlot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid time slot data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create time slot", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.put("/api/time-slots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const timeSlotUpdate = req.body;
      const updatedTimeSlot = await storage.updateTimeSlot(id, timeSlotUpdate);
      if (!updatedTimeSlot) {
        return res.status(404).json({ message: "Time slot not found" });
      }
      res.json(updatedTimeSlot);
    } catch (error) {
      res.status(500).json({ message: "Failed to update time slot", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.delete("/api/time-slots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTimeSlot(id);
      if (!success) {
        return res.status(404).json({ message: "Time slot not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete time slot", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.get("/api/flashcards", async (req, res) => {
    try {
      const userId = req.body.userId;
      const tag = req.query.tag;
      const flashcards2 = await storage.getFlashcards(userId, tag);
      res.json(flashcards2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get flashcards", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.get("/api/flashcards/due", async (req, res) => {
    try {
      const userId = req.body.userId;
      const dueFlashcards = await storage.getDueFlashcards(userId);
      res.json(dueFlashcards);
    } catch (error) {
      res.status(500).json({ message: "Failed to get due flashcards", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.get("/api/flashcards/:id", async (req, res) => {
    try {
      const flashcard = await storage.getFlashcard(parseInt(req.params.id));
      if (!flashcard) {
        return res.status(404).json({ message: "Flashcard not found" });
      }
      res.json(flashcard);
    } catch (error) {
      res.status(500).json({ message: "Failed to get flashcard", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.post("/api/flashcards", async (req, res) => {
    try {
      const flashcardData = insertFlashcardSchema.parse(req.body);
      const flashcard = await storage.createFlashcard(flashcardData);
      res.status(201).json(flashcard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid flashcard data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create flashcard", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.put("/api/flashcards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const flashcardUpdate = req.body;
      const updatedFlashcard = await storage.updateFlashcard(id, flashcardUpdate);
      if (!updatedFlashcard) {
        return res.status(404).json({ message: "Flashcard not found" });
      }
      res.json(updatedFlashcard);
    } catch (error) {
      res.status(500).json({ message: "Failed to update flashcard", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.post("/api/flashcards/:id/review", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const difficulty = parseInt(req.body.difficulty);
      if (isNaN(difficulty) || difficulty < 0 || difficulty > 2) {
        return res.status(400).json({ message: "Invalid difficulty. Must be 0 (easy), 1 (medium), or 2 (hard)" });
      }
      const updatedFlashcard = await storage.updateFlashcardReview(id, difficulty);
      if (!updatedFlashcard) {
        return res.status(404).json({ message: "Flashcard not found" });
      }
      res.json(updatedFlashcard);
    } catch (error) {
      res.status(500).json({ message: "Failed to update flashcard review", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.delete("/api/flashcards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFlashcard(id);
      if (!success) {
        return res.status(404).json({ message: "Flashcard not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete flashcard", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.get("/api/goals", async (req, res) => {
    try {
      const userId = req.body.userId;
      const goals2 = await storage.getGoals(userId);
      res.json(goals2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get goals", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.get("/api/goals/:id", async (req, res) => {
    try {
      const goal = await storage.getGoal(parseInt(req.params.id));
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to get goal", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.post("/api/goals", async (req, res) => {
    try {
      const goalData = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create goal", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.put("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const goalUpdate = req.body;
      const updatedGoal = await storage.updateGoal(id, goalUpdate);
      if (!updatedGoal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json(updatedGoal);
    } catch (error) {
      res.status(500).json({ message: "Failed to update goal", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.post("/api/goals/:id/toggle", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedGoal = await storage.toggleGoalCompletion(id);
      if (!updatedGoal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json(updatedGoal);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle goal completion", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.delete("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteGoal(id);
      if (!success) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete goal", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.get("/api/recommendations", async (req, res) => {
    try {
      const userId = req.body.userId;
      const timeSlots2 = await storage.getTimeSlots(userId);
      const recommendation = {
        subject: "Chemistry Review",
        duration: 60,
        // 1 hour
        suggestedStartTime: "14:30",
        // 2:30 PM
        reason: "Based on your schedule and study habits"
      };
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recommendations", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.post("/api/generate-schedule", async (req, res) => {
    try {
      const {
        date,
        wakeUpTime,
        sleepTime,
        studyHoursGoal,
        maxSessionLength,
        breakLength,
        timeBlocks,
        userId
      } = req.body;
      const parseTime = (timeString) => {
        console.log(`Parsing time string: "${timeString}"`);
        let hours = 0;
        let minutes = 0;
        if (timeString.includes("AM") || timeString.includes("PM")) {
          const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
          const match = timeString.match(timeRegex);
          if (match) {
            let hour = parseInt(match[1], 10);
            const minute = parseInt(match[2], 10);
            const period = match[3].toUpperCase();
            if (period === "PM" && hour < 12) {
              hour += 12;
            } else if (period === "AM" && hour === 12) {
              hour = 0;
            }
            hours = hour;
            minutes = minute;
            console.log(`Parsed 12-hour format: ${hour}:${minute} ${period} -> ${hours}:${minutes} (24hr)`);
          } else {
            console.log(`Failed to parse 12-hour format, falling back to default parsing`);
            const [h, m] = timeString.split(":").map(Number);
            hours = h || 0;
            minutes = m || 0;
          }
        } else {
          const [h, m] = timeString.split(":").map(Number);
          hours = h || 0;
          minutes = m || 0;
          console.log(`Parsed 24-hour format: ${hours}:${minutes}`);
        }
        return [hours, minutes];
      };
      const [wakeHour, wakeMinute] = parseTime(wakeUpTime);
      const [sleepHour, sleepMinute] = parseTime(sleepTime);
      const dayDate = new Date(date);
      const startOfDay = new Date(dayDate);
      startOfDay.setHours(0, 0, 0, 0);
      const wakeTime = new Date(dayDate);
      wakeTime.setHours(wakeHour, wakeMinute, 0, 0);
      const bedTime = new Date(dayDate);
      bedTime.setHours(sleepHour, sleepMinute, 0, 0);
      if (bedTime < wakeTime) {
        bedTime.setDate(bedTime.getDate() + 1);
      }
      const busyTimes = [];
      busyTimes.push([startOfDay, wakeTime]);
      const morningDurationMinutes = (wakeTime.getTime() - startOfDay.getTime()) / (1e3 * 60);
      if (morningDurationMinutes > 0) {
        const sleepMorningTimeSlot = {
          userId,
          subject: "Sleep",
          startTime: startOfDay,
          duration: morningDurationMinutes,
          notes: "Sleep time until wake up",
          color: "violet"
        };
        await storage.createTimeSlot(sleepMorningTimeSlot);
      }
      const endOfDay = new Date(dayDate);
      endOfDay.setHours(23, 59, 59, 999);
      busyTimes.push([bedTime, endOfDay]);
      const eveningDurationMinutes = (endOfDay.getTime() - bedTime.getTime()) / (1e3 * 60);
      if (eveningDurationMinutes > 0) {
        const sleepEveningTimeSlot = {
          userId,
          subject: "Sleep",
          startTime: bedTime,
          duration: eveningDurationMinutes,
          notes: "Sleep time",
          color: "violet"
        };
        await storage.createTimeSlot(sleepEveningTimeSlot);
      }
      if (timeBlocks && Array.isArray(timeBlocks)) {
        for (const block of timeBlocks) {
          if (block.activity && block.startTime && block.endTime) {
            console.log(`Original input - Activity: ${block.activity}, Start: ${block.startTime}, End: ${block.endTime}`);
            const [startHour, startMinute] = parseTime(block.startTime);
            const [endHour, endMinute] = parseTime(block.endTime);
            console.log(`Parsed hours/minutes - Start: ${startHour}:${startMinute}, End: ${endHour}:${endMinute}`);
            const blockStart = new Date(dayDate);
            blockStart.setHours(startHour, startMinute, 0, 0);
            const blockEnd = new Date(dayDate);
            blockEnd.setHours(endHour, endMinute, 0, 0);
            console.log(`Generated dates - Start: ${blockStart.toISOString()}, End: ${blockEnd.toISOString()}`);
            if (blockEnd < blockStart) {
              blockEnd.setDate(blockEnd.getDate() + 1);
              console.log(`Adjusted end date to next day: ${blockEnd.toISOString()}`);
            }
            busyTimes.push([blockStart, blockEnd]);
            const durationMinutes = (blockEnd.getTime() - blockStart.getTime()) / (1e3 * 60);
            const activityTimeSlot = {
              userId,
              subject: block.activity,
              startTime: blockStart,
              duration: durationMinutes,
              notes: "Daily activity",
              color: "blue"
              // Using a different color to distinguish from study sessions
            };
            await storage.createTimeSlot(activityTimeSlot);
          }
        }
      }
      busyTimes.sort((a, b) => a[0].getTime() - b[0].getTime());
      const mergedBusyTimes = [];
      busyTimes.forEach((time) => {
        const [start, end] = time;
        if (mergedBusyTimes.length === 0) {
          mergedBusyTimes.push([start, end]);
          return;
        }
        const [prevStart, prevEnd] = mergedBusyTimes[mergedBusyTimes.length - 1];
        if (start <= prevEnd) {
          mergedBusyTimes[mergedBusyTimes.length - 1][1] = new Date(Math.max(end.getTime(), prevEnd.getTime()));
        } else {
          mergedBusyTimes.push([start, end]);
        }
      });
      const availableSlots = [];
      for (let i = 0; i < mergedBusyTimes.length - 1; i++) {
        const currentEnd = mergedBusyTimes[i][1];
        const nextStart = mergedBusyTimes[i + 1][0];
        const timeDiff = nextStart.getTime() - currentEnd.getTime();
        const minutesDiff = timeDiff / (1e3 * 60);
        if (minutesDiff >= 30) {
          availableSlots.push([currentEnd, nextStart]);
        }
      }
      availableSlots.sort((a, b) => {
        const durationA = a[1].getTime() - a[0].getTime();
        const durationB = b[1].getTime() - b[0].getTime();
        return durationB - durationA;
      });
      const studySessions = [];
      let totalStudyMinutes = 0;
      const targetStudyMinutes = studyHoursGoal * 60;
      let singleSessionCreated = false;
      for (const [slotStart, slotEnd] of availableSlots) {
        const slotDuration = (slotEnd.getTime() - slotStart.getTime()) / (1e3 * 60);
        if (slotDuration >= targetStudyMinutes && !singleSessionCreated) {
          const studyTimeSlot = {
            userId,
            subject: "Study Session",
            startTime: new Date(slotStart),
            duration: targetStudyMinutes,
            notes: "Consolidated study session based on your schedule",
            color: "red"
          };
          await storage.createTimeSlot(studyTimeSlot);
          studySessions.push(studyTimeSlot);
          totalStudyMinutes = targetStudyMinutes;
          singleSessionCreated = true;
          break;
        }
      }
      if (!singleSessionCreated && availableSlots.length > 0) {
        const [slotStart, slotEnd] = availableSlots[0];
        const slotDuration = (slotEnd.getTime() - slotStart.getTime()) / (1e3 * 60);
        if (slotDuration >= 30) {
          let sessionLength = Math.min(slotDuration, targetStudyMinutes);
          const studyTimeSlot = {
            userId,
            subject: "Study Session",
            startTime: new Date(slotStart),
            duration: sessionLength,
            notes: "Best available consolidated study time",
            color: "red"
          };
          await storage.createTimeSlot(studyTimeSlot);
          studySessions.push(studyTimeSlot);
          totalStudyMinutes = sessionLength;
        }
      }
      if (totalStudyMinutes < targetStudyMinutes) {
        for (let i = 1; i < availableSlots.length; i++) {
          if (totalStudyMinutes >= targetStudyMinutes) break;
          const [slotStart, slotEnd] = availableSlots[i];
          const slotDuration = (slotEnd.getTime() - slotStart.getTime()) / (1e3 * 60);
          if (slotDuration >= 30) {
            let sessionLength = Math.min(slotDuration, targetStudyMinutes - totalStudyMinutes);
            const studyTimeSlot = {
              userId,
              subject: "Study Session",
              startTime: new Date(slotStart),
              duration: sessionLength,
              notes: "Additional study time",
              color: "red"
            };
            await storage.createTimeSlot(studyTimeSlot);
            studySessions.push(studyTimeSlot);
            totalStudyMinutes += sessionLength;
          }
        }
      }
      res.status(201).json({
        success: true,
        message: `Generated ${studySessions.length} study sessions totaling ${Math.round(totalStudyMinutes)} minutes`,
        studySessions
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to generate schedule",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
      message: "Internal server error",
      error: err instanceof Error ? err.message : "Unknown error"
    });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
