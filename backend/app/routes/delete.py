from app.utils.executequery import execute_query, delete_query


def delete_subject(subject_id):

    # optional existence check
    check = execute_query(
        "SELECT SId FROM subject WHERE SId = %s", (subject_id,), fetch=True
    )

    if not check:
        raise ValueError("Subject not found")

    return delete_query("DELETE FROM subject WHERE SId = %s", (subject_id,))


def delete_topic(topic_id):

    check = execute_query(
        "SELECT TId FROM topic WHERE TId = %s", (topic_id,), fetch=True
    )

    if not check:
        raise ValueError("Topic not found")

    return delete_query("DELETE FROM topic WHERE TId = %s", (topic_id,))


def delete_subtopic(subtopic_id):

    check = execute_query(
        "SELECT StId FROM subtopic WHERE StId = %s", (subtopic_id,), fetch=True
    )

    if not check:
        raise ValueError("Subtopic not found")

    return delete_query("DELETE FROM subtopic WHERE StId = %s", (subtopic_id,))


def delete_practice(practice_id):

    check = execute_query(
        "SELECT id FROM practice_item WHERE id = %s", (practice_id,), fetch=True
    )

    if not check:
        raise ValueError("Practice item not found")

    return delete_query("DELETE FROM practice_item WHERE id = %s", (practice_id,))
