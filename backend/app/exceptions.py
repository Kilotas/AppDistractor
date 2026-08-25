class AppError(Exception):
    status_code: int = 500

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class NotFoundError(AppError):
    status_code = 404

    def __init__(self, entity: str, id: int) -> None:
        super().__init__(f"{entity} with id={id} not found")


class ConflictError(AppError):
    status_code = 409


class AuthError(AppError):
    status_code = 401


class ForbiddenError(AppError):
    status_code = 403


class PaymentRequiredError(AppError):
    status_code = 402
