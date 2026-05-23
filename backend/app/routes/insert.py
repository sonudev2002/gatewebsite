import json
import logging
from mysql.connector import Error
from app.db import get_connection
from app.utils.executequery import execute_query
from app.utils.savefile import save_file

logger = logging.getLogger(__name__)


# ==========================
# Generic helpers
# ==========================
def _exists(table: str, id_column: str, value) -> bool:
    """
    Check existence of a row. Returns True if exists.
    """
    q = f"SELECT 1 FROM {table} WHERE {id_column} = %s LIMIT 1"
    res = execute_query(q, (value,), fetch=True)
    return bool(res)


def get_or_create(table, unique_column, value, insert_query, insert_params):
    """
    Generic function:
    - Checks if record exists
    - If exists → return ID
    - Else → insert and return new ID
    """
    id_column_map = {
        "subject": "SId",
        "topic": "TId",
        "subtopic": "StId",
        "microtopic": "MtId",
    }

    id_column = id_column_map.get(table)
    if not id_column:
        raise ValueError(f"Unknown table for get_or_create: {table}")

    # Check existing
    select_query = f"SELECT {id_column} FROM {table} WHERE {unique_column} = %s LIMIT 1"
    existing = execute_query(select_query, (value,), fetch=True)

    if existing:
        # existing is list of dicts when fetch=True
        first = existing[0]
        # existing row may use either column name or lowercase; handle both
        return first.get(id_column) or first.get(id_column.lower())

    # Insert new and return lastrowid (execute_query expected to return lastrowid)
    return execute_query(insert_query, insert_params)


# ==========================
# SUBJECT / TOPIC / SUBTOPIC helpers
# ==========================
def insert_subject(subject_name, description=None):
    insert_query = """
        INSERT INTO subject (subject_name, description)
        VALUES (%s, %s)
    """
    return get_or_create(
        table="subject",
        unique_column="subject_name",
        value=subject_name,
        insert_query=insert_query,
        insert_params=(subject_name, description),
    )


def insert_topic(
    subject_id, topic_name, summary=None, priority="Medium", next_revision=None
):
    # UNIQUE inside subject
    select_query = """
        SELECT TId FROM topic
        WHERE subject_id = %s AND topic_name = %s
        LIMIT 1
    """
    existing = execute_query(select_query, (subject_id, topic_name), fetch=True)

    if existing:
        return (
            existing[0].get("TId") or existing[0].get("Tid") or existing[0].get("tid")
        )

    insert_query = """
        INSERT INTO topic
        (subject_id, topic_name, summary, priority, next_revision)
        VALUES (%s, %s, %s, %s, %s)
    """
    return execute_query(
        insert_query, (subject_id, topic_name, summary, priority, next_revision)
    )


def insert_subtopic(topic_id, subtopic_name, summary=None, priority="Medium"):
    select_query = """
        SELECT StId FROM subtopic
        WHERE topic_id = %s AND subtopic_name = %s
        LIMIT 1
    """
    existing = execute_query(select_query, (topic_id, subtopic_name), fetch=True)

    if existing:
        return (
            existing[0].get("StId")
            or existing[0].get("Stid")
            or existing[0].get("stid")
        )

    insert_query = """
        INSERT INTO subtopic
        (topic_id, subtopic_name, summary, priority)
        VALUES (%s, %s, %s, %s)
    """
    return execute_query(insert_query, (topic_id, subtopic_name, summary, priority))


