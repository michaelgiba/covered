import os
import aiohttp_cors
from aiohttp import web
import logging
from covered.config import DATA_DIR, SERVER_HOST, SERVER_PORT

logger = logging.getLogger("SYSTEM")

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
    
    # Add static route
    resource = app.router.add_static("/data", DATA_DIR)
    
    # Add CORS to the static resource
    cors.add(resource)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, SERVER_HOST, SERVER_PORT)
    await site.start()
    logger.info(f"HTTP Server started at http://{SERVER_HOST}:{SERVER_PORT}/data")
    return runner
