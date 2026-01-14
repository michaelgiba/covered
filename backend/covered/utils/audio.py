import subprocess


def convert_to_m4a(wav_path: str, output_path: str):
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        wav_path,
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        output_path,
    ]
    # Allow ffmpeg to fail and raise exception
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
