"""
Discussion Forum Service for MasterLMS
Handles course-based discussion forums, threads, and posts
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from datetime import datetime, timezone

from models import (
    User, UserRole, Course, Enrollment, EnrollmentStatus,
    DiscussionForum, DiscussionThread, DiscussionPost
)

class DiscussionService:
    def __init__(self):
        pass
    
    # ============================================================================
    # Forum Management
    # ============================================================================
    
    def get_course_forums(self, db: Session, course_id: int, user_id: int) -> List[Dict[str, Any]]:
        """Get discussion forums for a course"""
        # Check if user has access to course
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise ValueError("Course not found")
        
        # Check access permissions
        has_access = False
        if user.role == UserRole.ADMIN:
            has_access = True
        elif user.role == UserRole.LECTURER and course.lecturer_id == user_id:
            has_access = True
        elif user.role == UserRole.STUDENT:
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == user_id,
                Enrollment.course_id == course_id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).first()
            has_access = enrollment is not None
        
        if not has_access:
            raise ValueError("Access denied to course forums")
        
        forums = db.query(DiscussionForum).filter(
            DiscussionForum.course_id == course_id,
            DiscussionForum.is_active == True
        ).order_by(DiscussionForum.created_at).all()
        
        forum_list = []
        for forum in forums:
            # Get thread count and latest activity
            thread_count = db.query(DiscussionThread).filter(
                DiscussionThread.forum_id == forum.id,
                DiscussionThread.is_active == True
            ).count()
            
            latest_post = db.query(DiscussionPost).join(DiscussionThread).filter(
                DiscussionThread.forum_id == forum.id,
                DiscussionPost.is_active == True
            ).order_by(DiscussionPost.created_at.desc()).first()
            
            forum_list.append({
                "id": forum.id,
                "title": forum.title,
                "description": forum.description,
                "thread_count": thread_count,
                "latest_activity": latest_post.created_at.isoformat() if latest_post else None,
                "latest_post_author": latest_post.author.name if latest_post else None,
                "created_at": forum.created_at.isoformat(),
                "is_pinned": forum.is_pinned
            })
        
        return forum_list
    
    def create_forum(self, db: Session, course_id: int, title: str, description: str, 
                    created_by_id: int) -> Dict[str, Any]:
        """Create a new discussion forum"""
        user = db.query(User).filter(User.id == created_by_id).first()
        if not user or user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise ValueError("Only admins and lecturers can create forums")
        
        forum = DiscussionForum(
            course_id=course_id,
            title=title,
            description=description,
            created_by_id=created_by_id
        )
        
        db.add(forum)
        db.commit()
        db.refresh(forum)
        
        return {
            "id": forum.id,
            "title": forum.title,
            "description": forum.description,
            "message": "Forum created successfully"
        }
    
    # ============================================================================
    # Thread Management
    # ============================================================================
    
    def get_forum_threads(self, db: Session, forum_id: int, user_id: int, 
                         page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get threads in a forum with pagination"""
        forum = db.query(DiscussionForum).filter(DiscussionForum.id == forum_id).first()
        if not forum:
            raise ValueError("Forum not found")
        
        # Check access to course
        user = db.query(User).filter(User.id == user_id).first()
        course = forum.course
        
        has_access = False
        if user.role == UserRole.ADMIN:
            has_access = True
        elif user.role == UserRole.LECTURER and course.lecturer_id == user_id:
            has_access = True
        elif user.role == UserRole.STUDENT:
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == user_id,
                Enrollment.course_id == course.id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).first()
            has_access = enrollment is not None
        
        if not has_access:
            raise ValueError("Access denied")
        
        # Get threads with pagination
        offset = (page - 1) * limit
        threads_query = db.query(DiscussionThread).filter(
            DiscussionThread.forum_id == forum_id,
            DiscussionThread.is_active == True
        )
        
        total_threads = threads_query.count()
        threads = threads_query.order_by(
            DiscussionThread.is_pinned.desc(),
            DiscussionThread.last_activity.desc()
        ).offset(offset).limit(limit).all()
        
        thread_list = []
        for thread in threads:
            # Get post count and latest post
            post_count = db.query(DiscussionPost).filter(
                DiscussionPost.thread_id == thread.id,
                DiscussionPost.is_active == True
            ).count()
            
            latest_post = db.query(DiscussionPost).filter(
                DiscussionPost.thread_id == thread.id,
                DiscussionPost.is_active == True
            ).order_by(DiscussionPost.created_at.desc()).first()
            
            thread_list.append({
                "id": thread.id,
                "title": thread.title,
                "content": thread.content[:200] + "..." if len(thread.content) > 200 else thread.content,
                "author": {
                    "id": thread.author.id,
                    "name": thread.author.name,
                    "role": thread.author.role.value
                },
                "post_count": post_count,
                "view_count": thread.view_count,
                "is_pinned": thread.is_pinned,
                "is_locked": thread.is_locked,
                "created_at": thread.created_at.isoformat(),
                "last_activity": thread.last_activity.isoformat() if thread.last_activity else thread.created_at.isoformat(),
                "latest_post_author": latest_post.author.name if latest_post else thread.author.name
            })
        
        return {
            "threads": thread_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_threads,
                "pages": (total_threads + limit - 1) // limit
            }
        }
    
    def create_thread(self, db: Session, forum_id: int, title: str, content: str, 
                     author_id: int) -> Dict[str, Any]:
        """Create a new discussion thread"""
        forum = db.query(DiscussionForum).filter(DiscussionForum.id == forum_id).first()
        if not forum:
            raise ValueError("Forum not found")
        
        # Check if user can post in this course
        user = db.query(User).filter(User.id == author_id).first()
        course = forum.course
        
        has_access = False
        if user.role == UserRole.ADMIN:
            has_access = True
        elif user.role == UserRole.LECTURER and course.lecturer_id == author_id:
            has_access = True
        elif user.role == UserRole.STUDENT:
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == author_id,
                Enrollment.course_id == course.id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).first()
            has_access = enrollment is not None
        
        if not has_access:
            raise ValueError("Access denied")
        
        thread = DiscussionThread(
            forum_id=forum_id,
            title=title,
            content=content,
            author_id=author_id,
            last_activity=datetime.now(timezone.utc)
        )
        
        db.add(thread)
        db.commit()
        db.refresh(thread)
        
        return {
            "id": thread.id,
            "title": thread.title,
            "message": "Thread created successfully"
        }
    
    # ============================================================================
    # Post Management
    # ============================================================================
    
    def get_thread_posts(self, db: Session, thread_id: int, user_id: int, 
                        page: int = 1, limit: int = 10) -> Dict[str, Any]:
        """Get posts in a thread with pagination"""
        thread = db.query(DiscussionThread).filter(DiscussionThread.id == thread_id).first()
        if not thread:
            raise ValueError("Thread not found")
        
        # Increment view count
        thread.view_count += 1
        db.commit()
        
        # Check access
        user = db.query(User).filter(User.id == user_id).first()
        course = thread.forum.course
        
        has_access = False
        if user.role == UserRole.ADMIN:
            has_access = True
        elif user.role == UserRole.LECTURER and course.lecturer_id == user_id:
            has_access = True
        elif user.role == UserRole.STUDENT:
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == user_id,
                Enrollment.course_id == course.id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).first()
            has_access = enrollment is not None
        
        if not has_access:
            raise ValueError("Access denied")
        
        # Get posts with pagination
        offset = (page - 1) * limit
        posts_query = db.query(DiscussionPost).filter(
            DiscussionPost.thread_id == thread_id,
            DiscussionPost.is_active == True
        )
        
        total_posts = posts_query.count()
        posts = posts_query.order_by(DiscussionPost.created_at).offset(offset).limit(limit).all()
        
        post_list = []
        for post in posts:
            post_list.append({
                "id": post.id,
                "content": post.content,
                "author": {
                    "id": post.author.id,
                    "name": post.author.name,
                    "role": post.author.role.value
                },
                "created_at": post.created_at.isoformat(),
                "updated_at": post.updated_at.isoformat() if post.updated_at else None,
                "is_edited": post.updated_at is not None,
                "parent_post_id": post.parent_post_id
            })
        
        return {
            "thread": {
                "id": thread.id,
                "title": thread.title,
                "content": thread.content,
                "author": {
                    "id": thread.author.id,
                    "name": thread.author.name,
                    "role": thread.author.role.value
                },
                "created_at": thread.created_at.isoformat(),
                "is_pinned": thread.is_pinned,
                "is_locked": thread.is_locked
            },
            "posts": post_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_posts,
                "pages": (total_posts + limit - 1) // limit
            }
        }
    
    def create_post(self, db: Session, thread_id: int, content: str, author_id: int, 
                   parent_post_id: Optional[int] = None) -> Dict[str, Any]:
        """Create a new post in a thread"""
        thread = db.query(DiscussionThread).filter(DiscussionThread.id == thread_id).first()
        if not thread:
            raise ValueError("Thread not found")
        
        if thread.is_locked:
            raise ValueError("Thread is locked")
        
        # Check access
        user = db.query(User).filter(User.id == author_id).first()
        course = thread.forum.course
        
        has_access = False
        if user.role == UserRole.ADMIN:
            has_access = True
        elif user.role == UserRole.LECTURER and course.lecturer_id == author_id:
            has_access = True
        elif user.role == UserRole.STUDENT:
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == author_id,
                Enrollment.course_id == course.id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).first()
            has_access = enrollment is not None
        
        if not has_access:
            raise ValueError("Access denied")
        
        post = DiscussionPost(
            thread_id=thread_id,
            content=content,
            author_id=author_id,
            parent_post_id=parent_post_id
        )
        
        db.add(post)
        
        # Update thread last activity
        thread.last_activity = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(post)
        
        return {
            "id": post.id,
            "message": "Post created successfully"
        }
    
    # ============================================================================
    # Moderation
    # ============================================================================
    
    def pin_thread(self, db: Session, thread_id: int, user_id: int) -> Dict[str, Any]:
        """Pin/unpin a thread (lecturers and admins only)"""
        user = db.query(User).filter(User.id == user_id).first()
        thread = db.query(DiscussionThread).filter(DiscussionThread.id == thread_id).first()
        
        if not thread:
            raise ValueError("Thread not found")
        
        course = thread.forum.course
        if user.role not in [UserRole.ADMIN] and not (user.role == UserRole.LECTURER and course.lecturer_id == user_id):
            raise ValueError("Access denied")
        
        thread.is_pinned = not thread.is_pinned
        db.commit()
        
        return {
            "message": f"Thread {'pinned' if thread.is_pinned else 'unpinned'} successfully",
            "is_pinned": thread.is_pinned
        }
    
    def lock_thread(self, db: Session, thread_id: int, user_id: int) -> Dict[str, Any]:
        """Lock/unlock a thread (lecturers and admins only)"""
        user = db.query(User).filter(User.id == user_id).first()
        thread = db.query(DiscussionThread).filter(DiscussionThread.id == thread_id).first()
        
        if not thread:
            raise ValueError("Thread not found")
        
        course = thread.forum.course
        if user.role not in [UserRole.ADMIN] and not (user.role == UserRole.LECTURER and course.lecturer_id == user_id):
            raise ValueError("Access denied")
        
        thread.is_locked = not thread.is_locked
        db.commit()
        
        return {
            "message": f"Thread {'locked' if thread.is_locked else 'unlocked'} successfully",
            "is_locked": thread.is_locked
        }
