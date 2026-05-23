# app/db.py
import os
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv

load_dotenv()

dbconfig = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

# Create connection pool (Production Ready)
connection_pool = pooling.MySQLConnectionPool(
    pool_name="gate_planner_pool",
    pool_size=31,  # increase based on traffic
    pool_reset_session=True,
    **dbconfig
)


def get_connection():
    return connection_pool.get_connection()
