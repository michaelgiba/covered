from flask import Flask, send_from_directory
from flask_rebar import Rebar, errors
from flask_cors import CORS
import logging
import os

from covered.config import DATA_DIR, SERVER_HOST, SERVER_PORT, configure_logging
from covered.models.database import Database
from covered.models.data import ProcessedInput, PlaybackContent, Topic
from covered.utils.queue import QueueService
from covered.api.schemas import (
    ProcessedInputSchema,
    PlaybackContentSchema,
    TopicSchema,
    TopicListSchema,
)

configure_logging()
logger = logging.getLogger("MAIN_SERVICE")

rebar = Rebar()
registry = rebar.create_handler_registry()


def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes

    @app.route("/data/<path:filename>")
    def serve_data(filename):
        return send_from_directory(DATA_DIR, filename)

    rebar.init_app(app)
    return app


@registry.handles(
    rule="/processed-inputs",
    method="POST",
    request_body_schema=ProcessedInputSchema(),
    response_body_schema=ProcessedInputSchema(),
)
def create_processed_input():
    body = rebar.validated_body

    p_input = ProcessedInput(**body)

    db = Database()
    db.upsert_processed_input(p_input)

    queue = QueueService()
    queue.push(p_input.id)

    return body


@registry.handles(
    rule="/processed-inputs/<input_id>",
    method="GET",
    response_body_schema=ProcessedInputSchema(),
)
def get_processed_input(input_id):
    db = Database()
    p_input = db.get_processed_input(input_id)
    if not p_input:
        raise errors.NotFound()

    return p_input.model_dump()


@registry.handles(
    rule="/playback-contents",
    method="POST",
    request_body_schema=PlaybackContentSchema(),
    response_body_schema=PlaybackContentSchema(),
)
def create_playback_content():
    body = rebar.validated_body

    playback = PlaybackContent(**body)

    db = Database()
    db.upsert_topic_playback(playback.processed_input_id, playback)

    return body


@registry.handles(
    rule="/topics",
    method="GET",
    response_body_schema=TopicListSchema(),
)
def get_topics():
    db = Database()
    topics = db.get_all_topics()

    # Convert Pydantic models to list of dicts for Marshmallow
    return {"topics": [t.model_dump() for t in topics]}


def main():
    logger.info("Starting Main Service (API)...")
    app = create_app()
    app.run(host=SERVER_HOST, port=SERVER_PORT, debug=True, use_reloader=False)


if __name__ == "__main__":
    main()
