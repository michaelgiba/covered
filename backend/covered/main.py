import argparse
import asyncio
import logging
import time
from covered.config import configure_logging
from covered.tasks.curation import curation_loop
from covered.tasks.processing import processing_loop
from covered.tasks.web_server import start_server

# Configure Logging
configure_logging()
system_logger = logging.getLogger("SYSTEM")

async def run_loop(target_duration: int | None):
    start_time = time.time()
    
    # Shared state
    processing_ids = set()

    # Create tasks
    curation_task = asyncio.create_task(curation_loop())
    processing_task = asyncio.create_task(processing_loop(processing_ids))
    
    # Start Server
    server_runner = await start_server()

    tasks = [curation_task, processing_task]

    try:
        if target_duration is not None:
            while True:
                elapsed = time.time() - start_time
                if elapsed >= target_duration:
                    system_logger.info(f"Minimum duration of {target_duration}s reached. Exiting.")
                    break
                await asyncio.sleep(1)

            # Cancel tasks
            for task in tasks:
                task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)
            
            # Cleanup server
            await server_runner.cleanup()

        else:
            # Run forever
            await asyncio.gather(*tasks)

    except asyncio.CancelledError:
        system_logger.info("Tasks cancelled.")

def main():
    parser = argparse.ArgumentParser(description="Covered Backend CLI")
    parser.add_argument(
        "--duration",
        type=int,
        default=None,
        help="Minimum duration to run in seconds. If not specified, runs forever.",
    )

    args = parser.parse_args()

    try:
        asyncio.run(run_loop(args.duration))
    except KeyboardInterrupt:
        system_logger.info("\nStopped by user.")

if __name__ == "__main__":
    main()
