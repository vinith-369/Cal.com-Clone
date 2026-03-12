"""Email notification service using the Observer pattern.

When a booking is created, cancelled, or rescheduled, this service
is notified and sends the appropriate email. In console mode, emails
are logged instead of sent.
"""

import logging
from datetime import datetime

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Observer: reacts to booking lifecycle events and sends notifications."""

    def notify_booking_created(self, booking_data: dict) -> None:
        """Send confirmation email to the booker."""
        subject = f"Booking Confirmed: {booking_data.get('event_title', 'Meeting')}"
        body = (
            f"Hi {booking_data['booker_name']},\n\n"
            f"Your booking has been confirmed!\n\n"
            f"Event: {booking_data.get('event_title', 'Meeting')}\n"
            f"Date & Time: {booking_data['start_time']}\n"
            f"Duration: {booking_data.get('duration', 30)} minutes\n\n"
            f"To reschedule or cancel, visit the booking management page.\n\n"
            f"Thank you!"
        )
        self._send(booking_data["booker_email"], subject, body)

    def notify_booking_cancelled(self, booking_data: dict) -> None:
        """Send cancellation email to the booker."""
        subject = f"Booking Cancelled: {booking_data.get('event_title', 'Meeting')}"
        body = (
            f"Hi {booking_data['booker_name']},\n\n"
            f"Your booking has been cancelled.\n\n"
            f"Event: {booking_data.get('event_title', 'Meeting')}\n"
            f"Original Date & Time: {booking_data['start_time']}\n\n"
            f"You can rebook at any time.\n\n"
            f"Thank you!"
        )
        self._send(booking_data["booker_email"], subject, body)

    def notify_booking_rescheduled(self, booking_data: dict) -> None:
        """Send reschedule confirmation email to the booker."""
        subject = f"Booking Rescheduled: {booking_data.get('event_title', 'Meeting')}"
        body = (
            f"Hi {booking_data['booker_name']},\n\n"
            f"Your booking has been rescheduled.\n\n"
            f"Event: {booking_data.get('event_title', 'Meeting')}\n"
            f"New Date & Time: {booking_data['start_time']}\n"
            f"Duration: {booking_data.get('duration', 30)} minutes\n\n"
            f"Thank you!"
        )
        self._send(booking_data["booker_email"], subject, body)

    def _send(self, to_email: str, subject: str, body: str):
        """Send email via SMTP."""
        logger.info(f"Attempting to send real email to {to_email}: {subject}")
        import smtplib
        from email.message import EmailMessage
        
        msg = EmailMessage()
        msg.set_content(body)
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email
        
        try:
            if not settings.SMTP_HOST:
                logger.warning("SMTP_HOST is not configured. Email will not be sent.")
                return
            # Use context manager for SMTP connection
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            logger.info(f"✅ Successfully sent email to {to_email}")
        except Exception as e:
            logger.error(f"❌ Failed to send email to {to_email}: {str(e)}")
