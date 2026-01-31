"""
Supabase Client Configuration

This module provides a configured Supabase client for the application.
"""

import os
from supabase import create_client, Client
from typing import Optional

# Global Supabase client instance
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get or create a Supabase client instance.
    
    Returns:
        Client: Configured Supabase client
        
    Raises:
        ValueError: If required environment variables are not set
    """
    global _supabase_client
    
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role for backend
        
        if not url or not key:
            raise ValueError(
                "Missing Supabase credentials. "
                "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
            )
        
        _supabase_client = create_client(url, key)
    
    return _supabase_client


# Convenience function to access the client
supabase: Client = None

def init_supabase():
    """Initialize the global Supabase client"""
    global supabase
    supabase = get_supabase_client()
    return supabase
