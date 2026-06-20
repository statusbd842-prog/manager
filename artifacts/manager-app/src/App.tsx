import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/lib/auth-context";

import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import Dashboard from "./pages/dashboard";
import ClassDetail from "./pages/class-detail";
import Attendance from "./pages/attendance";
import Homework from "./pages/homework";
import Fees from "./pages/fees";
import Students from "./pages/students";
import StudentProfilePage from "./pages/student-profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center app-gradient">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!session) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  const { session, loading, isRecovery } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center app-gradient">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">
        {session && !isRecovery ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      <Route path="/signup">
        {session && !isRecovery ? <Redirect to="/dashboard" /> : <Signup />}
      </Route>
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/class/:id">
        <ProtectedRoute component={ClassDetail} />
      </Route>
      <Route path="/attendance">
        <ProtectedRoute component={Attendance} />
      </Route>
      <Route path="/homework">
        <ProtectedRoute component={Homework} />
      </Route>
      <Route path="/fees">
        <ProtectedRoute component={Fees} />
      </Route>
      <Route path="/students">
        <ProtectedRoute component={Students} />
      </Route>
      <Route path="/students/:id">
        <ProtectedRoute component={StudentProfilePage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
