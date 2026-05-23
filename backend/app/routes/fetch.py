# fetch.py
import logging
from typing import List, Optional, Any, Dict
import json
from app.db import get_connection


logger = logging.getLogger(__name__)


def _dict_fetch_all(cursor) -> List[Dict[str, Any]]:
    """
    Helper: cursor already set with dictionary=True; return fetchall result.
    """
    return cursor.fetchall() or []


def getsubject() -> List[Dict[str, Any]]:
    """
    Return list of subjects normalized as: [{ "id": <SId>, "name": "<subject_name>" }, ...]
    """
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT SId AS id, subject_name AS name FROM subject")
        return _dict_fetch_all(cursor)
    except Exception as e:
        logger.exception("getsubject error: %s", e)
        return []
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass


def gettopics(subject_id: int) -> List[Dict[str, Any]]:
    """
    Return topics for a given subject_id as: [{ "id": <TId>, "name": "<topic_name>" }, ...]
    """
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT TId AS id, topic_name AS name FROM topic WHERE subject_id = %s",
            (subject_id,),
        )
        return _dict_fetch_all(cursor)
    except Exception as e:
        logger.exception("gettopics error (subject_id=%s): %s", subject_id, e)
        return []
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass


def getsubtopics(topic_id: int) -> List[Dict[str, Any]]:
    """
    Return subtopics for a given topic_id as: [{ "id": <StId>, "name": "<subtopic_name>" }, ...]
    """
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT StId AS id, subtopic_name AS name FROM subtopic WHERE topic_id = %s",
            (topic_id,),
        )
        return _dict_fetch_all(cursor)
    except Exception as e:
        logger.exception("getsubtopics error (topic_id=%s): %s", topic_id, e)
        return []
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass


def getmicrotopics(subtopic_id: int) -> List[Dict[str, Any]]:
    """
    Return microtopics for a given subtopic_id as: [{ "id": <MtId>, "name": "<microtopic_name>" }, ...]
    """
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT MtId AS id, microtopic_name AS name FROM microtopic WHERE subtopic_id = %s",
            (subtopic_id,),
        )
        return _dict_fetch_all(cursor)
    except Exception as e:
        logger.exception("getmicrotopics error (subtopic_id=%s): %s", subtopic_id, e)
        return []
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass


import json
from typing import Optional, List, Dict, Any
from app.db import get_connection


def get_practice(
    subject_id: Optional[int] = None,
    topic_id: Optional[int] = None,
    subtopic_id: Optional[int] = None,
    priority: Optional[str] = None,
    sort: str = "oldest",
    page: int = 1,
    limit: int = 10,
) -> List[Dict[str, Any]]:

    conn = None
    cursor = None

    try:
        page = max(int(page), 1)
        limit = max(int(limit), 1)
        offset = (page - 1) * limit

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # =========================
        # STEP 1: Get paginated question_ids
        # =========================
        base_query = """
        SELECT qb.question_id
        FROM practice_item pi
        LEFT JOIN question_bank qb ON pi.question_id = qb.question_id
        WHERE 1=1
        """

        params = []

        if subject_id:
            base_query += " AND qb.subject_id = %s"
            params.append(subject_id)
        print(f"subject id-->{subject_id}")

        if topic_id:
            base_query += " AND qb.topic_id = %s"
            params.append(topic_id)
        print(f"subject id-->{topic_id}")

        if subtopic_id:
            base_query += " AND qb.subtopic_id = %s"
            params.append(subtopic_id)
        print(f"subject id-->{subject_id}")
        if priority:
            base_query += " AND qb.difficulty = %s"
            params.append(priority)
        print(priority)

        order_direction = "DESC" if sort == "newest" else "ASC"
        base_query += f" ORDER BY qb.created_at {order_direction} LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(base_query, tuple(params))
        id_rows = cursor.fetchall()

        question_ids = [row["question_id"] for row in id_rows]

        if not question_ids:
            return []
        print("inside the get practice function")
        # =========================
        # STEP 2: Fetch full question + media
        # =========================
        format_strings = ",".join(["%s"] * len(question_ids))

        full_query = f"""
        SELECT
            qb.question_id,
            qb.subject_id,
            qb.topic_id,
            qb.subtopic_id,
            qb.type,
            qb.question_text,
            qb.answer_text,
            qb.difficulty,
            qb.youtube_links,
            qb.created_at,
            qm.purpose,
            m.url
        FROM question_bank qb
        LEFT JOIN question_media qm ON qb.question_id = qm.question_id
        LEFT JOIN media m ON qm.media_id = m.media_id
        WHERE qb.question_id IN ({format_strings})
        """

        cursor.execute(full_query, tuple(question_ids))
        rows = cursor.fetchall()

        # =========================
        # GROUPING
        # =========================
        questions = {}

        for row in rows:
            qid = row["question_id"]

            if qid not in questions:
                questions[qid] = {
                    "id": qid,
                    "subject_id": row["subject_id"],
                    "topic_id": row["topic_id"],
                    "subtopic_id": row["subtopic_id"],
                    "type": row["type"],
                    "question": row["question_text"],
                    "answer": row["answer_text"],
                    "difficulty": row["difficulty"],
                    "youtube": json.loads(row["youtube_links"] or "[]"),
                    "images": [],
                    "answer_images": [],
                    "pdf": None,
                    "created_at": row["created_at"],
                }

            if not row["url"]:
                continue

            purpose = row["purpose"]

            if purpose in ("question-image", "diagram"):
                questions[qid]["images"].append(row["url"])

            elif purpose in ("answer-image", "solution-image"):
                questions[qid]["answer_images"].append(row["url"])

            elif purpose == "pdf":
                questions[qid]["pdf"] = row["url"]

        return list(questions.values())

    except Exception as e:
        print("get_practice error:", e)
        return []

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
