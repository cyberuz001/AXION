"""Composite the original AXION storyboards into seekable, silent web films."""
from pathlib import Path
import math
import subprocess
import sys

import cv2
import numpy as np


WIDTH, HEIGHT, FPS = 1440, 810, 24
FRAME_COUNT = 114
T = np.float32
ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "public" / "media"
X, Y = np.meshgrid(
    np.arange(WIDTH, dtype=T) / WIDTH,
    np.arange(HEIGHT, dtype=T) / HEIGHT,
)
SUBJECT = np.exp(-(((X - 0.58) / 0.27) ** 2 + ((Y - 0.42) / 0.43) ** 2))


def ease(value):
    clipped = np.clip(value, 0, 1)
    return clipped ** 2 * (3 - 2 * clipped)


def read_storyboard(path, bounds):
    story = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    if story is None:
        raise ValueError(f"Could not read storyboard {path}")
    shots = []
    for start, end in bounds:
        top = round(story.shape[0] * start)
        bottom = round(story.shape[0] * end)
        shot = story[top:bottom]
        height, width = shot.shape
        if width / height > WIDTH / HEIGHT:
            cropped = round(height * WIDTH / HEIGHT)
            start_x = min(round((width - cropped) * 0.59), width - cropped)
            shot = shot[:, start_x:start_x + cropped]
        else:
            cropped = round(width * HEIGHT / WIDTH)
            start_y = round((height - cropped) * 0.39)
            shot = shot[start_y:start_y + cropped]
        shots.append(cv2.resize(shot, (WIDTH, HEIGHT), interpolation=cv2.INTER_LANCZOS4))
    return shots


def transform(shot, p, phase, light_stage):
    smooth = ease(p)
    angle = (-0.012, 0.016, -0.01)[phase] * smooth
    scale = 1.055 + (0.135, 0.125, 0.165)[phase] * smooth
    shift_x = (-0.025, 0.029, -0.029)[phase] * smooth
    breathe = math.sin(math.pi * p)
    center_x, center_y = 0.56, 0.42
    dx, dy = X - center_x, Y - center_y
    x = center_x + (dx * math.cos(angle) + dy * math.sin(angle)) / scale
    y = center_y + (dy * math.cos(angle) - dx * math.sin(angle)) / scale
    x += shift_x + SUBJECT * (Y - 0.39) * (0.095, -0.09, 0.062)[phase] * smooth
    y += SUBJECT * (0.014 * breathe - (X - 0.52) * 0.029 * smooth)
    image = cv2.remap(shot, (x * WIDTH).astype(T), (y * HEIGHT).astype(T), cv2.INTER_LINEAR,
                      borderMode=cv2.BORDER_REFLECT_101).astype(T)

    # Veiling light travels across the composition while the foreground and backdrop move independently.
    diagonal = X + Y * 0.24 - (0.04 + 1.3 * p)
    beam = np.exp(-np.square(diagonal / 0.098)) * np.sin(np.pi * p) ** 2
    center = -((X - 0.59) ** 2 + (Y - 0.36) ** 2)
    vignette = np.exp(center * (0.39 if light_stage else 0.77))
    veil = (1 + np.sin((X + Y * 0.24 + p * 0.22) * 15)) * np.exp(-((Y - 0.77) ** 2) * 11)
    if light_stage:
        image = image * vignette + 220 * (1 - vignette) + beam * 20
    else:
        image = image * vignette + veil * 7 + beam * 38
        image *= 0.27 + 0.73 * ease((X - 0.03) / 0.43)
    return np.clip(image, 0, 255)


def composite(shots, progress, light_stage):
    phase = 0 if progress < 0.365 else 1 if progress < 0.685 else 2
    starts = (0.0, 0.32, 0.64)
    ends = (0.39, 0.72, 1.0)

    def render(index):
        position = float(np.clip((progress - starts[index]) / (ends[index] - starts[index]), 0, 1))
        return transform(shots[index], position, index, light_stage)

    for index, boundary in enumerate((0.365, 0.685)):
        if abs(progress - boundary) <= 0.038:
            offset = (progress - boundary + 0.038) / 0.076
            edge = offset * 1.62 - 0.26 - X - Y * 0.13
            blend = ease((edge + 0.095) * 5.6)
            shine = np.exp(-np.square(edge / 0.040)) * math.sin(math.pi * offset) * 34
            left, right = render(index), render(index + 1)
            return np.clip(left * (1 - blend) + right * blend + shine, 0, 255).astype(np.uint8)
    return render(phase).astype(np.uint8)


def export(game, storyboard, bounds):
    shots = read_storyboard(storyboard, bounds)
    output = MEDIA / f"{game}.render.mp4"
    args = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS), "-i", "-",
        "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-g", "4",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output),
    ]
    with subprocess.Popen(args, stdin=subprocess.PIPE) as encoder:
        for frame in range(FRAME_COUNT):
            image = composite(shots, frame / (FRAME_COUNT - 1), game == "valorant")
            encoder.stdin.write(image.tobytes())
        encoder.stdin.close()
        if encoder.wait() != 0:
            raise RuntimeError(f"FFmpeg could not encode {output}")
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(output),
        "-frames:v", "1", "-quality", "86", str(MEDIA / f"{game}.render.webp"),
    ], check=True)
    output.replace(MEDIA / f"{game}.mp4")
    (MEDIA / f"{game}.render.webp").replace(MEDIA / f"{game}.webp")
    print(f"{game}: {FRAME_COUNT} frames, {FPS} fps", flush=True)


if __name__ == "__main__":
    game, source, *cuts = sys.argv[1:]
    if game not in {"cs2", "valorant"}:
        raise ValueError("Game must be cs2 or valorant.")
    edges = [float(cut) for cut in cuts] if cuts else [0, 1 / 3, 2 / 3, 1]
    if len(edges) != 4 or edges != sorted(set(edges)) or not 0 <= edges[0] < edges[-1] <= 1:
        raise ValueError("Pass four increasing storyboard boundaries between 0 and 1.")
    MEDIA.mkdir(parents=True, exist_ok=True)
    export(game, Path(source), list(zip(edges, edges[1:])))