# ==========================
# QUESTION INSERT (hardened)
# ==========================
def insert_question(data, question_images=None, answer_images=None, pdf_file=None):
    """
    Insert a question with optional media and pdf.
    - data: dict expected to contain subject_id, topic_id, subtopic_id, microtopic_id, type, question_text, answer_text, difficulty, youtube_links
    - question_images / answer_images: lists of UploadFile (FastAPI)
    - pdf_file: UploadFile
    Returns question_id on success, None on failure.
    """
    conn = None
    cursor = None

    try:
        # Basic required validation
        subject_id = data.get("subject_id")
        topic_id = data.get("topic_id")
        # question_text is mandatory
        question_text = data.get("question_text")

        if not subject_id:
            raise ValueError("subject_id is required")
        if not topic_id:
            raise ValueError("topic_id is required")
        if not question_text or not str(question_text).strip():
            raise ValueError("question_text is required")

        # Validate foreign keys exist in DB (avoid orphan rows)
        if not _exists("subject", "SId", subject_id):
            raise ValueError(f"subject_id {subject_id} does not exist")
        if not _exists("topic", "TId", topic_id):
            raise ValueError(f"topic_id {topic_id} does not exist")

        subtopic_id = data.get("subtopic_id")
        microtopic_id = data.get("microtopic_id")

        if subtopic_id:
            if not _exists("subtopic", "StId", subtopic_id):
                raise ValueError(f"subtopic_id {subtopic_id} does not exist")
        if microtopic_id:
            if not _exists("microtopic", "MtId", microtopic_id):
                raise ValueError(f"microtopic_id {microtopic_id} does not exist")

        conn = get_connection()
        cursor = conn.cursor()

        # ==========================
        # 1️⃣ Insert into question_bank
        # ==========================
        insert_question_query = """
        INSERT INTO question_bank
        (subject_id, topic_id, subtopic_id, microtopic_id,
         type, question_text, answer_text,
         difficulty, youtube_links)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        youtube_json = json.dumps(data.get("youtube_links", []) or [])

        cursor.execute(
            insert_question_query,
            (
                subject_id,
                topic_id,
                subtopic_id or None,
                microtopic_id or None,
                data.get("type", "common"),
                question_text,
                data.get("answer_text"),
                data.get("difficulty", "Medium"),
                youtube_json,
            ),
        )

        question_id = cursor.lastrowid

        # ==========================
        # 2️⃣ Insert Question Images (positioned)
        # ==========================
        if question_images:
            position = 0
            for img in question_images:
                try:
                    # save_file should accept FastAPI UploadFile and return a public URL/path
                    url = save_file(img, "question")

                    cursor.execute(
                        """
                        INSERT INTO media (url, type, storage_provider, name)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (
                            url,
                            getattr(img, "content_type", None) or None,
                            "local",
                            getattr(img, "filename", None),
                        ),
                    )
                    media_id = cursor.lastrowid

                    cursor.execute(
                        """
                        INSERT INTO question_media
                        (question_id, media_id, purpose, position)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (question_id, media_id, "question-image", position),
                    )
                    position += 1
                except Exception as media_err:
                    # log and continue with other images; don't abort entire question insert for one bad image
                    logger.exception("Failed to save question image: %s", media_err)

        # ==========================
        # 3️⃣ Insert Answer Images (positioned)
        # ==========================
        if answer_images:
            position = 0
            for img in answer_images:
                try:
                    url = save_file(img, "answer")

                    cursor.execute(
                        """
                        INSERT INTO media (url, type, storage_provider, name)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (
                            url,
                            getattr(img, "content_type", None) or None,
                            "local",
                            getattr(img, "filename", None),
                        ),
                    )
                    media_id = cursor.lastrowid

                    cursor.execute(
                        """
                        INSERT INTO question_media
                        (question_id, media_id, purpose, position)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (question_id, media_id, "answer-image", position),
                    )
                    position += 1
                except Exception as media_err:
                    logger.exception("Failed to save answer image: %s", media_err)

        # ==========================
        # 4️⃣ Insert PDF (if exists)
        # ==========================
        if pdf_file:
            try:
                url = save_file(pdf_file, "answer")

                cursor.execute(
                    """
                    INSERT INTO media (url, type, storage_provider, name)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        url,
                        getattr(pdf_file, "content_type", None) or None,
                        "local",
                        getattr(pdf_file, "filename", None),
                    ),
                )
                media_id = cursor.lastrowid

                cursor.execute(
                    """
                    INSERT INTO question_media
                    (question_id, media_id, purpose, position)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (question_id, media_id, "pdf", 0),
                )
            except Exception as pdf_err:
                logger.exception("Failed to save PDF file: %s", pdf_err)

        # ==========================
        # 5️⃣ Commit once
        # ==========================
        conn.commit()
        return question_id

    except Error as e:
        logger.exception("Insert Question DB Error: %s", e)
        if conn:
            conn.rollback()
        return None

    except Exception as ex:
        logger.exception("Insert Question Error: %s", ex)
        if conn:
            conn.rollback()
        return None

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
