"""
Preview-environment supervisor shim.

Supervisor on the preview pod runs `uvicorn server:app --port 8001`. This file
spawns the real Node/Express API on an internal port and reverse-proxies all
HTTP traffic to it, so the live preview routes /api/* through the same port the
ingress expects. It is NOT shipped to production / Railway — only `server.js`
runs there.
"""

from __future__ import annotations

import asyncio
import logging
import os
import signal
import subprocess
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from fastapi import FastAPI, Request, Response

NODE_PORT = int(os.environ.get("NODE_PORT", "5001"))
NODE_TARGET = f"http://127.0.0.1:{NODE_PORT}"
BACKEND_DIR = Path(__file__).resolve().parent

logging.basicConfig(level=logging.INFO, format="[shim] %(message)s")
log = logging.getLogger("shim")


async def _wait_until_ready(client: httpx.AsyncClient, attempts: int = 60) -> bool:
    for _ in range(attempts):
        try:
            r = await client.get(f"{NODE_TARGET}/api/health", timeout=1.0)
            if r.status_code == 200:
                return True
        except Exception:
            pass
        await asyncio.sleep(0.5)
    return False


def _spawn_node() -> subprocess.Popen:
    log.info("starting node server.js on port %s", NODE_PORT)
    env = os.environ.copy()
    env["PORT"] = str(NODE_PORT)
    return subprocess.Popen(
        ["node", "server.js"],
        cwd=str(BACKEND_DIR),
        env=env,
        stdout=None,
        stderr=None,
        preexec_fn=os.setsid,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    proc = _spawn_node()
    app.state.node_proc = proc
    app.state.client = httpx.AsyncClient(timeout=30.0)
    ready = await _wait_until_ready(app.state.client)
    if not ready:
        log.warning("node API did not become ready in time — proxy will retry on demand")
    else:
        log.info("node API ready at %s", NODE_TARGET)
    try:
        yield
    finally:
        await app.state.client.aclose()
        if proc.poll() is None:
            try:
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
                proc.wait(timeout=10)
            except Exception:
                try:
                    os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
                except Exception:
                    pass


app = FastAPI(lifespan=lifespan)

HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
}


@app.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(path: str, request: Request) -> Response:
    client: httpx.AsyncClient = app.state.client
    url = f"{NODE_TARGET}/{path}"
    if request.url.query:
        url = f"{url}?{request.url.query}"

    headers = {
        k: v for k, v in request.headers.items() if k.lower() not in HOP_HEADERS
    }
    body = await request.body()

    try:
        upstream = await client.request(
            request.method,
            url,
            content=body,
            headers=headers,
            follow_redirects=False,
        )
    except httpx.RequestError as exc:
        log.error("upstream error: %s", exc)
        return Response(
            content=b'{"detail":"API not reachable"}',
            status_code=502,
            media_type="application/json",
        )

    response_headers = {
        k: v for k, v in upstream.headers.items() if k.lower() not in HOP_HEADERS
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
        media_type=upstream.headers.get("content-type"),
    )
