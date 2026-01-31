"""
Supabase Client Configuration

This module provides a configured Supabase client singleton for the application.
Uses a proper singleton pattern to avoid global mutable state issues.
"""

import os
from functools import lru_cache
from typing import Optional

from supabase import Client, create_client


class SupabaseClientError(Exception):
    """Raised when Supabase client cannot be initialized."""

    pass


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """
    Get or create a Supabase client instance (singleton).

    Uses lru_cache to ensure only one instance is created.

    Returns:
        Client: Configured Supabase client

    Raises:
        SupabaseClientError: If required environment variables are not set
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url:
        raise SupabaseClientError(
            "SUPABASE_URL environment variable is not set. "
            "Please configure it in your .env file."
        )

    if not key:
        raise SupabaseClientError(
            "SUPABASE_SERVICE_ROLE_KEY environment variable is not set. "
            "Please configure it in your .env file."
        )

    return create_client(url, key)


def init_supabase() -> Client:
    """
    Initialize the Supabase client.

    This is called during application startup to ensure
    the client is properly configured.

    Returns:
        Client: The initialized Supabase client

    Raises:
        SupabaseClientError: If initialization fails
    """
    return get_supabase_client()


def get_client() -> Optional[Client]:
    """
    Safely get the Supabase client, returning None if not configured.

    Use this when you want to gracefully handle missing configuration.

    Returns:
        Optional[Client]: The Supabase client or None if not configured
    """
    try:
        return get_supabase_client()
    except SupabaseClientError:
        return None


# Convenience alias for dependency injection
def get_db() -> Client:
    """
    Dependency injection helper for FastAPI routes.

    Usage:
        @router.get("/items")
        async def get_items(db: Client = Depends(get_db)):
            ...

    Returns:
        Client: The Supabase client

    Raises:
        SupabaseClientError: If client is not configured
    """
    return get_supabase_client()
