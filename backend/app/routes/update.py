from app.db import get_connection
from app.utils.executequery import execute_query, update_query


def update_subject(subject_id, new_name=None, description=None):

    # Check duplicate name (if changing name)
    if new_name:
        check_query = """
            SELECT SId FROM subject
            WHERE subject_name = %s AND SId != %s
            LIMIT 1
        """
        existing = execute_query(check_query, (new_name, subject_id), fetch=True)

        if existing:
            raise ValueError("Subject name already exists")

    update_query_str = """
        UPDATE subject
        SET subject_name = COALESCE(%s, subject_name),
            description = COALESCE(%s, description)
        WHERE SId = %s
    """

    return update_query(update_query_str, (new_name, description, subject_id))


def update_topic(
    topic_id,
    subject_id=None,
    topic_name=None,
    summary=None,
    priority=None,
    next_revision=None,
):

    # Check duplicate inside subject
    if topic_name and subject_id:
        check_query = """
            SELECT TId FROM topic
            WHERE subject_id = %s
            AND topic_name = %s
            AND TId != %s
            LIMIT 1
        """
        existing = execute_query(
            check_query, (subject_id, topic_name, topic_id), fetch=True
        )

        if existing:
            raise ValueError("Topic already exists in this subject")

    update_query_str = """
        UPDATE topic
        SET subject_id = COALESCE(%s, subject_id),
            topic_name = COALESCE(%s, topic_name),
            summary = COALESCE(%s, summary),
            priority = COALESCE(%s, priority),
            next_revision = COALESCE(%s, next_revision)
        WHERE TId = %s
    """

    return update_query(
        update_query_str,
        (subject_id, topic_name, summary, priority, next_revision, topic_id),
    )


def update_subtopic(
    subtopic_id, topic_id=None, subtopic_name=None, summary=None, priority=None
):

    # Check duplicate inside topic
    if subtopic_name and topic_id:
        check_query = """
            SELECT StId FROM subtopic
            WHERE topic_id = %s
            AND subtopic_name = %s
            AND StId != %s
            LIMIT 1
        """
        existing = execute_query(
            check_query, (topic_id, subtopic_name, subtopic_id), fetch=True
        )

        if existing:
            raise ValueError("Subtopic already exists in this topic")

    update_query_str = """
        UPDATE subtopic
        SET topic_id = COALESCE(%s, topic_id),
            subtopic_name = COALESCE(%s, subtopic_name),
            summary = COALESCE(%s, summary),
            priority = COALESCE(%s, priority)
        WHERE StId = %s
    """

    return update_query(
        update_query_str, (topic_id, subtopic_name, summary, priority, subtopic_id)
    )


def update_practice(practice_id, status=None, next_due=None, notes=None):

    update_query_str = """
        UPDATE practice_item
        SET status = COALESCE(%s, status),
            next_due = COALESCE(%s, next_due),
            notes = COALESCE(%s, notes)
        WHERE id = %s
    """

    return update_query(update_query_str, (status, next_due, notes, practice_id))
