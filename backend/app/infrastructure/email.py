from abc import ABC, abstractmethod


class EmailSender(ABC):
    @abstractmethod
    async def send_verification_email(self, to_email: str, token: str) -> None: ...


class ConsoleEmailSender(EmailSender):
    """For development: prints verification link to stdout."""

    async def send_verification_email(self, to_email: str, token: str) -> None:
        verification_url = (
            f"http://localhost:8000/api/v1/auth/verify-email?token={token}"
        )
        print(f"\n[DEV EMAIL] To: {to_email}\nLink: {verification_url}\n")
