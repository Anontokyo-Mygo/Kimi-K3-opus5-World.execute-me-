"""
transcribe.py — 用 Whisper 转录 audio.mp3，输出带时间戳的歌词 JSON
用法: python transcribe.py
输出: transcript.json
"""
import json
import os
import sys

# 把 imageio_ffmpeg 内置二进制复制为 ffmpeg.exe，让 whisper 的 subprocess 能找到
import shutil, tempfile
try:
    import imageio_ffmpeg
    _src = imageio_ffmpeg.get_ffmpeg_exe()
    _tmp = tempfile.mkdtemp(prefix="ffmpeg_")
    _dst = os.path.join(_tmp, "ffmpeg.exe")
    shutil.copy2(_src, _dst)
    os.environ["PATH"] = _tmp + os.pathsep + os.environ.get("PATH", "")
except ImportError:
    pass

import whisper

AUDIO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.mp3")
OUT   = os.path.join(os.path.dirname(__file__), "transcript.json")

print("Loading model 'medium' ...")
model = whisper.load_model("medium")

print(f"Transcribing {AUDIO} ...")
result = model.transcribe(
    AUDIO,
    language="ja",          # 这首曲子是日文，改成 'en' 或 'zh' 可切换
    word_timestamps=True,   # 逐词时间戳
    verbose=True,
)

# 整理成 [{start, end, text}, ...] 的段落列表
segments = [
    {"start": round(s["start"], 2),
     "end":   round(s["end"],   2),
     "text":  s["text"].strip()}
    for s in result["segments"]
]

with open(OUT, "w", encoding="utf-8") as f:
    json.dump({"language": result["language"], "segments": segments}, f,
              ensure_ascii=False, indent=2)

print(f"\nDone. {len(segments)} segments → {OUT}")
