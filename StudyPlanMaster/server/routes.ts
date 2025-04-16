import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTimeSlotSchema, 
  insertFlashcardSchema, 
  insertGoalSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to simulate a user for demo purposes
  app.use(async (req, res, next) => {
    // Get demo user
    const demoUser = await storage.getUserByUsername("demo");
    if (demoUser) {
      req.body.userId = demoUser.id;
    }
    next();
  });

  // API Routes - prefix all routes with /api
  
  // Time Slots
  app.get("/api/time-slots", async (req: Request, res: Response) => {
    try {
      const userId = req.body.userId;
      let date: Date | undefined = undefined;
      
      if (req.query.date) {
        date = new Date(req.query.date as string);
      }
      
      const timeSlots = await storage.getTimeSlots(userId, date);
      res.json(timeSlots);
    } catch (error) {
      res.status(500).json({ message: "Failed to get time slots", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/time-slots/:id", async (req: Request, res: Response) => {
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

  app.post("/api/time-slots", async (req: Request, res: Response) => {
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

  app.put("/api/time-slots/:id", async (req: Request, res: Response) => {
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

  app.delete("/api/time-slots/:id", async (req: Request, res: Response) => {
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

  // Flashcards
  app.get("/api/flashcards", async (req: Request, res: Response) => {
    try {
      const userId = req.body.userId;
      const tag = req.query.tag as string | undefined;
      
      const flashcards = await storage.getFlashcards(userId, tag);
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ message: "Failed to get flashcards", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/flashcards/due", async (req: Request, res: Response) => {
    try {
      const userId = req.body.userId;
      const dueFlashcards = await storage.getDueFlashcards(userId);
      res.json(dueFlashcards);
    } catch (error) {
      res.status(500).json({ message: "Failed to get due flashcards", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/flashcards/:id", async (req: Request, res: Response) => {
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

  app.post("/api/flashcards", async (req: Request, res: Response) => {
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

  app.put("/api/flashcards/:id", async (req: Request, res: Response) => {
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

  app.post("/api/flashcards/:id/review", async (req: Request, res: Response) => {
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

  app.delete("/api/flashcards/:id", async (req: Request, res: Response) => {
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

  // Goals
  app.get("/api/goals", async (req: Request, res: Response) => {
    try {
      const userId = req.body.userId;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to get goals", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/goals/:id", async (req: Request, res: Response) => {
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

  app.post("/api/goals", async (req: Request, res: Response) => {
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

  app.put("/api/goals/:id", async (req: Request, res: Response) => {
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

  app.post("/api/goals/:id/toggle", async (req: Request, res: Response) => {
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

  app.delete("/api/goals/:id", async (req: Request, res: Response) => {
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
  
  // Recommendation endpoint
  app.get("/api/recommendations", async (req: Request, res: Response) => {
    try {
      const userId = req.body.userId;
      const timeSlots = await storage.getTimeSlots(userId);
      
      // Simple recommendation logic - find gaps in schedule and suggest study sessions
      // In a real application this would be more sophisticated
      
      // Mock recommendation for demo purposes
      const recommendation = {
        subject: "Chemistry Review",
        duration: 60, // 1 hour
        suggestedStartTime: "14:30", // 2:30 PM
        reason: "Based on your schedule and study habits"
      };
      
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recommendations", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  
  // Generate schedule based on user's daily routine
  app.post("/api/generate-schedule", async (req: Request, res: Response) => {
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
      
      // Parse start and end times
      const parseTime = (timeString: string): [number, number] => {
        console.log(`Parsing time string: "${timeString}"`);
        // Check for AM/PM format
        let hours = 0;
        let minutes = 0;
        
        if (timeString.includes('AM') || timeString.includes('PM')) {
          // Handle 12-hour format with AM/PM
          const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
          const match = timeString.match(timeRegex);
          
          if (match) {
            let hour = parseInt(match[1], 10);
            const minute = parseInt(match[2], 10);
            const period = match[3].toUpperCase();
            
            // Convert to 24-hour format
            if (period === 'PM' && hour < 12) {
              hour += 12;
            } else if (period === 'AM' && hour === 12) {
              hour = 0;
            }
            
            hours = hour;
            minutes = minute;
            console.log(`Parsed 12-hour format: ${hour}:${minute} ${period} -> ${hours}:${minutes} (24hr)`);
          } else {
            console.log(`Failed to parse 12-hour format, falling back to default parsing`);
            const [h, m] = timeString.split(':').map(Number);
            hours = h || 0;
            minutes = m || 0;
          }
        } else {
          // Standard 24-hour format
          const [h, m] = timeString.split(':').map(Number);
          hours = h || 0;
          minutes = m || 0;
          console.log(`Parsed 24-hour format: ${hours}:${minutes}`);
        }
        
        return [hours, minutes];
      };
      
      const [wakeHour, wakeMinute] = parseTime(wakeUpTime);
      const [sleepHour, sleepMinute] = parseTime(sleepTime);
      
      // Convert day to timestamp ranges
      const dayDate = new Date(date);
      
      const startOfDay = new Date(dayDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const wakeTime = new Date(dayDate);
      wakeTime.setHours(wakeHour, wakeMinute, 0, 0);
      
      const bedTime = new Date(dayDate);
      bedTime.setHours(sleepHour, sleepMinute, 0, 0);
      // If sleep time is earlier than wake time, it's on the next day
      if (bedTime < wakeTime) {
        bedTime.setDate(bedTime.getDate() + 1);
      }
      
      // Convert busy times to timestamp ranges
      const busyTimes: Array<[Date, Date]> = [];
      
      // Add busy time for sleeping until wake up
      busyTimes.push([startOfDay, wakeTime]);
      
      // Save sleeping period as a time slot
      const morningDurationMinutes = (wakeTime.getTime() - startOfDay.getTime()) / (1000 * 60);
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
      
      // Add busy time from sleep time to end of day
      const endOfDay = new Date(dayDate);
      endOfDay.setHours(23, 59, 59, 999);
      busyTimes.push([bedTime, endOfDay]);
      
      // Save evening sleeping period as a time slot
      const eveningDurationMinutes = (endOfDay.getTime() - bedTime.getTime()) / (1000 * 60);
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
      
      // Add all user specified time blocks and also save them as time slots
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
            
            // If end time is earlier than start time, it's on the next day
            if (blockEnd < blockStart) {
              blockEnd.setDate(blockEnd.getDate() + 1);
              console.log(`Adjusted end date to next day: ${blockEnd.toISOString()}`);
            }
            
            // Add to busy times for schedule generation
            busyTimes.push([blockStart, blockEnd]);
            
            // Calculate duration in minutes
            const durationMinutes = (blockEnd.getTime() - blockStart.getTime()) / (1000 * 60);
            
            // Also create a time slot for this activity to show in the schedule
            const activityTimeSlot = {
              userId,
              subject: block.activity,
              startTime: blockStart,
              duration: durationMinutes,
              notes: "Daily activity",
              color: "blue" // Using a different color to distinguish from study sessions
            };
            
            // Save to storage
            await storage.createTimeSlot(activityTimeSlot);
          }
        }
      }
      
      // Sort busy times by start time
      busyTimes.sort((a, b) => a[0].getTime() - b[0].getTime());
      
      // Merge overlapping busy times
      const mergedBusyTimes: Array<[Date, Date]> = [];
      busyTimes.forEach((time) => {
        const [start, end] = time;
        if (mergedBusyTimes.length === 0) {
          mergedBusyTimes.push([start, end]);
          return;
        }
        
        const [prevStart, prevEnd] = mergedBusyTimes[mergedBusyTimes.length - 1];
        if (start <= prevEnd) {
          // Merge overlapping times
          mergedBusyTimes[mergedBusyTimes.length - 1][1] = new Date(Math.max(end.getTime(), prevEnd.getTime()));
        } else {
          // Add new non-overlapping time
          mergedBusyTimes.push([start, end]);
        }
      });
      
      // Find available time slots
      const availableSlots: Array<[Date, Date]> = [];
      for (let i = 0; i < mergedBusyTimes.length - 1; i++) {
        const currentEnd = mergedBusyTimes[i][1];
        const nextStart = mergedBusyTimes[i + 1][0];
        
        // If there's more than 30 minutes between busy times, it's an available slot
        const timeDiff = nextStart.getTime() - currentEnd.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        
        if (minutesDiff >= 30) {
          availableSlots.push([currentEnd, nextStart]);
        }
      }
      
      // Sort available slots by duration (longest first) to prioritize longer continuous sessions
      availableSlots.sort((a, b) => {
        const durationA = a[1].getTime() - a[0].getTime();
        const durationB = b[1].getTime() - b[0].getTime();
        return durationB - durationA; // Descending order (longest first)
      });
      
      // Generate study sessions from available slots
      const studySessions = [];
      let totalStudyMinutes = 0;
      const targetStudyMinutes = studyHoursGoal * 60;
      
      // Look for a single slot that can accommodate the entire study session
      let singleSessionCreated = false;
      
      for (const [slotStart, slotEnd] of availableSlots) {
        const slotDuration = (slotEnd.getTime() - slotStart.getTime()) / (1000 * 60);
        
        // Check if this slot can fit the entire study session
        if (slotDuration >= targetStudyMinutes && !singleSessionCreated) {
          // Create one consolidated study session
          const studyTimeSlot = {
            userId,
            subject: "Study Session",
            startTime: new Date(slotStart),
            duration: targetStudyMinutes,
            notes: "Consolidated study session based on your schedule",
            color: "red"
          };
          
          // Save to storage
          await storage.createTimeSlot(studyTimeSlot);
          
          studySessions.push(studyTimeSlot);
          totalStudyMinutes = targetStudyMinutes;
          singleSessionCreated = true;
          break; // Exit loop after creating a single session
        }
      }
      
      // If we couldn't create a single consolidated session, use the longest available slot
      if (!singleSessionCreated && availableSlots.length > 0) {
        const [slotStart, slotEnd] = availableSlots[0]; // First slot is the longest due to sorting
        const slotDuration = (slotEnd.getTime() - slotStart.getTime()) / (1000 * 60);
        
        // If slot is big enough for a study session
        if (slotDuration >= 30) {
          let sessionLength = Math.min(slotDuration, targetStudyMinutes);
          
          // Create a study session
          const studyTimeSlot = {
            userId,
            subject: "Study Session",
            startTime: new Date(slotStart),
            duration: sessionLength,
            notes: "Best available consolidated study time",
            color: "red"
          };
          
          // Save to storage
          await storage.createTimeSlot(studyTimeSlot);
          
          studySessions.push(studyTimeSlot);
          totalStudyMinutes = sessionLength;
        }
      }
      
      // If we still haven't reached our target study minutes, add more sessions in other slots
      if (totalStudyMinutes < targetStudyMinutes) {
        for (let i = 1; i < availableSlots.length; i++) {
          if (totalStudyMinutes >= targetStudyMinutes) break;
          
          const [slotStart, slotEnd] = availableSlots[i];
          const slotDuration = (slotEnd.getTime() - slotStart.getTime()) / (1000 * 60);
          
          // If slot is big enough for a study session
          if (slotDuration >= 30) {
            let sessionLength = Math.min(slotDuration, targetStudyMinutes - totalStudyMinutes);
            
            // Create a study session
            const studyTimeSlot = {
              userId,
              subject: "Study Session",
              startTime: new Date(slotStart),
              duration: sessionLength,
              notes: "Additional study time",
              color: "red"
            };
            
            // Save to storage
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

  // Handle errors globally
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ 
      message: "Internal server error", 
      error: err instanceof Error ? err.message : "Unknown error" 
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}