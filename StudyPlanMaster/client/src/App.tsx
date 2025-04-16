import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import Schedule from "@/pages/Schedule";
import Flashcards from "@/pages/Flashcards";
import Goals from "@/pages/Goals";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Navigation from "@/components/layout/Navigation";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Navigation />
      
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/flashcards" component={Flashcards} />
        <Route path="/goals" component={Goals} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
