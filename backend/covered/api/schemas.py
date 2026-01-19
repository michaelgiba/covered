from marshmallow import Schema, fields

class ProcessedInputSchema(Schema):
    id = fields.Str(required=True)
    timestamp = fields.Str(required=True)
    title = fields.Str(required=True)
    content = fields.Str(required=True)
    extracted_link = fields.Str(allow_none=True)
    sender = fields.Str(allow_none=True)

class PlaybackContentSchema(Schema):
    id = fields.Str(required=True)
    processed_input_id = fields.Str(required=True)
    page_snapshot_url = fields.Str(required=True)
    thumbnail_url = fields.Str(allow_none=True)
    script_json_url = fields.Str(required=True)
    m4a_file_url = fields.Str(required=True)

class TopicSchema(Schema):
    id = fields.Str(required=True)
    timestamp = fields.Str(required=True)
    processed_input = fields.Nested(ProcessedInputSchema, required=True)
    playback_content = fields.Nested(PlaybackContentSchema, allow_none=True)

class TopicListSchema(Schema):
    topics = fields.List(fields.Nested(TopicSchema), required=True)
