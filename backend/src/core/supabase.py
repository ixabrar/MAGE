import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

env_file = Path(__file__).resolve().parents[2] / ".env"
if env_file.exists():
    load_dotenv(env_file)
else:
    load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError("Supabase environment variables are missing")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is missing")


supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
)


supabase_admin: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)