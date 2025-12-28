# Covered: AI Radio Agent - System Architecture

## Overview
"Covered" is an AI-powered radio agent system that curates emails into engaging audio segments. It features a Python backend for content generation and a Next.js frontend for the listening experience.

## Architecture

### Backend (Python)
The backend is a CLI-driven application responsible for the data pipeline.

*   **Entry Point**: `backend/main.py`
    *   Handles CLI commands (`curate`, `segment`).
    *   Orchestrates the flow between services.
*   **Services** (`backend/services/`):
    *   `EmailService`: Generates mock emails to simulate user input.
    *   `LLMService`: Uses LLMs (or fallbacks) to convert email content into radio scripts.
    *   `TTSService`: Synthesizes audio from scripts using VibeVoice (or fallback).
*   **Models** (`backend/models/data.py`):
    *   Defines Pydantic models for `Email`, `Topic`, `Segment`, and `ScriptOutput`.
*   **Data Storage** (`data/`):
    *   JSON files serve as the database (`topics.json`, `processed_topics.json`, `segments/*.json`).
    *   Audio files are stored in `data/audio/`.

### Frontend (Next.js)
The frontend is a modern, responsive web application for consuming the radio stream.

*   **Main Page**: `frontend/app/page.tsx`
    *   Manages application state (playback, queue, selection).
    *   Fetches data using `swr` for real-time updates.
*   **Components**:
    *   `Visualizer.tsx`: HTML5 Canvas audio visualizer.
        *   **Style**: Vertical bars with smoothing and gradient fills.
        *   **Features**: Idle animation, active frequency analysis, click-to-mute.
    *   `TopicModal.tsx`: Modal for displaying detailed topic information (Sender, Context).
    *   `Logo.tsx`: SVG logo component.
*   **Styling**:
    *   Tailwind CSS with a "Smooth/Fun New Media" aesthetic (Light mode, gradients, blur effects).

## Data Flow

1.  **Curation**: `python main.py curate`
    *   Generates emails -> Filters/Sorts (FIFO) -> Saves to `topics.json`.
2.  **Segmentation**: `python main.py segment`
    *   Picks next topic -> Generates Script -> Generates Audio -> Saves `segment.json` & `.wav`.
3.  **Consumption**: Frontend
    *   Polls `current_segment.json`.
    *   Plays audio and renders visualizer.
    *   Displays "Up Next" queue from `topics.json`.

## Key Features
*   **FIFO Curation**: Processes oldest emails first.
*   **Live Visualizer**: Reacts to audio frequency data with smooth interpolation.
*   **Interactive UI**: Clickable topics reveal sender details; visualizer toggles mute.
*   **State Management**: Tracks processed topics to avoid repetition.
