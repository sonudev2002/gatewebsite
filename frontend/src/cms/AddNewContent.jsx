// src/components/cms/AddNewContent.jsx
import React, { useState, useEffect } from "react";
import CMSBuilder from "./CMSBuilder";
import QuestionBankForm from "./QuestionBankForm";
import { CMS_LEVELS } from "./cmsConfig";
import { api } from "../services/api.js";

function AddNewContent({ subjects, setSubjects }) {
  const [activeForm, setActiveForm] = useState("topic");

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);

  /* ================= FETCH SUBJECTS ================= */
  useEffect(() => {
    let cancelled = false;

    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const data = await api.getSubjects();
        if (cancelled) return;
        setSubjects(data || []);
      } catch (err) {
        console.error("Subjects fetch error:", err?.message ?? err);
      } finally {
        if (!cancelled) setLoadingSubjects(false);
      }
    };

    // fetch only if parent hasn't provided subjects yet
    if (!subjects || subjects.length === 0) {
      fetchSubjects();
    }

    return () => {
      cancelled = true;
    };
  }, [subjects, setSubjects]);

  /* ================= FETCH TOPICS ================= */
  useEffect(() => {
    let cancelled = false;
    if (!selectedSubject) {
      setTopics([]);
      setSubtopics([]);
      setSelectedTopic("");
      return;
    }

    const fetchTopics = async () => {
      try {
        setLoadingTopics(true);
        const data = await api.getTopics(selectedSubject);
        if (cancelled) return;
        setTopics(Array.isArray(data) ? data : []);
        setSubtopics([]);
        setSelectedTopic("");
      } catch (err) {
        console.error("Topics fetch error:", err?.message ?? err);
      } finally {
        if (!cancelled) setLoadingTopics(false);
      }
    };

    fetchTopics();

    return () => {
      cancelled = true;
    };
  }, [selectedSubject]);

  /* ================= FETCH SUBTOPICS ================= */
  useEffect(() => {
    let cancelled = false;
    if (!selectedTopic) {
      setSubtopics([]);
      return;
    }

    const fetchSubtopics = async () => {
      try {
        setLoadingSubtopics(true);
        // api.getSubtopics returns an array (api.js normalized responses)
        const data = await api.getSubtopics(selectedTopic);
        if (cancelled) return;
        setSubtopics(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Subtopics fetch error:", err?.message ?? err);
      } finally {
        if (!cancelled) setLoadingSubtopics(false);
      }
    };

    fetchSubtopics();

    return () => {
      cancelled = true;
    };
  }, [selectedTopic]);

  return (
    <div className="add-panel">
      <div className="add-switcher">
        {Object.keys(CMS_LEVELS).map((level) => (
          <button
            key={level}
            className={activeForm === level ? "active" : ""}
            onClick={() => setActiveForm(level)}
          >
            Add {CMS_LEVELS[level].label}
          </button>
        ))}

        <button
          className={activeForm === "question" ? "active" : ""}
          onClick={() => setActiveForm("question")}
        >
          Add Question
        </button>
      </div>

      <div className="add-form-container">
        {activeForm !== "question" ? (
          <CMSBuilder
            level={activeForm}
            subjects={subjects}
            setSubjects={setSubjects}
            topics={topics}
            subtopics={subtopics}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            loadingSubjects={loadingSubjects}
            loadingTopics={loadingTopics}
            loadingSubtopics={loadingSubtopics}
          />
        ) : (
          <QuestionBankForm subjects={subjects} />
        )}
      </div>
    </div>
  );
}

export default AddNewContent;