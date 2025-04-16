import { format, addMinutes } from "date-fns";
import { Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimeSlot as TimeSlotType } from "@shared/schema";

interface TimeSlotProps {
  timeSlot: TimeSlotType;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TimeSlot({ timeSlot, onEdit, onDelete }: TimeSlotProps) {
  const startTime = new Date(timeSlot.startTime);
  const endTime = addMinutes(startTime, timeSlot.duration);
  
  const formatTime = (date: Date) => format(date, "hh:mm a");
  const formatTimeRange = () => `${formatTime(startTime)} - ${formatTime(endTime)}`;
  
  const getColorClasses = (color: string) => {
    switch (color) {
      case "indigo":
        return "bg-indigo-100 text-indigo-800";
      case "violet":
        return "bg-violet-100 text-violet-800";
      case "orange":
        return "bg-orange-100 text-orange-800";
      case "green":
        return "bg-green-100 text-green-800";
      case "red":
        return "bg-red-100 text-red-800";
      case "blue":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getSubColorClasses = (color: string) => {
    switch (color) {
      case "indigo":
        return "text-indigo-600";
      case "violet":
        return "text-violet-600";
      case "orange":
        return "text-orange-600";
      case "green":
        return "text-green-600";
      case "red":
        return "text-red-600";
      case "blue":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };
  
  const getNotesColorClasses = (color: string) => {
    switch (color) {
      case "indigo":
        return "text-indigo-700";
      case "violet":
        return "text-violet-700";
      case "orange":
        return "text-orange-700";
      case "green":
        return "text-green-700";
      case "red":
        return "text-red-700";
      case "blue":
        return "text-blue-700";
      default:
        return "text-gray-700";
    }
  };
  
  return (
    <div className="time-slot border-b border-gray-100 py-2 hover:bg-gray-50">
      <div className="w-full">
        <div className={`${getColorClasses(timeSlot.color)} rounded p-2 mb-1 group relative`}>
          <div className="flex justify-between">
            <div className="flex flex-col space-y-1">
              <div className="text-xs font-medium">{formatTimeRange()}</div>
              <div className="font-medium">{timeSlot.subject}</div>
            </div>
            <div className={`text-xs ${getSubColorClasses(timeSlot.color)}`}>
              {Math.floor(timeSlot.duration / 60)}h {timeSlot.duration % 60 > 0 ? `${timeSlot.duration % 60}m` : ""}
            </div>
          </div>
          {timeSlot.notes && (
            <div className={`text-xs ${getNotesColorClasses(timeSlot.color)} mt-1`}>{timeSlot.notes}</div>
          )}
          
          {(onEdit || onDelete) && (
            <div className="absolute top-2 right-2 hidden group-hover:flex space-x-1">
              {onEdit && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
