from app.repositories.subject_repo import SubjectRepository


class SubjectService:

    @staticmethod
    def create_subject(name, description=None):
        return SubjectRepository.create(name, description)

    @staticmethod
    def list_subjects(page=1, page_size=20):
        offset = (page - 1) * page_size
        return SubjectRepository.get_all(page_size, offset)

    @staticmethod
    def get_subject(subject_id):
        return SubjectRepository.get_by_id(subject_id)
