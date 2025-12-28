# Covered


Simple website which shows the current thing being covered/discussed with a voice agent talking.

Anyone can vote on what to cover by sending an email to <vote@covered-radio.ai> 

# Architecture

## Offline Data

Most important things:
- Next item to cover 
- All messages from the past 24 hours are bucketed
- The message with the most votes that has not yet been covered is picked up

## Show data
Given a thing to cover, generates audio/transcript and animation constants which will be used to stream the playback in a browser


## Components

# CLIs
1. Curate CLI: Given the email inbox pulls the items from the last 24 hours and produces a vote list of (topic, vote_count)
2. Segment CLI: Given a topic generates an audio file,transcript and any information the frontend needs to display this info

Tech stack:
- Python3 (with uv/requests)
- VibeVoice: https://github.com/microsoft/VibeVoice

# Frontend
1. Single page application which shows:
    - A satisfying animated circle in the center of the page which animates when speech happens
    - The title of the current topic being discussed is just under the square
    - A table with the current topics on deck and how many votes

Tech stack:
- Next js
- Framer motion
- Web audio API
