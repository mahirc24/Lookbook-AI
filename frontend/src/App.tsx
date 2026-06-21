import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CreateWizard from "./pages/CreateWizard";
import Results from "./pages/Results";

const router = createBrowserRouter([
  { path: "/", element: <Dashboard /> },
  { path: "/create", element: <CreateWizard /> },
  { path: "/jobs/:id", element: <Results /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
