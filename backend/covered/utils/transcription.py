import os
import logging
import torch
import gc
import json
import nemo.collections.asr as nemo_asr

logger = logging.getLogger("TRANSCRIPTION")

class TranscriptionService:
    def __init__(self):
        # Always assume CUDA as requested
        self.device = "cuda"
        self.model = None

    def _load_model(self):
        if self.model is None:
            logger.info(f"Loading Parakeet TDT model on {self.device}...")
            # Load the model directly without try/except
            self.model = nemo_asr.models.ASRModel.from_pretrained(model_name="nvidia/parakeet-tdt-0.6b-v2")
            
            # Assume cuda support and move model
            self.model = self.model.cuda()
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
        segment_timestamps = output[0][0].timestep['segment'] # segment level timestamps for first sample

        
        return {"segments": segment_timestamps}

    def cleanup(self):
        """Releases GPU memory."""
        if self.model:
            del self.model
            self.model = None
        gc.collect()
        torch.cuda.empty_cache()
