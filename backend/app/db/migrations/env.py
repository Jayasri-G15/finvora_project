import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from app.models.base import Base  # noqa: E402
# Import all models so Alembic autogenerate detects them
import app.models.user  # noqa: F401
import app.models.email_sync  # noqa: F401
import app.models.transaction  # noqa: F401
import app.models.invoice  # noqa: F401
import app.models.vendor  # noqa: F401
import app.models.budget  # noqa: F401
import app.models.payment  # noqa: F401
import app.models.approval  # noqa: F401
import app.models.alert  # noqa: F401
import app.models.report  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Use ALEMBIC_DATABASE_URL (psycopg2 direct connection to Supabase, port 5432)
# Falls back to DATABASE_URL with asyncpg → psycopg2 substitution
alembic_url = os.getenv("ALEMBIC_DATABASE_URL", "")
if not alembic_url:
    db_url = os.getenv("DATABASE_URL", "")
    # Strip query params (prepared_statement_cache_size) and swap driver
    alembic_url = db_url.split("?")[0].replace(
        "postgresql+asyncpg", "postgresql+psycopg2"
    )

config.set_main_option("sqlalchemy.url", alembic_url)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
