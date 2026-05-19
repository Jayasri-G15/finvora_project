import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
import os
import sys

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

# Override sqlalchemy.url from env var
database_url = os.getenv("DATABASE_URL", "")
# Alembic needs sync URL for migrations
sync_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
config.set_main_option("sqlalchemy.url", sync_url)

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


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
