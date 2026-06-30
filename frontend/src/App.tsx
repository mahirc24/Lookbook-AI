import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CreateWizard from "./pages/CreateWizard";
import Results from "./pages/Results";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/creations", element: <Dashboard /> },
  { path: "/create", element: <CreateWizard /> },
  { path: "/jobs/:id", element: <Results /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
