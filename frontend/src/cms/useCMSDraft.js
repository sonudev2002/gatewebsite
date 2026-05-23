// src/components/cms/useCMSDraft.js
import { useState } from "react";

function generateId() {
  // safer unique id
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default function useCMSDraft() {
  const [drafts, setDrafts] = useState([]);

  const addDraft = () => {
    setDrafts((prev) => [
      ...prev,
      {
        id: generateId(),
        name: "",
        priority: "Medium",
        text: "",
        images: [],
        pdf: null,
        youtube: [""],
        children: [],
      },
    ]);
  };

  const updateDraft = (id, field, value) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              [field]: value,
            }
          : d
      )
    );
  };

  const updateYoutube = (id, index, value) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;

        const youtube = Array.isArray(d.youtube) ? [...d.youtube] : [];
        youtube[index] = value;

        return {
          ...d,
          youtube,
        };
      })
    );
  };

  const addYoutube = (id) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              youtube: Array.isArray(d.youtube)
                ? [...d.youtube, ""]
                : [""],
            }
          : d
      )
    );
  };

  const removeDraft = (id) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  return {
    drafts,
    addDraft,
    updateDraft,
    updateYoutube,
    addYoutube,
    removeDraft,
    setDrafts,
  };
}