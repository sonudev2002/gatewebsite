from app.db import get_connection
from mysql.connector import Error


# ==========================
# CORE EXECUTOR
# ==========================
def execute_query(query, params=None, fetch=False):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(query, params or ())

        if fetch:
            result = cursor.fetchall()
        else:
            result = cursor.lastrowid

        conn.commit()
        return result

    except Error as e:
        print("Database Error:", e)
        conn.rollback()
        return None

    finally:
        cursor.close()
        conn.close()


def delete_query(query, params):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(query, params)
        conn.commit()

        return cursor.rowcount  # how many rows deleted

    except Error as e:
        print("Delete Error:", e)
        conn.rollback()
        return 0

    finally:
        cursor.close()
        conn.close()


def update_query(query, params):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(query, params)
        conn.commit()

        return cursor.rowcount  # how many rows updated

    except Error as e:
        print("Update Error:", e)
        conn.rollback()
        return 0

    finally:
        cursor.close()
        conn.close()
