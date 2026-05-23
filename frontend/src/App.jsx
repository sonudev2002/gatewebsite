// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/home";
import Dashboard from "./pages/dashboard";
import { SubjectProvider } from "./services/subjectStore";

function App() {
  return (
    <SubjectProvider>
      <BrowserRouter>
        <Routes>

          {/* Login */}
          <Route path="/" element={<Login />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </SubjectProvider>
  );
}

export default App;