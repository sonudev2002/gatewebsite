# main.py (patched)
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
from pydantic import BaseModel

from app.utils.response import success, error
from app.db import get_connection

# service functions (existing)
from app.routes.fetch import (
    getsubject,
    gettopics,
    getsubtopics,
    getmicrotopics,
    get_practice,
)
from app.routes.insert import (
    insert_subject,
    insert_topic,
    insert_subtopic,
    insert_question,
)
from app.routes.update import (
    update_subject,
    update_topic,
    update_subtopic,
    update_practice,
)
from app.routes.delete import (
    delete_subject,
    delete_topic,
    delete_subtopic,
    delete_practice,
)

app = FastAPI()
app.mount("/static", StaticFiles(directory="app/static/"), name="static")

# CORS - expand origin list if frontend hosted elsewhere
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# MODELS
# -------------------------
class SubjectCreate(BaseModel):
    name: str


class TopicCreate(BaseModel):
    subject_id: int
    name: str
    priority: Optional[str] = "Medium"
    text: Optional[str] = None


class SubtopicCreate(BaseModel):
    topic_id: int
    name: str
    priority: Optional[str] = "Medium"
    text: Optional[str] = None


class PracticeCreate(BaseModel):
    subject_id: int
    topic_id: Optional[int] = None
    subtopic_id: Optional[int] = None
    question: str
    answer: Optional[str] = None
    priority: Optional[str] = "Medium"


# -------------------------
# ROOT
# -------------------------
@app.get("/")
def root():
    return {"message": "Backend Running 🚀"}


# -------------------------
# SUBJECTS
# -------------------------
@app.get("/subjects")
def get_subjects():
    try:
        print("inside subject in main.py")
        rows = (
            getsubject()
        )  # existing service returns list of dicts with SId, subject_name
        # Normalize to {id, name}
        normalized = [
            {
                "id": r.get("SId") or r.get("id"),
                "name": r.get("subject_name") or r.get("name"),
            }
            for r in rows
        ]
        return success(data=normalized)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/subjects")
