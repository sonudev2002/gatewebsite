def success(data=None, message="Success"):
    return {"status": "success", "message": message, "data": data}


def error(message="Error"):
    return {"status": "error", "message": message}
