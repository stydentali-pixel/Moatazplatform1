"""
Reverse proxy from FastAPI (port 8001) -> Next.js (port 3000).

The Kubernetes ingress routes /api/* to port 8001. Since the user picked
Next.js as the full-stack framework, the API routes live inside Next.js.
This proxy forwards every request received on :8001 to the Next.js process
running on :3000 so Next.js handles both API and pages cleanly.
"""
import os
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse

NEXT_URL = os.environ.get("NEXT_INTERNAL_URL", "http://localhost:3000")

app = FastAPI(title="Moataz Platform Proxy")

# Long-lived async client for performance
client = httpx.AsyncClient(base_url=NEXT_URL, timeout=httpx.Timeout(60.0))

HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade", "content-encoding",
    "content-length",
}


@app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy(full_path: str, request: Request):
    target_path = "/" + full_path
    if request.url.query:
        target_path += "?" + request.url.query

    headers = {k: v for k, v in request.headers.items() if k.lower() not in {"host"}}
    body = await request.body()

    try:
        upstream = await client.request(
            request.method,
            target_path,
            content=body,
            headers=headers,
            cookies=request.cookies,
            follow_redirects=False,
        )
    except httpx.ConnectError:
        return Response(
            content="Next.js is starting up, please retry in a moment.",
            status_code=503,
            media_type="text/plain",
        )

    resp_headers = {k: v for k, v in upstream.headers.items() if k.lower() not in HOP_BY_HOP}
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=resp_headers,
        media_type=upstream.headers.get("content-type"),
    )


@app.on_event("shutdown")
async def shutdown():
    await client.aclose()
