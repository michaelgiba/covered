#!/bin/bash
set -e

# Clone VibeVoice if not exists
if [ ! -d "VibeVoice" ]; then
    git clone https://github.com/microsoft/VibeVoice.git
fi

# We need to install dependencies. 
# Assuming we are in the backend venv already.
# VibeVoice requirements might conflict, so we'll try to install what's needed.
# Based on VibeVoice repo, we need:
# phonemizer, torchaudio, etc.

pip install phonemizer

# Download model weights
# NOTE: This is a placeholder. Real VibeVoice usage requires downloading weights from HuggingFace or similar.
# For this implementation, we will assume the user has placed weights or we will use a dummy TTS if weights are missing.
# But per plan, we assume local setup.

echo "VibeVoice setup complete (repo cloned)."
echo "Please ensure model weights are in place if required by VibeVoice."
