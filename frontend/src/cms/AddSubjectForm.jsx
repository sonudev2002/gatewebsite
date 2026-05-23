// src/components/cms/AddSubjectForm.jsx
import React, { useState } from "react";
import { api } from "../services/api.js";

function AddSubjectForm({ subjects = [], setSubjects }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const save = async () => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;

    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      // call service layer
      const created = await api.createSubject({ name: trimmed });

      // api.createSubject returns the payload (e.g. { id, name }) per api.js
      const newSubject = {
        id: created?.id ?? created?.ID ?? created,
        name: created?.name ?? trimmed,
        topics: [],
      };

      // safely update
      setSubjects((prev) => (Array.isArray(prev) ? [...prev, newSubject] : [newSubject]));

      setMessage("Subject created successfully");
      setName("");
    } catch (err) {
      console.error("Add subject failed:", err);
      setError(err?.message || "Failed to create subject");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Add Subject</h3>

      <input
        placeholder="Subject Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
      />

      <button type="button" onClick={save} disabled={loading || !name.trim()}>
        {loading ? "Saving..." : "Save Subject"}
      </button>

      {/* SUCCESS MESSAGE */}
      {message && (
        <p style={{ color: "green", marginTop: 10 }}>
          {message}
        </p>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <p style={{ color: "red", marginTop: 10 }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default AddSubjectForm;