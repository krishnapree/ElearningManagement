"""
Communication Service for MasterLMS
Handles announcements, messaging, and notifications
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from datetime import datetime, timezone

from models import (
    User, UserRole, Course, Enrollment, EnrollmentStatus,
    Announcement, Message, Notification
)

class CommunicationService:
    def __init__(self):
        pass

    # ============================================================================
    # Announcement Management
    # ============================================================================

    def create_announcement(self, db: Session, title: str, content: str, author_id: int,
                          target_audience: str = "all", course_id: Optional[int] = None,
                          is_urgent: bool = False) -> Dict[str, Any]:
        """Create a new announcement"""
        user = db.query(User).filter(User.id == author_id).first()
        if not user or user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise ValueError("Only admins and lecturers can create announcements")

        # If course-specific, check if user has access
        if course_id:
            course = db.query(Course).filter(Course.id == course_id).first()
            if not course:
                raise ValueError("Course not found")

            if user.role == UserRole.LECTURER and course.lecturer_id != author_id:
                raise ValueError("Access denied to this course")

        announcement = Announcement(
            title=title,
            content=content,
            author_id=author_id,
            target_audience=target_audience,
            course_id=course_id,
            is_urgent=is_urgent,
            is_published=True
        )

        db.add(announcement)
        db.commit()
        db.refresh(announcement)

        # Create notifications for target audience
        self._create_announcement_notifications(db, announcement)

        return {
            "id": announcement.id,
            "title": announcement.title,
            "message": "Announcement created successfully"
        }

    def get_announcements(self, db: Session, user_id: int, course_id: Optional[int] = None,
                         limit: int = 20) -> List[Dict[str, Any]]:
        """Get announcements for a user"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        query = db.query(Announcement).filter(Announcement.is_published == True)

        # Filter by target audience
        if user.role == UserRole.STUDENT:
            # Get student's enrolled courses
            enrolled_courses = db.query(Enrollment).filter(
                Enrollment.student_id == user_id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).all()
            course_ids = [enrollment.course_id for enrollment in enrolled_courses]

            query = query.filter(
                or_(
                    Announcement.target_audience.in_(['all', 'students']),
                    and_(
                        Announcement.target_audience == 'course',
                        Announcement.course_id.in_(course_ids)
                    )
                )
            )
        elif user.role == UserRole.LECTURER:
            # Get lecturer's courses
            lecturer_courses = db.query(Course).filter(Course.lecturer_id == user_id).all()
            course_ids = [course.id for course in lecturer_courses]

            query = query.filter(
                or_(
                    Announcement.target_audience.in_(['all', 'lecturers']),
                    and_(
                        Announcement.target_audience == 'course',
                        Announcement.course_id.in_(course_ids)
                    )
                )
            )
        elif user.role == UserRole.ADMIN:
            # Admins can see all announcements
            pass

        # Filter by specific course if requested
        if course_id:
            query = query.filter(Announcement.course_id == course_id)

        announcements = query.order_by(
            Announcement.is_urgent.desc(),
            Announcement.created_at.desc()
        ).limit(limit).all()

        announcement_list = []
        for announcement in announcements:
            announcement_list.append({
                "id": announcement.id,
                "title": announcement.title,
                "content": announcement.content,
                "author": announcement.author.name,
                "target_audience": announcement.target_audience,
                "course": announcement.course.name if announcement.course else None,
                "is_urgent": announcement.is_urgent,
                "created_at": announcement.created_at.isoformat(),
                "read_status": self._get_read_status(db, announcement.id, user_id)
            })

        return announcement_list

    def _create_announcement_notifications(self, db: Session, announcement: Announcement):
        """Create notifications for announcement recipients"""
        target_users = []

        if announcement.target_audience == "all":
            target_users = db.query(User).filter(User.is_active == True).all()
        elif announcement.target_audience == "students":
            target_users = db.query(User).filter(
                User.role == UserRole.STUDENT,
                User.is_active == True
            ).all()
        elif announcement.target_audience == "lecturers":
            target_users = db.query(User).filter(
                User.role == UserRole.LECTURER,
                User.is_active == True
            ).all()
        # Note: Parent role has been removed from the system
        elif announcement.target_audience == "course" and announcement.course_id:
            # Get enrolled students and course lecturer
            enrollments = db.query(Enrollment).filter(
                Enrollment.course_id == announcement.course_id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).all()
            target_users = [enrollment.student for enrollment in enrollments]

            # Add course lecturer
            course = db.query(Course).filter(Course.id == announcement.course_id).first()
            if course and course.lecturer:
                target_users.append(course.lecturer)

        # Create notifications
        for user in target_users:
            if user.id != announcement.author_id:  # Don't notify the author
                notification = Notification(
                    user_id=user.id,
                    title=f"New Announcement: {announcement.title}",
                    message=announcement.content[:200] + "..." if len(announcement.content) > 200 else announcement.content,
                    notification_type="announcement",
                    related_id=announcement.id,
                    is_urgent=announcement.is_urgent
                )
                db.add(notification)

        db.commit()

    def _get_read_status(self, db: Session, announcement_id: int, user_id: int) -> bool:
        """Check if user has read the announcement"""
        # This would typically be tracked in a separate table
        # For now, return False (unread)
        return False

    # ============================================================================
    # Messaging System
    # ============================================================================

    def send_message(self, db: Session, sender_id: int, recipient_id: int, subject: str,
                    content: str, parent_message_id: Optional[int] = None) -> Dict[str, Any]:
        """Send a message between users"""
        sender = db.query(User).filter(User.id == sender_id).first()
        recipient = db.query(User).filter(User.id == recipient_id).first()

        if not sender or not recipient:
            raise ValueError("Sender or recipient not found")

        message = Message(
            sender_id=sender_id,
            recipient_id=recipient_id,
            subject=subject,
            content=content,
            parent_message_id=parent_message_id
        )

        db.add(message)
        db.commit()
        db.refresh(message)

        # Create notification for recipient
        notification = Notification(
            user_id=recipient_id,
            title=f"New Message from {sender.name}",
            message=f"Subject: {subject}",
            notification_type="message",
            related_id=message.id
        )
        db.add(notification)
        db.commit()

        return {
            "id": message.id,
            "message": "Message sent successfully"
        }

    def get_user_messages(self, db: Session, user_id: int, message_type: str = "inbox",
                         page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get user's messages (inbox/sent)"""
        offset = (page - 1) * limit

        if message_type == "inbox":
            query = db.query(Message).filter(Message.recipient_id == user_id)
        elif message_type == "sent":
            query = db.query(Message).filter(Message.sender_id == user_id)
        else:
            raise ValueError("Invalid message type")

        total_messages = query.count()
        messages = query.order_by(Message.created_at.desc()).offset(offset).limit(limit).all()

        message_list = []
        for message in messages:
            message_list.append({
                "id": message.id,
                "subject": message.subject,
                "content": message.content[:200] + "..." if len(message.content) > 200 else message.content,
                "sender": message.sender.name,
                "recipient": message.recipient.name,
                "created_at": message.created_at.isoformat(),
                "is_read": message.is_read,
                "has_replies": db.query(Message).filter(Message.parent_message_id == message.id).count() > 0
            })

        return {
            "messages": message_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_messages,
                "pages": (total_messages + limit - 1) // limit
            }
        }

    def get_message_thread(self, db: Session, message_id: int, user_id: int) -> Dict[str, Any]:
        """Get a message thread (original message + replies)"""
        message = db.query(Message).filter(Message.id == message_id).first()
        if not message:
            raise ValueError("Message not found")

        # Check if user has access to this message
        if message.sender_id != user_id and message.recipient_id != user_id:
            raise ValueError("Access denied")

        # Mark as read if user is recipient
        if message.recipient_id == user_id and not message.is_read:
            message.is_read = True
            db.commit()

        # Get the root message if this is a reply
        root_message = message
        if message.parent_message_id:
            root_message = db.query(Message).filter(Message.id == message.parent_message_id).first()

        # Get all messages in the thread
        thread_messages = db.query(Message).filter(
            or_(
                Message.id == root_message.id,
                Message.parent_message_id == root_message.id
            )
        ).order_by(Message.created_at).all()

        thread_list = []
        for msg in thread_messages:
            thread_list.append({
                "id": msg.id,
                "subject": msg.subject,
                "content": msg.content,
                "sender": msg.sender.name,
                "recipient": msg.recipient.name,
                "created_at": msg.created_at.isoformat(),
                "is_read": msg.is_read
            })

        return {
            "thread": thread_list,
            "participants": [root_message.sender.name, root_message.recipient.name]
        }

    # ============================================================================
    # Notifications
    # ============================================================================

    def get_user_notifications(self, db: Session, user_id: int, unread_only: bool = False,
                              limit: int = 50) -> List[Dict[str, Any]]:
        """Get user's notifications"""
        query = db.query(Notification).filter(Notification.user_id == user_id)

        if unread_only:
            query = query.filter(Notification.is_read == False)

        notifications = query.order_by(
            Notification.is_urgent.desc(),
            Notification.created_at.desc()
        ).limit(limit).all()

        notification_list = []
        for notification in notifications:
            notification_list.append({
                "id": notification.id,
                "title": notification.title,
                "message": notification.message,
                "notification_type": notification.notification_type,
                "is_read": notification.is_read,
                "is_urgent": notification.is_urgent,
                "created_at": notification.created_at.isoformat(),
                "related_id": notification.related_id
            })

        return notification_list

    def mark_notification_read(self, db: Session, notification_id: int, user_id: int) -> Dict[str, Any]:
        """Mark a notification as read"""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()

        if not notification:
            raise ValueError("Notification not found")

        notification.is_read = True
        db.commit()

        return {"message": "Notification marked as read"}

    def get_unread_count(self, db: Session, user_id: int) -> Dict[str, int]:
        """Get count of unread notifications and messages"""
        unread_notifications = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()

        unread_messages = db.query(Message).filter(
            Message.recipient_id == user_id,
            Message.is_read == False
        ).count()

        return {
            "unread_notifications": unread_notifications,
            "unread_messages": unread_messages,
            "total_unread": unread_notifications + unread_messages
        }

    # ============================================================================
    # Event Management
    # ============================================================================

    def create_event(self, db: Session, title: str, description: str, event_date: str,
                    location: str, organizer_id: int, event_type: str = "general") -> Dict[str, Any]:
        """Create a new event"""
        user = db.query(User).filter(User.id == organizer_id).first()
        if not user or user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise ValueError("Only admins and lecturers can create events")

        # For now, store events as announcements with special type
        # In a full implementation, you'd have a separate Event model
        event_announcement = Announcement(
            title=f"Event: {title}",
            content=f"{description}\n\nLocation: {location}\nDate: {event_date}",
            author_id=organizer_id,
            target_audience="all",
            is_urgent=False,
            is_published=True
        )

        db.add(event_announcement)
        db.commit()
        db.refresh(event_announcement)

        # Create notifications for all users
        self._create_announcement_notifications(db, event_announcement)

        return {
            "id": event_announcement.id,
            "title": title,
            "description": description,
            "event_date": event_date,
            "location": location,
            "organizer": user.name,
            "type": event_type,
            "message": "Event created successfully"
        }

    def get_events(self, db: Session, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        """Get events for a user"""
        # For now, get announcements that are events
        # In a full implementation, you'd query a separate Event model
        announcements = db.query(Announcement).filter(
            Announcement.is_published == True,
            Announcement.title.like("Event:%")
        ).order_by(Announcement.created_at.desc()).limit(limit).all()

        event_list = []
        for announcement in announcements:
            # Parse event details from announcement content
            lines = announcement.content.split('\n')
            location = "TBD"
            event_date = announcement.created_at.isoformat()
            description = lines[0] if lines else ""

            for line in lines:
                if line.startswith("Location:"):
                    location = line.replace("Location:", "").strip()
                elif line.startswith("Date:"):
                    event_date = line.replace("Date:", "").strip()

            event_list.append({
                "id": announcement.id,
                "title": announcement.title.replace("Event: ", ""),
                "description": description,
                "event_date": event_date,
                "event_time": "09:00",  # Default time
                "location": location,
                "organizer": announcement.author.name,
                "department": "General",
                "type": "general",
                "status": "upcoming",
                "is_public": True,
                "max_attendees": None,
                "registered_count": 0,
                "created_by": announcement.author.name,
                "created_at": announcement.created_at.isoformat()
            })

        return event_list


# Create an instance of the service
communication_service = CommunicationService()
