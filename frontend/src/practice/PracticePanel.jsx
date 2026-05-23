// src/components/practice/PracticePanel.jsx
import React, { useState, useEffect, useMemo } from "react";
import { api } from "../services/api.js";

function PracticePanel({ onVideoSelect = () => {} }) {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);

  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  const [expandedId, setExpandedId] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 10;

  const [filter, setFilter] = useState({
    subject: "",
    topic: "",
    subtopic: "",
    priority: "",
    sort: "oldest",
  });

  const [data, setData] = useState([]);

  /* ================= FETCH SUBJECTS ================= */
  useEffect(() => {
    let cancelled = false;

    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const res = await api.getSubjects();
        if (cancelled) return;
        setSubjects(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to fetch subjects:", err);
        if (!cancelled) setSubjects([]);
      } finally {
        if (!cancelled) setLoadingSubjects(false);
      }
    };

    fetchSubjects();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ================= FETCH TOPICS (when subject filter changes) ================= */
  useEffect(() => {
    let cancelled = false;

    if (!filter.subject) {
      setTopics([]);
      return;
    }

    const fetchTopics = async () => {
      try {
        const res = await api.getTopics(filter.subject);
        if (cancelled) return;
        setTopics(Array.isArray(res) ? res : []);
        setSubtopics([]);
        setFilter((prev) => ({ ...prev, topic: "", subtopic: "" }));
        setPage(1);
      } catch (err) {
        console.error("Failed to fetch topics:", err);
        if (!cancelled) {
          setTopics([]);
        }
      }
    };

    fetchTopics();

    return () => {
      cancelled = true;
    };
  }, [filter.subject]);

  /* ================= FETCH SUBTOPICS (when topic filter changes) ================= */
  useEffect(() => {
    let cancelled = false;

    if (!filter.topic) {
      setSubtopics([]);
      return;
    }

    const fetchSubtopics = async () => {
      try {
        const res = await api.getSubtopics(filter.topic);
        if (cancelled) return;
        setSubtopics(Array.isArray(res) ? res : []);
        setFilter((prev) => ({ ...prev, subtopic: "" }));
        setPage(1);
      } catch (err) {
        console.error("Failed to fetch subtopics:", err);
        if (!cancelled) {
          setSubtopics([]);
        }
      }
    };

    fetchSubtopics();

    return () => {
      cancelled = true;
    };
  }, [filter.topic]);

  /* ================= FETCH PRACTICE ================= */
  useEffect(() => {
    let cancelled = false;

    const fetchPractice = async () => {
      setLoadingData(true);
      try {
        const params = {
          subject_id: filter.subject || "",
          topic_id: filter.topic || "",
          subtopic_id: filter.subtopic || "",
          priority: filter.priority || "",
          sort: filter.sort || "oldest",
          page,
          limit,
        };

        const res = await api.getPractice(params);
        if (cancelled) return;
        // api.getPractice returns an array (per api.js)
        setData(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to fetch practice data:", err);
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    fetchPractice();

    return () => {
      cancelled = true;
    };
  }, [filter, page]);

  /* ================= SUBJECT MAP ================= */
  const subjectMap = useMemo(() => {
    const map = {};
    subjects.forEach((s) => {
      // subjects are normalized as { id, name }
      if (s && s.id != null) map[s.id] = s.name ?? "";
    });
    return map;
  }, [subjects]);

  return (
    <div className="practice-panel">
      {/* ================= FILTER BAR ================= */}
      <div className="practice-filter">
        {/* SUBJECT */}
        <select
          value={filter.subject}
          onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
        >
          <option value="">All Subjects</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>

        {/* TOPIC */}
        <select
          value={filter.topic}
          onChange={(e) => setFilter({ ...filter, topic: e.target.value })}
        >
          <option value="">All Topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* SUBTOPIC */}
        <select
          value={filter.subtopic}
          onChange={(e) => setFilter({ ...filter, subtopic: e.target.value })}
        >
          <option value="">All Subtopics</option>
          {subtopics.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>

        {/* PRIORITY */}
        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
        >
          <option value="">Priority</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>

        {/* SORT */}
        <select
          value={filter.sort}
          onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
        >
          <option value="oldest">Oldest</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* ================= CONTENT LIST ================= */}
      <div className="practice-scroll">
        {loadingData ? (
          <p style={{ padding: "20px" }}>Loading...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: "20px" }}>No practice items found.</p>
        ) : (
          data.map((item) => {
            const pid = item.PId ?? item.id ?? item.pId ?? item.pid;
            return (
              <div key={pid} className="practice-card">
                {/* META SECTION */}
                <div className="meta-section">
                  <div>
                    <strong>{item.question ?? item.question_text ?? "Untitled"}</strong>
                    <p>{subjectMap[item.subject_id] ?? ""}</p>
                    <small>{item.created_at ?? ""}</small>
                  </div>

                  <select
                    value={item.priority ?? "Medium"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setData((prev) =>
                        prev.map((d) =>
                          (d.PId ?? d.id) === (item.PId ?? item.id)
                            ? { ...d, priority: val }
                            : d
                        )
                      );
                    }}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>

                {/* IMAGES SECTION */}
                <div className="image-section">
                  {(item.images || []).map((img, i) => (
                    <div key={i} className="image-wrapper">
                      <img src={img} width="100" alt={`img-${i}`} />
                      <button
                        onClick={() => {
                          setData((prev) =>
                            prev.map((d) =>
                              (d.PId ?? d.id) === (item.PId ?? item.id)
                                ? { ...d, images: (d.images || []).filter((_, idx) => idx !== i) }
                                : d
                            )
                          );
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* VIEW SOLUTION */}
                <button onClick={() => setExpandedId(expandedId === (item.PId ?? item.id) ? null : (item.PId ?? item.id))}>
                  {expandedId === (item.PId ?? item.id) ? "Hide Solution" : "View Solution"}
                </button>

                {/* NOTES SECTION */}
                <textarea
                  placeholder="Write self notes..."
                  value={item.selfNotes ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setData((prev) =>
                      prev.map((d) =>
                        (d.PId ?? d.id) === (item.PId ?? item.id) ? { ...d, selfNotes: val } : d
                      )
                    );
                  }}
                />

                {/* SUBCONTENT */}
                {expandedId === (item.PId ?? item.id) && (
                  <div className="subcontent">
                    <div className="sub-section">
                      <h4>Self Notes</h4>
                      <p>{item.selfNotes ?? "No notes yet."}</p>
                    </div>

                    <div className="sub-section">
                      <h4>Videos</h4>
                      {(item.youtube || []).map((vid, i) => (
                        <button key={i} onClick={() => onVideoSelect(vid)}>
                          ▶ Watch Video {i + 1}
                        </button>
                      ))}
                    </div>

                    <div className="sub-section">
                      <h4>Answer</h4>
                      {(item.answers || []).map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          width="150"
                          style={{ cursor: "zoom-in" }}
                          onClick={() => window.open(img)}
                          alt={`answer-${i}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ================= PAGINATION ================= */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 15 }}>
        <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Prev
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}

export default PracticePanel;