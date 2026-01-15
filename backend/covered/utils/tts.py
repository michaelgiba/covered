import sys
import os
import torch
# import torchaudio
import json
import numpy as np
import soundfile as sf
import copy
import time

# Add VibeVoice to path
backend_root = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
vibe_voice_path = os.path.join(backend_root, "VibeVoice")
if vibe_voice_path not in sys.path:
    sys.path.append(vibe_voice_path)

from vibevoice.modular.modeling_vibevoice_streaming_inference import (
    VibeVoiceStreamingForConditionalGenerationInference,
)
from vibevoice.processor.vibevoice_streaming_processor import (
    VibeVoiceStreamingProcessor,
)


class TTSService:
    def __init__(self):
        self.device = "cuda"  # if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
        self.model_path = "microsoft/VibeVoice-Realtime-0.5B"
        self.voice_preset_path = os.path.join(
            vibe_voice_path, "demo/voices/streaming_model/en-Carter_man.pt"
        )

        print(f"Initializing VibeVoice on {self.device}...")

        self.processor = VibeVoiceStreamingProcessor.from_pretrained(self.model_path)

        # Use SDPA by default for simplicity and compatibility
        load_dtype = torch.bfloat16  # if self.device == "cuda" else torch.float32

        self.model = (
            VibeVoiceStreamingForConditionalGenerationInference.from_pretrained(
                self.model_path,
                torch_dtype=load_dtype,
                attn_implementation="sdpa",
                device_map=self.device,
            )
        )

        self.model.eval()
        self.model.set_ddpm_inference_steps(num_steps=5)
        print("VibeVoice initialized successfully.")

    def generate_audio(self, text: str, output_path: str) -> None:
        """
        Generates audio for the given text using VibeVoice.
        Saves the audio to the specified output_path.
        """
        # Load voice preset
        all_prefilled_outputs = torch.load(
            self.voice_preset_path, map_location=self.device, weights_only=False
        )

        # Prepare inputs
        inputs = self.processor.process_input_with_cached_prompt(
            text=text,
            cached_prompt=all_prefilled_outputs,
            padding=True,
            return_tensors="pt",
            return_attention_mask=True,
        )

        for k, v in inputs.items():
            if torch.is_tensor(v):
                inputs[k] = v.to(self.device)

        # Generate
        outputs = self.model.generate(
            **inputs,
            max_new_tokens=None,
            cfg_scale=1.5,
            tokenizer=self.processor.tokenizer,
            generation_config={"do_sample": False},
            all_prefilled_outputs=copy.deepcopy(all_prefilled_outputs),
        )

        audio_tensor = outputs.speech_outputs[0].cpu()

        # Save Audio
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

        sample_rate = 24000
        audio_numpy = audio_tensor.float().numpy()
        if len(audio_numpy.shape) > 1:
            audio_numpy = audio_numpy.flatten()

        sf.write(output_path, audio_numpy, sample_rate)
