import os
import aiohttp_cors
from aiohttp import web
import logging
import json
import json
from covered.config import DATA_DIR, SERVER_HOST, SERVER_PORT
from covered.models.database import Database

logger = logging.getLogger("SYSTEM")


async def handle_topics_json(request):
    try:
        db = Database()
        topics = db.get_all_topics()
        # Convert to list of dicts
        topics_data = [t.model_dump() for t in topics]
        return web.json_response(topics_data)
    except Exception as e:
        logger.error(f"Error serving topics.json: {e}", exc_info=True)
        return web.Response(status=500, text="Internal Server Error")


async def start_server():
    app = web.Application()

    # Configure CORS
    cors = aiohttp_cors.setup(
        app,
        defaults={
            "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
            )
        },
    )

    # Serve DATA_DIR at /data
    os.makedirs(DATA_DIR, exist_ok=True)

    # Custom handler for topics.json to read from DB
    # We place this before static to take precedence
    topics_resource = app.router.add_get("/data/topics.json", handle_topics_json)
    cors.add(topics_resource)

    # Add static route for other files (media etc)
    # Note: If topic.json existed on disk, static would serve it if defined first,
    # but we defined dynamic first.
    resource = app.router.add_static("/data", DATA_DIR)

    # Add CORS to the static resource
    cors.add(resource)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, SERVER_HOST, SERVER_PORT)
    await site.start()
    logger.info(f"HTTP Server started at http://{SERVER_HOST}:{SERVER_PORT}/data")
    return runner
