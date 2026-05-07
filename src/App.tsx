import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Volcano from "./pages/labs/Volcano.tsx";
import Electricity from "./pages/labs/Electricity.tsx";
import Gravity from "./pages/labs/Gravity.tsx";
import Rocket from "./pages/labs/Rocket.tsx";
import DNA from "./pages/labs/DNA.tsx";
import Submarine from "./pages/labs/Submarine.tsx";
import Quiz from "./pages/labs/Quiz.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/lab/volcano" element={<Volcano />} />
          <Route path="/lab/electricity" element={<Electricity />} />
          <Route path="/lab/gravity" element={<Gravity />} />
          <Route path="/lab/rocket" element={<Rocket />} />
          <Route path="/lab/dna" element={<DNA />} />
          <Route path="/lab/submarine" element={<Submarine />} />
          <Route path="/lab/quiz" element={<Quiz />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
