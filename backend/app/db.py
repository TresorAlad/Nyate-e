from contextlib import contextmanager
from typing import Any, Iterator

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import Settings


def create_pool(settings: Settings) -> ConnectionPool:
    return ConnectionPool(
        conninfo=settings.database_url,
        min_size=1,
        max_size=5,
        kwargs={"row_factory": dict_row},
    )


@contextmanager
def get_conn(pool: ConnectionPool) -> Iterator[psycopg.Connection[Any]]:
    with pool.connection() as conn:
        yield conn
