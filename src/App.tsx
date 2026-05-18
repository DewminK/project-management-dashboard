import "./App.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { ProjectProvider } from "./context/ProjectContext";

function App() {
  return (
    <>
      <ProjectProvider>
        <RouterProvider router={router} />
      </ProjectProvider>
    </>
  );
}

export default App;