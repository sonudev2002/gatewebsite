import os
import uuid

BASE_STATIC_PATH = "app/static"


def save_file(file, folder):
    folder_path = os.path.join(BASE_STATIC_PATH, folder)

    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

    file_ext = file.filename.split(".")[-1]
    unique_name = f"{uuid.uuid4()}.{file_ext}"

    file_path = os.path.join(folder_path, unique_name)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    return f"/static/{folder}/{unique_name}"
