import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TimeSlotDialog from "@/components/dialogs/TimeSlotDialog";

export default function Header() {
  const [showTimeSlotDialog, setShowTimeSlotDialog] = useState(false);
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-primary mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h1 className="text-xl font-semibold text-gray-800">StudyFlow</h1>
          </div>
          <div className="flex items-center">
            <Button onClick={() => setShowTimeSlotDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Study Session
            </Button>
          </div>
        </div>
      </div>
      
      <TimeSlotDialog
        open={showTimeSlotDialog}
        onOpenChange={setShowTimeSlotDialog}
      />
    </header>
  );
}
