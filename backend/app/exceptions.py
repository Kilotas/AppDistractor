class NotFoundError(Exception):
    def __init__(self, entity: str, id: int) -> None:
        super().__init__(f"{entity} with id={id} not found")
        self.entity = entity
        self.id = id


class ConflictError(Exception):
    """Нарушение бизнес-правила (например, уже есть активная сессия)."""
