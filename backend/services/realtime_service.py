"""
Real-time Service for MasterLMS
Handles WebSocket connections, live updates, and real-time notifications
"""

import json
import asyncio
from typing import Dict, List, Set, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models import User, UserRole, Course, Enrollment, EnrollmentStatus

class ConnectionManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[int, Set[Any]] = {}
        # Store user sessions with metadata
        self.user_sessions: Dict[int, Dict[str, Any]] = {}
    
    async def connect(self, websocket: Any, user_id: int, user_role: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        
        # Store user session info
        self.user_sessions[user_id] = {
            "role": user_role,
            "connected_at": datetime.now(timezone.utc),
            "last_activity": datetime.now(timezone.utc)
        }
        
        print(f"User {user_id} ({user_role}) connected via WebSocket")
    
    def disconnect(self, websocket: Any, user_id: int):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Remove user session if no more connections
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                if user_id in self.user_sessions:
                    del self.user_sessions[user_id]
        
        print(f"User {user_id} disconnected from WebSocket")
    
    async def send_personal_message(self, message: Dict[str, Any], user_id: int):
        """Send a message to a specific user"""
        if user_id in self.active_connections:
            disconnected = set()
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except:
                    disconnected.add(websocket)
            
            # Clean up disconnected websockets
            for websocket in disconnected:
                self.active_connections[user_id].discard(websocket)
    
    async def send_to_role(self, message: Dict[str, Any], role: str):
        """Send a message to all users with a specific role"""
        for user_id, session in self.user_sessions.items():
            if session["role"] == role:
                await self.send_personal_message(message, user_id)
    
    async def send_to_course(self, message: Dict[str, Any], course_id: int, db: Session):
        """Send a message to all users enrolled in a course"""
        # Get enrolled students
        enrollments = db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.status == EnrollmentStatus.ENROLLED
        ).all()
        
        # Get course lecturer
        course = db.query(Course).filter(Course.id == course_id).first()
        
        # Send to students
        for enrollment in enrollments:
            await self.send_personal_message(message, enrollment.student_id)
        
        # Send to lecturer
        if course and course.lecturer_id:
            await self.send_personal_message(message, course.lecturer_id)
    
    async def broadcast(self, message: Dict[str, Any]):
        """Send a message to all connected users"""
        for user_id in self.active_connections:
            await self.send_personal_message(message, user_id)
    
    def get_online_users(self) -> List[Dict[str, Any]]:
        """Get list of currently online users"""
        online_users = []
        for user_id, session in self.user_sessions.items():
            online_users.append({
                "user_id": user_id,
                "role": session["role"],
                "connected_at": session["connected_at"].isoformat(),
                "last_activity": session["last_activity"].isoformat()
            })
        return online_users
    
    def get_online_count(self) -> int:
        """Get count of online users"""
        return len(self.user_sessions)

