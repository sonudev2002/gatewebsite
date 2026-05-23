// src/services/subjectStore.js
import { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

const SubjectContext = createContext(null);

export function SubjectProvider({ children }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSubjects = async () => {
      try {
        setLoading(true);
        const data = await api.getSubjects(); // already normalized
        if (!cancelled) {
          setSubjects(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load subjects:", err);
        if (!cancelled) {
          setSubjects([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSubjects();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SubjectContext.Provider value={{ subjects, setSubjects, loading }}>
      {children}
    </SubjectContext.Provider>
  );
}

export function useSubjects() {
  const context = useContext(SubjectContext);

  if (!context) {
    throw new Error("useSubjects must be used inside SubjectProvider");
  }

  return context;
}