"""
Supabase Service - Helper functions for database operations

This module provides convenient wrapper functions for common database operations.
"""

from typing import Dict, List, Any, Optional
from database.supabase_client import get_supabase_client


async def create_record(table: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new record in a table.
    
    Args:
        table: Table name
        data: Record data
        
    Returns:
        Created record
    """
    supabase = get_supabase_client()
    response = supabase.table(table).insert(data).execute()
    return response.data[0] if response.data else None


async def get_record_by_id(table: str, record_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a single record by ID.
    
    Args:
        table: Table name
        record_id: Record UUID
        
    Returns:
        Record or None if not found
    """
    supabase = get_supabase_client()
    response = supabase.table(table).select("*").eq("id", record_id).execute()
    return response.data[0] if response.data else None


async def get_all_records(table: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Get all records from a table with optional filters.
    
    Args:
        table: Table name
        filters: Optional dictionary of filters {column: value}
        
    Returns:
        List of records
    """
    supabase = get_supabase_client()
    query = supabase.table(table).select("*")
    
    if filters:
        for column, value in filters.items():
            query = query.eq(column, value)
    
    response = query.execute()
    return response.data


async def update_record(table: str, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update a record by ID.
    
    Args:
        table: Table name
        record_id: Record UUID
        data: Updated data
        
    Returns:
        Updated record
    """
    supabase = get_supabase_client()
    response = supabase.table(table).update(data).eq("id", record_id).execute()
    return response.data[0] if response.data else None


async def delete_record(table: str, record_id: str) -> bool:
    """
    Delete a record by ID.
    
    Args:
        table: Table name
        record_id: Record UUID
        
    Returns:
        True if deleted successfully
    """
    supabase = get_supabase_client()
    response = supabase.table(table).delete().eq("id", record_id).execute()
    return len(response.data) > 0


async def upsert_record(table: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Insert or update a record (upsert).
    
    Args:
        table: Table name
        data: Record data (must include unique constraint fields)
        
    Returns:
        Upserted record
    """
    supabase = get_supabase_client()
    response = supabase.table(table).upsert(data).execute()
    return response.data[0] if response.data else None


async def count_records(table: str, filters: Optional[Dict[str, Any]] = None) -> int:
    """
    Count records in a table with optional filters.
    
    Args:
        table: Table name
        filters: Optional dictionary of filters {column: value}
        
    Returns:
        Count of records
    """
    supabase = get_supabase_client()
    query = supabase.table(table).select("*", count="exact")
    
    if filters:
        for column, value in filters.items():
            query = query.eq(column, value)
    
    response = query.execute()
    return response.count if response.count is not None else 0


# Student-specific helpers
async def get_student_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get a student by email address"""
    supabase = get_supabase_client()
    response = supabase.table("students").select("*").eq("email", email).execute()
    return response.data[0] if response.data else None


async def update_student_xp(student_id: str, xp_to_add: int) -> Dict[str, Any]:
    """
    Update student's total XP and recalculate level.
    
    Args:
        student_id: Student UUID
        xp_to_add: XP points to add
        
    Returns:
        Updated student record
    """
    supabase = get_supabase_client()
    
    # Get current student
    student = await get_record_by_id("students", student_id)
    if not student:
        raise ValueError(f"Student {student_id} not found")
    
    # Calculate new XP and level
    new_total_xp = student["total_xp"] + xp_to_add
    new_level = (new_total_xp // 100) + 1  # Simple level calculation: 100 XP per level
    
    # Update student
    return await update_record("students", student_id, {
        "total_xp": new_total_xp,
        "level": new_level
    })


# Achievement helpers
async def unlock_achievement(student_id: str, achievement_code: str) -> Optional[Dict[str, Any]]:
    """
    Unlock an achievement for a student.
    
    Args:
        student_id: Student UUID
        achievement_code: Achievement code
        
    Returns:
        Student achievement record or None if already unlocked
    """
    supabase = get_supabase_client()
    
    # Get achievement by code
    achievement_response = supabase.table("achievements").select("*").eq("code", achievement_code).execute()
    
    if not achievement_response.data:
        return None
    
    achievement = achievement_response.data[0]
    
    # Check if already unlocked
    existing = supabase.table("student_achievements") \
        .select("*") \
        .eq("student_id", student_id) \
        .eq("achievement_id", achievement["id"]) \
        .execute()
    
    if existing.data:
        return None  # Already unlocked
    
    #Insert student achievement
    response = supabase.table("student_achievements").insert({
        "student_id": student_id,
        "achievement_id": achievement["id"]
    }).execute()
    
    # Award XP
    if achievement["xp_reward"] > 0:
        await update_student_xp(student_id, achievement["xp_reward"])
    
    return response.data[0] if response.data else None


async def get_student_achievements(student_id: str) -> List[Dict[str, Any]]:
    """Get all achievements unlocked by a student"""
    supabase = get_supabase_client()
    response = supabase.table("student_achievements") \
        .select("*, achievements(*)") \
        .eq("student_id", student_id) \
        .execute()
    return response.data
