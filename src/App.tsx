import "./App.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { ProjectProvider } from "./context/ProjectContext";
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <>
      <ToastProvider>
        <ProjectProvider>
          <RouterProvider router={router} />
        </ProjectProvider>
      </ToastProvider>
    </>
  );
}

export default App;