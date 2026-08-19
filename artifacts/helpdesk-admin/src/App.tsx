import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { defaultPathForRole } from "@/auth/roles";
import Dashboard from "@/pages/Dashboard";
import Tickets from "@/pages/Tickets";
import TicketDetail from "@/pages/TicketDetail";
import Departments from "@/pages/Departments";
import Users from "@/pages/Users";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-display font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-muted-foreground">Page not found</p>
      </div>
    </div>
  );
}

function AuthenticatedRoutes() {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to={`/login?next=${encodeURIComponent(location)}`} />;
  }

  return (
    <Switch>
      <Route path="/users">
        {user.role === "admin" ? (
          <Users />
        ) : (
          <Redirect to={defaultPathForRole(user.role)} />
        )}
      </Route>
      <Route path="/departments">
        {user.role === "employee" ? <Redirect to="/tickets" /> : <Departments />}
      </Route>
      <Route path="/tickets/:id" component={TicketDetail} />
      <Route path="/tickets" component={Tickets} />
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route component={AuthenticatedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
