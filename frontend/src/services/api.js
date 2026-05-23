// src/services/api.js
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";


async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  const fetchOptions = {
    method: options.method || "GET",
    credentials: options.credentials ?? "include",
    headers: isFormData
      ? {} // let browser set multipart boundary
      : { "Content-Type": "application/json" },
    ...options,
  };

  const res = await fetch(url, fetchOptions);

  // Try to parse body safely
  const contentType = res.headers.get("content-type") || "";

  // 204 No Content
  if (res.status === 204) {
    if (!res.ok) throw new Error("No content");
    return null;
  }

  let parsed;
  try {
    if (contentType.includes("application/json")) {
      parsed = await res.json();
    } else {
      // fallback to text for non-json responses
      parsed = await res.text();
    }
  } catch (err) {
    // couldn't parse body
    parsed = null;
  }

  if (!res.ok) {
    // try to provide a helpful error message
    const msg =
      (parsed && (parsed.detail || parsed.message || parsed.error)) ||
      res.statusText ||
      "Server Error";
    throw new Error(msg);
  }

  // If server wraps payload as { status, data, message } return data otherwise return parsed
  if (parsed && typeof parsed === "object") {
    return parsed.data ?? parsed;
  }

  return parsed;
}

export const api = {
  // ---------- Subjects ----------
  async getSubjects() {
    // returns array of { id, name } (see backend/fetch.py)
    return await request("/subjects");
  },

  async createSubject(payload) {
    // payload: { name }
    return await request("/subjects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateSubject(subjectId, payload) {
    return await request(`/subjects/${subjectId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteSubject(subjectId) {
    return await request(`/subjects/${subjectId}`, {
      method: "DELETE",
    });
  },

  // ---------- Topics ----------
  async getTopics(subjectId) {
    // frontend uses /subjects/:id/topics
    return await request(`/subjects/${subjectId}/topics`);
  },

  async createTopic(payload) {
    // payload: { subject_id, name, priority, text }
    return await request("/topics", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateTopic(topicId, payload) {
    return await request(`/topics/${topicId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteTopic(topicId) {
    return await request(`/topics/${topicId}`, {
      method: "DELETE",
    });
  },

  // ---------- Subtopics ----------
  async getSubtopics(topicId) {
    // frontend expects /subtopics/:topicId (and backend exposes both)
    return await request(`/subtopics/${topicId}`);
  },

  async createSubtopic(payload) {
    // payload: { topic_id, name, priority, text }
    return await request("/subtopics", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateSubtopic(subtopicId, payload) {
    return await request(`/subtopics/${subtopicId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteSubtopic(subtopicId) {
    return await request(`/subtopics/${subtopicId}`, {
      method: "DELETE",
    });
  },

  // ---------- Microtopics ----------
  async getMicrotopics(subtopicId) {
    // returns [{ id, name }, ...]
    return await request(`/subtopics/${subtopicId}/microtopics`);
  },

  // ---------- Practice ----------
  async getPractice(params = {}) {
    // params: { subject_id, topic_id, subtopic_id, priority, sort, page, limit }
    const query = new URLSearchParams(params).toString();
    return await request(`/practice?${query}`);
  },

  async createPractice(payload) {
    // payload: PracticeCreate object
    return await request("/practice", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updatePractice(practiceId, payload) {
    return await request(`/practice/${practiceId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deletePractice(practiceId) {
    return await request(`/practice/${practiceId}`, {
      method: "DELETE",
    });
  },

  async updatePracticePriority(practiceId, priority) {
    const form = new FormData();
    form.append("priority", priority);
    return await request(`/practice/${practiceId}/priority`, {
      method: "PATCH",
      body: form, // FormData -> request() will handle headers correctly
    });
  },

  // ---------- Questions (multipart) ----------
  /**
   * formData must be an actual FormData instance with keys:
   * subject_id, topic_id, subtopic_id (optional), microtopic_id (optional),
   * type, question_text, answer_text, difficulty,
   * youtube_links (can be appended multiple times),
   * question_images (append File objects multiple times),
   * answer_images (append File objects multiple times),
   * pdf_file (File)
   */
  async createQuestion(formData) {
    // formData: FormData
    return await request("/create_questions", {
      method: "POST",
      body: formData, // do NOT set Content-Type
    });
  },

  async getQuestions(params = {}) {
    // optional filters: subject_id, topic_id, subtopic_id, difficulty, page, limit
    const query = new URLSearchParams(params).toString();
    return await request(`/questions?${query}`);
  },
};