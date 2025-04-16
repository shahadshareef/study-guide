import { useLocation, Link } from "wouter";
import { 
  Calendar, 
  StickyNote, 
  CheckSquare,
  PieChart
} from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/flashcards", label: "Flashcards", icon: StickyNote },
    { path: "/goals", label: "Goals", icon: CheckSquare },
    { path: "/analytics", label: "Analytics", icon: PieChart }
  ];
  
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map(item => {
            // Check if current path equals this item's path or if we're at root and this is the Schedule path
            const isActive = location === item.path || (location === "/" && item.path === "/schedule");
            
            return (
              <Link
                key={item.path}
                href={item.path}
              >
                <a
                  className={`
                    py-4 px-1 text-center text-sm font-medium inline-flex items-center
                    ${isActive 
                      ? "border-primary text-primary border-b-2" 
                      : "text-gray-500 hover:text-gray-700"
                    }
                  `}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