class RealtimeService:
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
    
    # ============================================================================
    # Real-time Notifications
    # ============================================================================
    
    async def notify_new_announcement(self, announcement_data: Dict[str, Any], target_audience: str, 
                                    course_id: Optional[int] = None, db: Optional[Session] = None):
        """Send real-time notification for new announcement"""
        message = {
            "type": "new_announcement",
            "data": announcement_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        if target_audience == "all":
            await self.connection_manager.broadcast(message)
        elif target_audience in ["students", "lecturers", "parents"]:
            await self.connection_manager.send_to_role(message, target_audience)
        elif target_audience == "course" and course_id and db:
            await self.connection_manager.send_to_course(message, course_id, db)
    
    async def notify_new_message(self, recipient_id: int, message_data: Dict[str, Any]):
        """Send real-time notification for new message"""
        notification = {
            "type": "new_message",
            "data": message_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.connection_manager.send_personal_message(notification, recipient_id)
    
    async def notify_assignment_update(self, course_id: int, assignment_data: Dict[str, Any], db: Session):
        """Send real-time notification for assignment updates"""
        message = {
            "type": "assignment_update",
            "data": assignment_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.connection_manager.send_to_course(message, course_id, db)
    
    async def notify_grade_posted(self, student_id: int, grade_data: Dict[str, Any]):
        """Send real-time notification when grade is posted"""
        notification = {
            "type": "grade_posted",
            "data": grade_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.connection_manager.send_personal_message(notification, student_id)
    
    async def notify_forum_activity(self, course_id: int, activity_data: Dict[str, Any], db: Session):
        """Send real-time notification for forum activity"""
        message = {
            "type": "forum_activity",
            "data": activity_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.connection_manager.send_to_course(message, course_id, db)
    
    # ============================================================================
    # Live Updates
    # ============================================================================
    
    async def update_user_activity(self, user_id: int):
        """Update user's last activity timestamp"""
        if user_id in self.connection_manager.user_sessions:
            self.connection_manager.user_sessions[user_id]["last_activity"] = datetime.now(timezone.utc)
    
    async def broadcast_system_status(self, status_data: Dict[str, Any]):
        """Broadcast system status updates"""
        message = {
            "type": "system_status",
            "data": status_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Send to admins only
        await self.connection_manager.send_to_role(message, "admin")
    
    async def send_typing_indicator(self, user_id: int, target_id: int, is_typing: bool):
        """Send typing indicator for messages"""
        message = {
            "type": "typing_indicator",
            "data": {
                "user_id": user_id,
                "is_typing": is_typing
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.connection_manager.send_personal_message(message, target_id)
    
    async def update_online_status(self):
        """Broadcast updated online user count"""
        online_count = self.connection_manager.get_online_count()
        online_users = self.connection_manager.get_online_users()
        
        message = {
            "type": "online_status",
            "data": {
                "online_count": online_count,
                "online_users": online_users
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Send to admins only
        await self.connection_manager.send_to_role(message, "admin")
    
    # ============================================================================
    # Real-time Analytics
    # ============================================================================
    
    async def send_live_analytics(self, user_id: int, analytics_data: Dict[str, Any]):
        """Send live analytics updates"""
        message = {
            "type": "live_analytics",
            "data": analytics_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.connection_manager.send_personal_message(message, user_id)
    
    async def broadcast_course_analytics(self, course_id: int, analytics_data: Dict[str, Any], db: Session):
        """Broadcast course analytics to course participants"""
        message = {
            "type": "course_analytics",
            "data": analytics_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Send to course lecturer only
        course = db.query(Course).filter(Course.id == course_id).first()
        if course and course.lecturer_id:
            await self.connection_manager.send_personal_message(message, course.lecturer_id)
    
    # ============================================================================
    # Utility Methods
    # ============================================================================
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get WebSocket connection statistics"""
        online_users = self.connection_manager.get_online_users()
        role_counts = {}
        
        for user in online_users:
            role = user["role"]
            role_counts[role] = role_counts.get(role, 0) + 1
        
        return {
            "total_online": len(online_users),
            "role_breakdown": role_counts,
            "connections_by_role": role_counts
        }
    
    async def handle_websocket_message(self, websocket: Any, user_id: int, message: str):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            message_type = data.get("type")
            
            # Update user activity
            await self.update_user_activity(user_id)
            
            if message_type == "ping":
                # Respond to ping with pong
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }))
            
            elif message_type == "typing":
                # Handle typing indicators
                target_id = data.get("target_id")
                is_typing = data.get("is_typing", False)
                if target_id:
                    await self.send_typing_indicator(user_id, target_id, is_typing)
            
            elif message_type == "join_course":
                # Handle joining course-specific updates
                course_id = data.get("course_id")
                if course_id:
                    # Store course subscription for user
                    pass  # Implementation depends on requirements
            
        except json.JSONDecodeError:
            # Invalid JSON message
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Invalid JSON format"
            }))
        except Exception as e:
            # General error handling
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Error processing message: {str(e)}"
            }))

# Global connection manager instance
connection_manager = ConnectionManager()
realtime_service = RealtimeService(connection_manager)
