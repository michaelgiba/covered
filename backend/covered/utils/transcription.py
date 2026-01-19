import os
import logging
import gc
import json

logger = logging.getLogger("TRANSCRIPTION")


class TranscriptionService:
    def __init__(self):
        # Strictly use CPU
        self.device = "cpu"
        self.model = None

    def _load_model(self):
        if self.model is None:
            # Force CPU usage for NeMo/Torch by hiding GPU
            os.environ["CUDA_VISIBLE_DEVICES"] = ""

            import torch
            import nemo.collections.asr as nemo_asr

            logger.info("Loading Parakeet TDT model (CPU)...")

            # Load the model directly without try/except
            self.model = nemo_asr.models.EncDecRNNTBPEModel.from_pretrained(
                model_name="nvidia/parakeet-tdt-0.6b-v2",
                map_location=torch.device("cpu"),
            )

            # Move model to device (CPU)
            self.model = self.model.to(self.device)
            self.model.eval()
            logger.info("Model loaded.")

    def transcribe(self, audio_path: str):
        """
        Transcribes the audio file and returns the result with word-level timestamps.
        """
        self._load_model()
        logger.info(f"Transcribing {audio_path}...")

        # Transcribe directly without try/except
        output = self.model.transcribe([audio_path], timestamps=True)

        # word_timestamps = output[0][0].timestep['word'] # word level timestamps for first sample
        # char_timestamps = output[0][0].timestep['char'] # char level timestamps for first sample
        segment_timestamps = output[0][0].timestep[
            "segment"
        ]  # segment level timestamps for first sample

        return {"segments": segment_timestamps}

    def cleanup(self):
        """Releases GPU memory."""
        if self.model:
            del self.model
            self.model = None
        gc.collect()
