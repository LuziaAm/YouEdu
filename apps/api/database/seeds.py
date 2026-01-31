"""
Seed script for creating default achievements in Supabase

Run this script once to populate the achievements table with default achievements.

Usage:
    python -m database.seeds
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.supabase_client import get_supabase_client


DEFAULT_ACHIEVEMENTS = [
    {
        "code": "first_challenge",
        "name": "Primeiro Passo",
        "description": "Complete seu primeiro desafio",
        "icon": "🎯",
        "category": "milestone",
        "xp_reward": 50,
        "requirement_value": 1
    },
    {
        "code": "streak_3",
        "name": "Sequência Inicial",
        "description": "Acerte 3 desafios seguidos",
        "icon": "🔥",
        "category": "streak",
        "xp_reward": 75,
        "requirement_value": 3
    },
    {
        "code": "streak_5",
        "name": "Foco Total",
        "description": "Acerte 5 desafios seguidos",
        "icon": "⚡",
        "category": "streak",
        "xp_reward": 150,
        "requirement_value": 5
    },
    {
        "code": "streak_10",
        "name": "Imparável",
        "description": "Acerte 10 desafios seguidos",
        "icon": "💎",
        "category": "streak",
        "xp_reward": 300,
        "requirement_value": 10
    },
    {
        "code": "speed_demon",
        "name": "Raio Veloz",
        "description": "Complete um desafio em menos de 10 segundos",
        "icon": "⚡",
        "category": "speed",
        "xp_reward": 100,
        "requirement_value": 10
    },
    {
        "code": "perfect_score",
        "name": "Pontuação Perfeita",
        "description": "Complete um vídeo com 100% de acertos",
        "icon": "🌟",
        "category": "achievement",
        "xp_reward": 200,
        "requirement_value": 100
    },
    {
        "code": "level_5",
        "name": "Iniciante Avançado",
        "description": "Atinja o nível 5",
        "icon": "🏅",
        "category": "milestone",
        "xp_reward": 250,
        "requirement_value": 5
    },
    {
        "code": "level_10",
        "name": "Estudante Dedicado",
        "description": "Atinja o nível 10",
        "icon": "🥇",
        "category": "milestone",
        "xp_reward": 500,
        "requirement_value": 10
    },
    {
        "code": "level_25",
        "name": "Mestre do Conhecimento",
        "description": "Atinja o nível 25",
        "icon": "👑",
        "category": "milestone",
        "xp_reward": 1000,
        "requirement_value": 25
    },
    {
        "code": "video_master_5",
        "name": "Explorador",
        "description": "Complete 5 vídeos diferentes",
        "icon": "🎬",
        "category": "content",
        "xp_reward": 300,
        "requirement_value": 5
    },
    {
        "code": "video_master_10",
        "name": "Colecionador",
        "description": "Complete 10 vídeos diferentes",
        "icon": "📚",
        "category": "content",
        "xp_reward": 600,
        "requirement_value": 10
    },
    {
        "code": "video_master_25",
        "name": "Biblioteca Viva",
        "description": "Complete 25 vídeos diferentes",
        "icon": "🎓",
        "category": "content",
        "xp_reward": 1500,
        "requirement_value": 25
    },
    {
        "code": "code_master",
        "name": "Mestre do Código",
        "description": "Complete 10 desafios de código",
        "icon": "💻",
        "category": "achievement",
        "xp_reward": 400,
        "requirement_value": 10
    },
    {
        "code": "quiz_champion",
        "name": "Campeão de Quiz",
        "description": "Complete 25 desafios de quiz",
        "icon": "🧠",
        "category": "achievement",
        "xp_reward": 350,
        "requirement_value": 25
    },
    {
        "code": "night_owl",
        "name": "Coruja Noturna",
        "description": "Complete um desafio entre 00:00 e 05:00",
        "icon": "🦉",
        "category": "special",
        "xp_reward": 150,
        "requirement_value": 1
    },
    {
        "code": "early_bird",
        "name": "Madrugador",
        "description": "Complete um desafio entre 05:00 e 07:00",
        "icon": "🐦",
        "category": "special",
        "xp_reward": 150,
        "requirement_value": 1
    }
]


async def seed_achievements():
    """Populate achievements table with default achievements"""
    supabase = get_supabase_client()
    
    print("🌱 Seeding achievements...")
    
    for achievement in DEFAULT_ACHIEVEMENTS:
        try:
            # Check if achievement already exists
            existing = supabase.table("achievements") \
                .select("*") \
                .eq("code", achievement["code"]) \
                .execute()
            
            if existing.data:
                print(f"   ⏭️  Skipping '{achievement['name']}' (already exists)")
                continue
            
            # Insert achievement
            supabase.table("achievements").insert(achievement).execute()
            print(f"   ✅ Created '{achievement['name']}'")
            
        except Exception as e:
            print(f"   ❌ Error creating '{achievement['name']}': {e}")
    
    print(f"\n🎉 Seed completed! {len(DEFAULT_ACHIEVEMENTS)} achievements processed.")


async def main():
    """Main function"""
    try:
        await seed_achievements()
    except Exception as e:
        print(f"❌ Seed failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
