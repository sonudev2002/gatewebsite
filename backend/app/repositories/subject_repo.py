from app.db import get_connection


class SubjectRepository:

    @staticmethod
    def create(subject_name, description=None):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            query = "INSERT INTO subject (subject_name, description) VALUES (%s, %s)"
            cursor.execute(query, (subject_name, description))
            conn.commit()

            return cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_all(limit=20, offset=0):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            query = """
                SELECT * FROM subject
                ORDER BY SId DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (limit, offset))
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_by_id(subject_id):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            cursor.execute("SELECT * FROM subject WHERE SId = %s", (subject_id,))
            return cursor.fetchone()
        finally:
            cursor.close()
            conn.close()
