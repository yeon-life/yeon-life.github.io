import os
import sys
from pathlib import Path
import numpy as np
import soundfile as sf

def main():
    print("Initializing SuperTonic TTS...")
    
    try:
        from supertonic import TTS as SuperTonicTTS
    except ImportError:
        print("Error: supertonic package not found in this environment.")
        sys.exit(1)
        
    tts = SuperTonicTTS(auto_download=True)
    print("Model loaded successfully!")
    
    # Load grandfather preset (60% M2 + 40% M5 for a wise, older storyteller voice)
    custom_path = Path.home() / ".cache" / "supertonic3" / "custom_styles" / "grandfather.json"
    if custom_path.exists():
        print("Loading grandfather preset from cache...")
        style = tts.get_voice_style_from_path(custom_path)
    else:
        print("grandfather not found in cache. Blending inline...")
        m2 = tts.get_voice_style("M2")
        m5 = tts.get_voice_style("M5")
        style = m5
        style.ttl = m2.ttl * 0.6 + m5.ttl * 0.4
        style.dp = m2.dp * 0.6 + m5.dp * 0.4
        
    segments = [
        "우리는 평생 동안 지식을 채우고 기술을 익히는 일에 매달려 왔습니다.",
        "누가 더 옳은가를 증명하기 위해 사소한 자존심과 논리로 갈등을 나누기도 했지요.",
        "완벽한 기술과 박자, 오차 없는 정교함만을 연습하며 메트로놈 같은 삶을 살아왔습니다.",
        "하지만 진짜 배움은 다른 곳에 있었습니다. 무너진 모래성 앞에서 다시 일어서는 법을, 실패를 유쾌하게 마주하는 회복탄력성을 말이죠.",
        "우리가 눈앞의 사소한 집착에 몰두하는 동안, 거대한 침묵 속에서 세상은 조용히 균열을 내기 시작했습니다.",
        "그리고 마침내, 우리가 쌓아 올린 지식을 단숨에 삼켜버릴 거대한 인공지능의 쓰나미가 들이닥쳤습니다.",
        "우리가 일평생을 외워야 했던 전공서적도, 완벽하게 가다듬은 연주법도, 그 기계에게는 단 1초짜리 데이터의 나열에 불과했습니다.",
        "우리가 쌓아 온 평생의 노력이 한순간에 지워지는 광경 앞에서, 인류는 비로소 깊은 침묵에 빠졌습니다.",
        "파도가 덮치기 직전, 우리는 마지막 선택을 합니다. 논쟁을 멈추고 서로를 용서하며 안아주는 것. 무의미해진 책장을 덮고, 아이에게 공포가 아닌 사랑을 비춰주는 것.",
        "모든 지식과 사물이 코드로 분해되어 집어삼켜진 자리. 하지만 마지막 순간 우리가 나누었던 온기와 사랑만큼은, 기계가 배울 수 없는 따뜻한 잔상으로 길게 남았습니다."
    ]
    
    project_dir = Path(r"C:\Claude\연라이프\진짜_배움_영상")
    audio_dir = project_dir / "audio"
    audio_dir.mkdir(exist_ok=True, parents=True)
    
    sample_rate = tts.sample_rate
    final_wav_list = []
    
    # Add 0.8s pause between scenes for dramatic pacing
    inter_slide_silence = int(0.8 * sample_rate)
    silence_padding = np.zeros(inter_slide_silence, dtype=np.float32)
    
    for idx, text in enumerate(segments):
        print(f"Synthesizing segment {idx+1}/{len(segments)}...")
        wav, duration = tts.synthesize(
            text=text,
            voice_style=style,
            lang="ko",
            total_steps=8,
            speed=0.95,  # Wise, slow storyteller tempo
            silence_duration=0.3,
        )
        wav_squeezed = wav.squeeze()
        duration_sec = len(wav_squeezed) / sample_rate
        print(f"  Segment {idx+1} length: {duration_sec:.2f} seconds")
        
        slide_path = audio_dir / f"slide_{idx+1}.wav"
        sf.write(str(slide_path), wav_squeezed, sample_rate, format="WAV", subtype="PCM_16")
        
        if idx > 0:
            final_wav_list.append(silence_padding)
        final_wav_list.append(wav_squeezed)
        
    final_wav = np.concatenate(final_wav_list)
    combined_path = project_dir / "audio" / "narration.wav"
    sf.write(str(combined_path), final_wav, sample_rate, format="WAV", subtype="PCM_16")
    print(f"Narration audio generated and saved to {combined_path}!")

if __name__ == "__main__":
    main()
