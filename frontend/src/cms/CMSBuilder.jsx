// src/components/cms/CMSBuilder.jsx
import React, { useState, useEffect } from "react";
import useCMSDraft from "./useCMSDraft";
import { CMS_LEVELS } from "./cmsConfig";
import { api } from "../services/api";

function CMSBuilder({ level, subjects = [] }) {
  const config = CMS_LEVELS[level];

  const {
    drafts,
    addDraft,
    updateDraft,
    updateYoutube,
    addYoutube,
    removeDraft,
    setDrafts,
  } = useCMSDraft();

  const [subjectId, setSubjectId] = useState("");
  const [parentId, setParentId] = useState("");
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [setExplanation, setSubtopicExplantionImages] = useState([])
  const [pdfFile, setPdfFile] = useState(null);

 const onSubtopicExplanationImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSubtopicExplantionImages((prev) => [...prev, ...files]);
  };

  const onPdfChange = (e) => {
    setPdfFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
  };

  // =============================
  // AUTO SELECT FIRST SUBJECT
  // =============================
  useEffect(() => {
    if (subjects?.length > 0 && !subjectId) {
      setSubjectId(String(subjects[0].id));
    }
  }, [subjects, subjectId]);

  // =============================
  // LOAD TOPICS WHEN SUBJECT CHANGES
  // =============================
  useEffect(() => {
    let cancelled = false;

    if (!subjectId || level !== "subtopic") {
      setTopics([]);
      return;
    }

    const fetchTopics = async () => {
      try {
        const data = await api.getTopics(subjectId);
        if (cancelled) return;
        setTopics(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading topics:", err?.message ?? err);
      }
    };

    fetchTopics();

    return () => {
      cancelled = true;
    };
  }, [subjectId, level]);

  // =============================
  // SAVE DRAFT
  // =============================
  const saveDraft = async (draft) => {
    if (!draft?.name?.trim()) return;

    if (level === "topic" && !subjectId) {
      alert("Select subject first");
      return;
    }

    if (level === "subtopic" && (!subjectId || !parentId)) {
      alert("Select subject and topic");
      return;
    }

    try {
      setLoading(true);

      if (level === "topic") {
        await api.createTopic({
          subject_id: Number(subjectId),
          name: draft.name.trim(),
          priority: draft.priority,
          text: draft.text || null,
        });

        // Refresh topic list
        const refreshed = await api.getTopics(subjectId);
        setTopics(Array.isArray(refreshed) ? refreshed : []);
      }

      if (level === "subtopic") {
        await api.createSubtopic({
          topic_id: Number(parentId),
          name: draft.name.trim(),
          priority: draft.priority,
          text: draft.text || null,
        });
      }

      removeDraft(draft.id);
      alert(`${config.label} created successfully`);
    } catch (err) {
      alert(err?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Add {config.label}</h3>

      <div className="select-section">
        {level !== "subject" && (
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setParentId("");
              setDrafts([]);
            }}
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {level === "subtopic" && (
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">Select Topic</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        <button type="button" onClick={addDraft}>
          + Add {config.label}
        </button>
      </div>

      {drafts.map((draft) => (
        <div key={draft.id} className="cms-draft">
          <div className="line">
            <select
              value={draft.priority}
              onChange={(e) =>
                updateDraft(draft.id, "priority", e.target.value)
              }
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <input
              placeholder={`${config.label} Name`}
              value={draft.name}
              onChange={(e) =>
                updateDraft(draft.id, "name", e.target.value)
              }
            />
          </div>
            {/* Subtopic explanation IMAGES */}
      <div> <label>Explanation Upload Images</label> <input type="file" multiple accept="image/*" onChange={onSubtopicExplanationImagesChange}/></div>
      
      {/* PDF */}
      <div> <label>Upload Pdf</label> 
      <input type="file" accept="application/pdf" onChange={onPdfChange} />
          <textarea placeholder="Write explanation here..." value={draft.text || ""} onChange={(e) => updateDraft(draft.id, "text", e.target.value)}/>
      </div>

          {(draft.youtube || []).map((yt, i) => (
            <input
              key={i}
              placeholder="YouTube Link"
              value={yt}
              onChange={(e) =>
                updateYoutube(draft.id, i, e.target.value)
              }
            />
          ))}

          <div>
          <button type="button" onClick={() => addYoutube(draft.id)}>
            + Add YouTube
          </button>
          </div>
          <div>
          <button
            type="button"
            disabled={loading}
            onClick={() => saveDraft(draft)}
          >
            {loading ? "Saving..." : `Save ${config.label}`}
          </button>
        </div>
        </div>
      ))}
    </div>
  );
}

export default CMSBuilder;