def create_subject(data: SubjectCreate):
    try:
        print("inside subject in main.py")
        subject_id = insert_subject(data.name)
        return success(
            data={"id": subject_id, "name": data.name},
            message="Subject created successfully",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/subjects/{subject_id}")
def update_subject_route(subject_id: int, data: SubjectCreate):
    # TODO: call update_subject(subject_id, data.name)
    return success(data=None, message="Subject updated (stub)")


@app.delete("/subjects/{subject_id}")
def delete_subject_route(subject_id: int):
    # TODO: call delete_subject(subject_id)
    return success(data=None, message="Subject deleted (stub)")


# -------------------------
# TOPICS
# -------------------------
@app.get("/subjects/{subject_id}/topics")
def get_topics_route(subject_id: int):
    try:
        data = gettopics(subject_id)
        # normalize if needed (gettopics already aliases to id/name in fetch.py; keep safe)
        normalized = [{"id": r.get("id"), "name": r.get("name")} for r in data]
        return success(data=normalized)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/topics")
def create_topic(data: TopicCreate):
    try:
        topic_id = insert_topic(
            subject_id=data.subject_id,
            topic_name=data.name,
            summary=data.text,
            priority=data.priority,
        )
        return success(
            data={"id": topic_id, "name": data.name},
            message="Topic created successfully",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/topics/{topic_id}")
def update_topic_route(topic_id: int, data: TopicCreate):
    # TODO: update_topic(...)
    return success(data=None, message="Topic updated (stub)")


@app.delete("/topics/{topic_id}")
def delete_topic_route(topic_id: int):
    # TODO: delete_topic(topic_id)
    return success(data=None, message="Topic deleted (stub)")


# -------------------------
# SUBTOPICS
# -------------------------
# Keep the existing route but also add a shorthand that frontend expects.
@app.get("/topics/{topic_id}/subtopics")
def get_subtopics_route(topic_id: int):
    try:
        data = getsubtopics(topic_id)
        normalized = [{"id": r.get("id"), "name": r.get("name")} for r in data]
        return success(data=normalized)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Route matching frontend api.getSubtopics(topicId) -> /subtopics/{topicId}
@app.get("/subtopics/{topic_id}")
def get_subtopics_short(topic_id: int):
    return get_subtopics_route(topic_id)


@app.post("/subtopics")
def create_subtopic(data: SubtopicCreate):
    try:
        subtopic_id = insert_subtopic(
            topic_id=data.topic_id,
            subtopic_name=data.name,
            summary=data.text,
            priority=data.priority,
        )
        return success(
            data={"id": subtopic_id, "name": data.name},
            message="Subtopic created successfully",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/subtopics/{subtopic_id}")
def update_subtopic_route(subtopic_id: int, data: SubtopicCreate):
    # TODO: update_subtopic(...)
    return success(data=None, message="Subtopic updated (stub)")


@app.delete("/subtopics/{subtopic_id}")
def delete_subtopic_route(subtopic_id: int):
    # TODO: delete_subtopic(subtopic_id)
    return success(data=None, message="Subtopic deleted (stub)")


# -------------------------
# MICROTPCS (expose existing service)
# -------------------------
@app.get("/subtopics/{subtopic_id}/microtopics")
def get_microtopics_route(subtopic_id: int):
    try:
        data = getmicrotopics(subtopic_id)
        normalized = [{"id": r.get("id"), "name": r.get("name")} for r in data]
        return success(data=normalized)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------
# PRACTICE
# -------------------------
@app.get("/practice")
def practice(
    subject_id: Optional[int] = None,
    topic_id: Optional[int] = None,
    subtopic_id: Optional[int] = None,
    priority: Optional[str] = None,
    sort: str = "oldest",
    page: int = 1,
    limit: int = 10,
):
    try:
        data = get_practice(
            subject_id, topic_id, subtopic_id, priority, sort, page, limit
        )
        return success(data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/practice")
def create_practice(data: PracticeCreate):
    # TODO: insert_practice(...)
    return success(data=None, message="Practice created (stub)")


@app.put("/practice/{practice_id}")
def update_practice_route(practice_id: int, data: PracticeCreate):
    # TODO: update_practice(...)
    return success(data=None, message="Practice updated (stub)")


@app.delete("/practice/{practice_id}")
def delete_practice_route(practice_id: int):
    # TODO: delete_practice(practice_id)
    return success(data=None, message="Practice deleted (stub)")


@app.patch("/practice/{practice_id}/priority")
def update_practice_priority(practice_id: int, priority: str = Form(...)):
    # TODO: update only priority
    return success(data=None, message="Priority updated (stub)")


# -------------------------
# QUESTIONS (create + fetch)
# -------------------------
@app.get("/questions")
def get_questions(
    subject_id: Optional[int] = None,
    topic_id: Optional[int] = None,
    subtopic_id: Optional[int] = None,
    difficulty: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
):
    """
    Basic fetch of question_bank with optional filters.
    NOTE: This is a minimal fetch used by frontend listing. Expand as needed.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = "SELECT QId AS id, subject_id, topic_id, subtopic_id, microtopic_id, type, question_text, answer_text, difficulty, youtube_links, created_at FROM question_bank WHERE 1=1"
        params = []

        if subject_id:
            query += " AND subject_id = %s"
            params.append(subject_id)
        if topic_id:
            query += " AND topic_id = %s"
            params.append(topic_id)
        if subtopic_id:
            query += " AND subtopic_id = %s"
            params.append(subtopic_id)
        if difficulty:
            query += " AND difficulty = %s"
            params.append(difficulty)

        offset = (page - 1) * limit
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        return success(data=rows)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/create_questions")
async def create_question(
    subject_id: int = Form(...),
    topic_id: int = Form(...),
    subtopic_id: Optional[int] = Form(None),
    microtopic_id: Optional[int] = Form(None),
    type: str = Form("common"),
    question_text: str = Form(...),
    answer_text: Optional[str] = Form(None),
    difficulty: str = Form("Medium"),
    youtube_links: Optional[List[str]] = Form(None),
    question_images: Optional[List[UploadFile]] = File(None),
    answer_images: Optional[List[UploadFile]] = File(None),
    pdf_file: Optional[UploadFile] = File(None),
):
    try:
        # 1) Prepare data dict
        data = {
            "subject_id": subject_id,
            "topic_id": topic_id,
            "subtopic_id": subtopic_id,
            "microtopic_id": microtopic_id,
            "type": type,
            "question_text": question_text,
            "answer_text": answer_text,
            "difficulty": difficulty,
            "youtube_links": youtube_links or [],
        }

        # 2) Delegate to service layer
        question_id = insert_question(
            data=data,
            question_images=question_images,
            answer_images=answer_images,
            pdf_file=pdf_file,
        )

        if not question_id:
            raise HTTPException(status_code=500, detail="Failed to create question")

        return success(
            data={"question_id": question_id}, message="Question created successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
