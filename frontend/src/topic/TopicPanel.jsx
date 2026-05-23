import React, { useState, useEffect } from "react";
import EditableText from "./EditableText";
import { api } from "../services/api.js";

function TopicPanel({ onVideoSelect }) {

  /* ================= FILTER STATE ================= */
  const [form, setForm] = useState({
    subjectId: "",
    topicId: "",
    subtopicId: "",
    priority: ""
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  /* ================= DATA ================= */
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [questions, setQuestions] = useState([]);

  /* ================= PAGINATION ================= */
  const [page, setPage] = useState(1);
  const limit = 5;
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  /* ================= LOAD SUBJECTS ================= */
  useEffect(() => {
    const loadSubjects = async () => {
      const data = await api.getSubjects();
      setSubjects(data || []);
    };
    loadSubjects();
  }, []);

  /* ================= LOAD TOPICS ================= */
  useEffect(() => {
    if (!form.subjectId) {
      setTopics([]);
      return;
    }

    const loadTopics = async () => {
      const data = await api.getTopics(form.subjectId);
      setTopics(data || []);
    };

    loadTopics();
  }, [form.subjectId]);

  /* ================= LOAD SUBTOPICS ================= */
  useEffect(() => {
    if (!form.topicId) {
      setSubtopics([]);
      return;
    }

    const loadSubtopics = async () => {
      const data = await api.getSubtopics(form.topicId);
      setSubtopics(data || []);
    };

    loadSubtopics();
  }, [form.topicId]);

  /* ================= LOAD QUESTIONS ================= */
  const loadQuestions = async () => {
    setLoading(true);

    const params = { page, limit };

    if (form.subjectId) params.subject_id = form.subjectId;
    if (form.topicId) params.topic_id = form.topicId;
    if (form.subtopicId) params.subtopic_id = form.subtopicId;
    if (form.priority) params.priority = form.priority;

    const data = await api.getQuestions(params);

    setQuestions(data || []);
    setHasMore(data.length === limit);
    setLoading(false);
  };

  useEffect(() => {
    if (showQuestions) loadQuestions();
  }, [page]);

  /* ================= RENDER ================= */
  return (
    <div className="topic-panel">

      {/* FILTER BAR */}
      <div className="topic-filter">

        <select
          value={form.subjectId}
          onChange={(e) => handleChange("subjectId", e.target.value)}
        >
          <option value="">Subject</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={form.topicId}
          onChange={(e) => handleChange("topicId", e.target.value)}
        >
          <option value="">Topic</option>
          {topics.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          value={form.subtopicId}
          onChange={(e) => handleChange("subtopicId", e.target.value)}
        >
          <option value="">Subtopic</option>
          {subtopics.map(st => (
            <option key={st.id} value={st.id}>{st.name}</option>
          ))}
        </select>

        <select
          value={form.priority}
          onChange={(e) => handleChange("priority", e.target.value)}
        >
          <option value="">Priority</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>

      </div>

      {/* ================= TOPIC CONTENT ================= */}
      {form.topicId && (
        <div className="topic-card">
          {topics
            .filter(t => t.id == form.topicId)
            .map(topic => (
              <div key={topic.id}>
                <h3>{topic.name}</h3>
                <EditableText text={topic.text || "No content"} onSave={()=>{}} />
              </div>
          ))}
        </div>
      )}

      {/* ================= SUBTOPIC CONTENT ================= */}
      {form.subtopicId && (
        <div className="subtopic-card">
          {subtopics
            .filter(st => st.id == form.subtopicId)
            .map(sub => (
              <div key={sub.id}>
                <h4>{sub.name}</h4>
                <EditableText text={sub.text || "No content"} onSave={()=>{}} />
              </div>
          ))}
        </div>
      )}

      {/* ================= LOAD QUESTIONS BUTTON ================= */}
      <button
        onClick={() => {
          setShowQuestions(true);
          setPage(1);
          loadQuestions();
        }}
      >
        Load Questions
      </button>

      {/* ================= QUESTIONS ================= */}
      {showQuestions && (
        <div className="question-section">

          {loading && <p>Loading...</p>}

          {questions.map(q => (
            <div key={q.id} className="question-card">

              <div><strong>Type:</strong> {q.type}</div>

              <EditableText text={q.question_text} onSave={()=>{}} />
              <EditableText text={q.answer_text} onSave={()=>{}} />

              {q.youtube_links && (
                <button onClick={() => onVideoSelect(q.youtube_links)}>
                  ▶ Watch Video
                </button>
              )}

            </div>
          ))}

          {/* PAGINATION */}
          <div style={{ marginTop: 20 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>

            <span style={{ margin: "0 10px" }}>Page {page}</span>

            <button
              disabled={!hasMore}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

export default TopicPanel;