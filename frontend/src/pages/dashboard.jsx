// src/components/dashboard/Dashboard.jsx
import React, { useRef, useState, useEffect, useMemo } from "react";
import "../styles/dashboard.css";
import CanvasEngine from "../dashboard/CanvasEngine.jsx";
import AddNewContent from "../cms/AddNewContent";
import PracticePanel from "../practice/PracticePanel";
import TopicPanel from "../topic/TopicPanel";
import AddSubjectForm from "../cms/AddSubjectForm";

function Dashboard() {
  // safe initial sizes (avoid SSR issues)
  const safeWindow = typeof window !== "undefined";
  const [middleWidth, setMiddleWidth] = useState(() =>
    safeWindow ? Math.floor(window.innerWidth * 0.6) : 800
  );
  const [rightWidth, setRightWidth] = useState(() =>
    safeWindow ? Math.floor(window.innerWidth * 0.4) : 400
  );
  const [topHeight, setTopHeight] = useState(() =>
    safeWindow ? Math.floor(window.innerHeight * 0.65) : 400
  );

  const isResizingRef = useRef(null);

  // Subjects state (single source for this dashboard instance)
  const [subjects, setSubjects] = useState([]);
  const [mode, setMode] = useState("default");
  const [currentVideo, setCurrentVideo] = useState("CKGvP5qDXKs");

  // Panels mapping: pass props where needed
  const panels = {
    default: <DefaultPanel />,
    practice: <PracticePanel onVideoSelect={setCurrentVideo} subjects={subjects} />,
    topic: <TopicPanel subjects={subjects} setSubjects={setSubjects} />,
    subjectAdd: <AddSubjectForm subjects={subjects} setSubjects={setSubjects} />,
    add: <AddNewContent subjects={subjects} setSubjects={setSubjects} />,
  };

  // Pointer move/up handlers to implement resizing behaviour
  useEffect(() => {
    function handlePointerMove(e) {
      if (!isResizingRef.current) return;

      if (isResizingRef.current === "vertical") {
        // resize middle/right width using clientX
        const total = safeWindow ? window.innerWidth : 1200;
        // clamp new values to reasonable minimums
        const minMiddle = 300;
        const minRight = 250;
        let newMiddle = Math.max(minMiddle, Math.min(total - minRight - 8, e.clientX));
        let newRight = Math.max(minRight, total - newMiddle - 8);
        setMiddleWidth(newMiddle);
        setRightWidth(newRight);
      }

      if (isResizingRef.current === "horizontal") {
        // resize top/bottom height using clientY
        const minTop = 120;
        const maxTop = safeWindow ? window.innerHeight - 120 : 800;
        let newTop = Math.max(minTop, Math.min(maxTop, e.clientY));
        setTopHeight(newTop);
      }
    }

    function handlePointerUp() {
      isResizingRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [safeWindow]);

  return (
    <div className="dashboard-container">
      {/* MIDDLE PANEL */}
      <div className="middle-panel" style={{ width: middleWidth }}>
        <div className="select-mode-panel">
          <span>Select Mode</span>

          {["default", "practice", "topic", "subjectAdd", "add"].map((m) => (
            <button key={m} className={mode === m ? "active" : ""} onClick={() => setMode(m)}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="middle-content">{panels[mode]}</div>
      </div>

      {/* RESIZER (vertical splitter between middle and right) */}
      <div
        className="resizer-horizontal"
        onPointerDown={() => (isResizingRef.current = "vertical")}
        style={{ cursor: "col-resize" }}
      />

      {/* RIGHT PANEL */}
      <div className="right-panel" style={{ width: rightWidth }}>
        <div className="top-section" style={{ height: topHeight }}>
          <CanvasEngine />
        </div>

        <div
          className="resizer-vertical"
          onPointerDown={() => (isResizingRef.current = "horizontal")}
          style={{ cursor: "row-resize" }}
        />

        <div className="bottom-section">
          {currentVideo ? (
            <iframe
              src={`https://www.youtube.com/embed/${currentVideo}?rel=0&modestbranding=1`}
              title="Practice Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          ) : (
            <p style={{ padding: 12 }}>No video selected</p>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================
// PANEL COMPONENTS
// =========================

function DefaultPanel() {
  const [mode, setMode] = useState("default");
  const [priority, setPriority] = useState("");
  const [subject, setSubject] = useState("");
  const [data, setData] = useState([]);

  const filteredData = useMemo(() => {
    let result =
      mode === "default"
        ? data
        : data.filter(
            (d) =>
              (!priority || d.priority === Number(priority)) &&
              (!subject || d.subject === subject)
          );

    return [...result].sort((a, b) => {
      // keep behavior similar to original but safe if priority is string
      const pa = Number.isFinite(a.priority) ? a.priority : 0;
      const pb = Number.isFinite(b.priority) ? b.priority : 0;

      if (a.type === b.type) return pa - pb;
      return a.type === "text" ? -1 : 1;
    });
  }, [mode, priority, subject, data]);

  const updateItem = (id, field, value) => {
    setData((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const deleteItem = (id) => {
    setData((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="default-panel">
      <div className="controls">
        <select onChange={(e) => setMode(e.target.value)}>
          <option value="default">Default</option>
          <option value="custom">Custom</option>
        </select>

        {mode === "custom" && (
          <>
            <input placeholder="Priority" onChange={(e) => setPriority(e.target.value)} />
            <input placeholder="Subject" onChange={(e) => setSubject(e.target.value)} />
          </>
        )}
      </div>

      <div className="default-scroll">
        {filteredData.map((item) => (
          <div key={item.id} className="content-card" style={{ padding: "10px" }}>
            <input value={item.topic || ""} onChange={(e) => updateItem(item.id, "topic", e.target.value)} />

            <input
              type="number"
              value={item.priority || 0}
              onChange={(e) => updateItem(item.id, "priority", +e.target.value)}
            />

            {item.type === "text" ? (
              <textarea value={item.content || ""} onChange={(e) => updateItem(item.id, "content", e.target.value)} />
            ) : (
              <div>
                {(item.content || []).map((img, i) => (
                  <img key={i} src={img} alt={`img-${i}`} width="120" />
                ))}
              </div>
            )}

            <button onClick={() => deleteItem(item.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;