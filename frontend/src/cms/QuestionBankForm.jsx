// src/components/cms/QuestionBankForm.jsx
import React, { useState, useEffect } from "react";
import { api } from "../services/api.js";

function QuestionBankForm({ subjects: propSubjects = [] }) {
  const [form, setForm] = useState({
    subjectId: "",
    topicId: "",
    subtopicId: "",
    microtopicId: "",
    type: "common",
    questionText: "",
    answerText: "",
    youtubeLinks: [""],
    difficulty: "Medium",
  });
  

  const [questionImages, setQuestionImages] = useState([]);
  const [answerImages, setAnswerImages] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);

  const [subjects, setSubjects] = useState(Array.isArray(propSubjects) ? propSubjects : []);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [microtopics, setMicrotopics] = useState([]);

  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // If parent passes subjects, use them; otherwise load once.
  useEffect(() => {
    let cancelled = false;
    if (Array.isArray(propSubjects) && propSubjects.length > 0) {
      setSubjects(propSubjects);
      return;
    }

    const loadSubjects = async () => {
      try {
        const data = await api.getSubjects();
        if (cancelled) return;
        setSubjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load subjects:", err?.message ?? err);
      }
    };

    loadSubjects();

    return () => {
      cancelled = true;
    };
  }, [propSubjects]);

  // Load topics when subject changes
  useEffect(() => {
    let cancelled = false;
    const subjectId = form.subjectId;

    if (!subjectId) {
      setTopics([]);
      setSubtopics([]);
      setMicrotopics([]);
      setForm((p) => ({ ...p, topicId: "", subtopicId: "", microtopicId: "" }));
      return;
    }

    const loadTopics = async () => {
      try {
        const data = await api.getTopics(subjectId);
        if (cancelled) return;
        setTopics(Array.isArray(data) ? data : []);
        setSubtopics([]);
        setMicrotopics([]);
        setForm((p) => ({ ...p, topicId: "", subtopicId: "", microtopicId: "" }));
      } catch (err) {
        console.error("Failed to load topics:", err?.message ?? err);
      }
    };

    loadTopics();
    return () => {
      cancelled = true;
    };
  }, [form.subjectId]);

  // Load subtopics when topic changes
  useEffect(() => {
    let cancelled = false;
    const topicId = form.topicId;

    if (!topicId) {
      setSubtopics([]);
      setMicrotopics([]);
      setForm((p) => ({ ...p, subtopicId: "", microtopicId: "" }));
      return;
    }

    const loadSubtopics = async () => {
      try {
        const data = await api.getSubtopics(topicId);
        if (cancelled) return;
        setSubtopics(Array.isArray(data) ? data : []);
        setMicrotopics([]);
        setForm((p) => ({ ...p, subtopicId: "", microtopicId: "" }));
      } catch (err) {
        console.error("Failed to load subtopics:", err?.message ?? err);
      }
    };

    loadSubtopics();
    return () => {
      cancelled = true;
    };
  }, [form.topicId]);

  // Load microtopics when subtopic changes
  useEffect(() => {
    let cancelled = false;
    const subtopicId = form.subtopicId;

    if (!subtopicId) {
      setMicrotopics([]);
      setForm((p) => ({ ...p, microtopicId: "" }));
      return;
    }

    const loadMicrotopics = async () => {
      try {
        const data = await api.getMicrotopics(subtopicId);
        if (cancelled) return;
        setMicrotopics(Array.isArray(data) ? data : []);
        setForm((p) => ({ ...p, microtopicId: "" }));
      } catch (err) {
        console.error("Failed to load microtopics:", err?.message ?? err);
      }
    };

    loadMicrotopics();
    return () => {
      cancelled = true;
    };
  }, [form.subtopicId]);

  // Youtube handlers
  const addYoutubeField = () => {
    setForm((prev) => ({ ...prev, youtubeLinks: [...prev.youtubeLinks, ""] }));
  };

  const updateYoutube = (index, value) => {
    setForm((prev) => {
      const updated = [...(prev.youtubeLinks || [])];
      updated[index] = value;
      return { ...prev, youtubeLinks: updated };
    });
  };

  // File handlers (replace or append - here we append new selection)
  const onQuestionImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setQuestionImages((prev) => [...prev, ...files]);
  };

  const onAnswerImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setAnswerImages((prev) => [...prev, ...files]);
  };

  const onPdfChange = (e) => {
    setPdfFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
  };

  // Save handler
  const handleSave = async () => {
    if (!form.subjectId || !form.topicId || !form.questionText?.trim()) {
      alert("Subject, Topic and Question Text are mandatory");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();

      fd.append("subject_id", form.subjectId);
      fd.append("topic_id", form.topicId);
      if (form.subtopicId) fd.append("subtopic_id", form.subtopicId);
      if (form.microtopicId) fd.append("microtopic_id", form.microtopicId);
      fd.append("type", form.type);
      fd.append("question_text", form.questionText);
      if (form.answerText) fd.append("answer_text", form.answerText);
      fd.append("difficulty", form.difficulty || "Medium");

      (form.youtubeLinks || [])
        .filter((l) => l && l.trim() !== "")
        .forEach((link) => fd.append("youtube_links", link));

      (questionImages || []).forEach((f) => fd.append("question_images", f));
      (answerImages || []).forEach((f) => fd.append("answer_images", f));
      if (pdfFile) fd.append("pdf_file", pdfFile);

      await api.createQuestion(fd);

      alert("Question created successfully");

      // reset form and files
      setForm({
        subjectId: "",
        topicId: "",
        subtopicId: "",
        microtopicId: "",
        type: "common",
        questionText: "",
        answerText: "",
        youtubeLinks: [""],
        difficulty: "Medium",
      });
      setQuestionImages([]);
      setAnswerImages([]);
      setPdfFile(null);
      // also clear dependent lists
      setTopics([]);
      setSubtopics([]);
      setMicrotopics([]);
    } catch (err) {
      console.error("Create question failed:", err);
      alert(err?.message || "Failed to save question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="question-bank">
      <h3>Add Question</h3>

      {/* SUBJECT */}
      <select value={form.subjectId} onChange={(e) => handleChange("subjectId", e.target.value)}>
        <option value="">Select Subject *</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* TOPIC */}
      <select value={form.topicId} onChange={(e) => handleChange("topicId", e.target.value)}>
        <option value="">Select Topic *</option>
        {topics.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {/* SUBTOPIC (OPTIONAL) */}
      <select value={form.subtopicId} onChange={(e) => handleChange("subtopicId", e.target.value)}>
        <option value="">Select Subtopic (Optional)</option>
        {subtopics.map((st) => (
          <option key={st.id} value={st.id}>
            {st.name}
          </option>
        ))}
      </select>

      {/* MICROTOPIC (OPTIONAL ) */}
      <select value={form.microtopicId} onChange={(e) => handleChange("microtopicId", e.target.value)}>
        <option value="">Select Microtopic</option>
        {microtopics.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      {/* TYPE */}
      <select value={form.type} onChange={(e) => handleChange("type", e.target.value)}>
        <option value="pyq">PYQ</option>
        <option value="common">Common</option>
      </select>

      {/* DIFFICULTY */}
      <select value={form.difficulty} onChange={(e) => handleChange("difficulty", e.target.value)}>
        <option>Easy</option>
        <option>Medium</option>
        <option>Hard</option>
      </select>

      {/* QUESTION TEXT */}
      <textarea
        placeholder="Question Text *"
        value={form.questionText}
        onChange={(e) => handleChange("questionText", e.target.value)}
      />

      {/* QUESTION IMAGES */}
      <input type="file" multiple accept="image/*" onChange={onQuestionImagesChange} />

      {/* ANSWER TEXT */}
      <textarea placeholder="Answer Text" value={form.answerText} onChange={(e) => handleChange("answerText", e.target.value)} />

      {/* ANSWER IMAGES */}
      <input type="file" multiple accept="image/*" onChange={onAnswerImagesChange} />

      {/* PDF */}
      <input type="file" accept="application/pdf" onChange={onPdfChange} />

      {/* YOUTUBE LINKS */}
      {(form.youtubeLinks || []).map((link, index) => (
        <input key={index} placeholder="YouTube Link" value={link} onChange={(e) => updateYoutube(index, e.target.value)} />
      ))}

      <button type="button" onClick={addYoutubeField}>
        + Add More Video
      </button>

      <button type="button" disabled={loading} onClick={handleSave}>
        {loading ? "Saving..." : "Save Question"}
      </button>
    </div>
  );
}

export default QuestionBankForm;