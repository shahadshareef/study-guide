import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, addMinutes } from "date-fns";

/**
 * Combines multiple class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gets color classes for various UI elements based on color name
 */
export function getColorClasses(color: string, type: 'bg' | 'text' | 'border' = 'bg') {
  const colorMap: Record<string, Record<string, string>> = {
    bg: {
      indigo: "bg-indigo-100",
      violet: "bg-violet-100",
      orange: "bg-orange-100",
      green: "bg-green-100",
      red: "bg-red-100",
      blue: "bg-blue-100",
      default: "bg-gray-100"
    },
    text: {
      indigo: "text-indigo-800",
      violet: "text-violet-800",
      orange: "text-orange-800",
      green: "text-green-800",
      red: "text-red-800",
      blue: "text-blue-800",
      default: "text-gray-800"
    },
    border: {
      indigo: "border-indigo-200",
      violet: "border-violet-200",
      orange: "border-orange-200",
      green: "border-green-200",
      red: "border-red-200",
      blue: "border-blue-200",
      default: "border-gray-200"
    }
  };
  
  return colorMap[type][color] || colorMap[type].default;
}

/**
 * Formats a duration in minutes to a human-readable string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

/**
 * Formats a time period from start to end
 */
export function formatTimePeriod(startTime: Date, durationMinutes: number): string {
  const start = format(startTime, "h:mm a");
  const end = format(addMinutes(startTime, durationMinutes), "h:mm a");
  return `${start} - ${end}`;
}

/**
 * Truncates text with an ellipsis if it exceeds maxLength
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Calculates the total study time in minutes from an array of time slots
 */
export function calculateTotalStudyTime(timeSlots: Array<{ duration: number }>): number {
  return timeSlots.reduce((total, slot) => total + slot.duration, 0);
}

/**
 * Generates a deterministic color based on a string (e.g., for subjects)
 */
export function getColorFromString(str: string): string {
  const colors = ["indigo", "violet", "orange", "green", "blue", "red"];
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to positive number and get index in colors array
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
