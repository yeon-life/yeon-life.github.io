import os
import sys
from pathlib import Path
import numpy as np
import soundfile as sf

def main():
    print("Initializing SuperTonic TTS...")
    
    # Try importing supertonic
    try:
        from supertonic import TTS as SuperTonicTTS
    except ImportError:
        print("Error: supertonic package not found in this environment.")
        sys.exit(1)
        
    tts = SuperTonicTTS(auto_download=True)
    print("Model loaded successfully!")
    
    # Load the yuchi_female preset (Cheerfulness blend of 70% F2 + 30% F5)
    custom_path = Path.home() / ".cache" / "supertonic3" / "custom_styles" / "yuchi_female.json"
    if custom_path.exists():
        print("Loading yuchi_female preset from cache...")
        style = tts.get_voice_style_from_path(custom_path)
    else:
        print("yuchi_female not found in cache. Blending inline...")
        f2 = tts.get_voice_style("F2")
        f5 = tts.get_voice_style("F5")
        style = f5
        style.ttl = f2.ttl * 0.7 + f5.ttl * 0.3
        style.dp = f2.dp * 0.7 + f5.dp * 0.3
    
    # Narration text for the 8 slides
    segments = [
        # Slide 1: Cover
        "안녕하세요, 친구들! 오늘은 어린이의 결 창간호를 함께 읽어볼 거예요. 재미있고 유익한 일곱 가지 모험이 기다리고 있으니 귀를 쫑긋 세우고 함께 출발해 볼까요?",
        
        # Slide 2: Math (Shape park)
        "첫 번째 모험은 모양 나라 놀이공원이에요! 떼구루루 잘 구르는 둥근 동그라미, 뾰족하지만 위에서 꾹 눌러도 부서지지 않는 튼튼한 세모, 그리고 차곡차곡 높이 쌓을 수 있는 네모 친구를 만나 모양 찾기 모험을 떠나봐요.",
        
        # Slide 3: Hangeul (Mimicking words)
        "두 번째는 말놀이 보물찾기 시간이에요! 토끼처럼 깡충깡충 뛰어보고, 개울물처럼 졸졸졸 노래해 봐요. 반짝반짝 빛나고 싱글벙글 웃음 짓는 우리말의 예쁜 소리와 모양 흉내말들을 모아볼까요?",
        
        # Slide 4: English (Animal sounds)
        "세 번째는 영어 소리나라예요! 미국 아기 강아지는 멍멍 대신 바우와우, 우프 하고 짖는대요. 오리는 쿽쿽, 고양이는 미아오 하고 소리 낸답니다. 몸짓과 리듬을 타며 신나게 영어 소리를 따라 해 보세요.",
        
        # Slide 5: Future & AI (Robot Pipo safety)
        "네 번째는 똑똑한 로봇 친구 삐뽀를 만나는 시간이에요! 삐뽀와 다정하게 인사하고 놀되, 소중한 개인정보인 진짜 이름 and 집 주소, 부모님 연락처는 비밀로 지키기로 약속해요. 삐뽀가 이상한 말을 하면 엄마에게 꼭 달려가기로 해요.",
        
        # Slide 6: Fairytale (Cotton candy cloud)
        "다섯 번째는 하늘나라 솜사탕이 되고 싶었던 꼬마 구름이 동화예요. 알록달록 솜사탕은 되지 못했지만, 목마른 새싹들을 구하기 위해 멋진 비구름으로 변신해 시원한 비를 뿌려준 구름이의 행복한 이야기를 들어보아요.",
        
        # Slide 7: Habit (Treasure map)
        "여섯 번째는 우리 아이 공부 습관을 길러주는 칭찬 보물지도 만들기예요. 아이가 스스로 선장이 되어 매일 쉬운 약속 세 가지를 보물 상자에 넣고, 성공할 때마다 별표 스티커를 붙이며 행복한 성취감을 느끼게 도와주세요.",
        
        # Slide 8: Parents (Conversation tips)
        "마지막 일곱 번째는 아이의 자존감과 생각의 힘을 높여주는 다정한 부모 대화법이에요. 오늘 뭐 배웠니 하는 질문 대신, 오늘 가장 신나서 웃었던 한 순간은 언제였니 하고 감정을 읽어주는 열린 대화로 아이와 소통해 보세요."
    ]
    
    sample_rate = tts.sample_rate
    audio_dir = Path(r"c:\Claude\연라이프\scratch\audio")
    audio_dir.mkdir(exist_ok=True, parents=True)
    
    final_wav_list = []
    inter_slide_silence = int(0.5 * sample_rate)  # 0.5s pause between slides
    silence_padding = np.zeros(inter_slide_silence, dtype=np.float32)
    
    for idx, text in enumerate(segments):
        print(f"Synthesizing segment {idx+1}/{len(segments)}...")
        wav, duration = tts.synthesize(
            text=text,
            voice_style=style,
            lang="ko",
            total_steps=8,
            speed=1.03,  # Energetic kindergarten teacher speed
            silence_duration=0.2,
        )
        wav_squeezed = wav.squeeze()
        duration_sec = len(wav_squeezed) / sample_rate
        print(f"  Segment {idx+1} length: {duration_sec:.2f} seconds")
        
        # Save individual slide audio
        slide_path = audio_dir / f"slide_{idx+1}.wav"
        sf.write(str(slide_path), wav_squeezed, sample_rate, format="WAV", subtype="PCM_16")
        
        if idx > 0:
            final_wav_list.append(silence_padding)
        final_wav_list.append(wav_squeezed)
        
    final_wav = np.concatenate(final_wav_list)
    combined_path = r"c:\Claude\연라이프\scratch\yuchi_narration.wav"
    sf.write(combined_path, final_wav, sample_rate, format="WAV", subtype="PCM_16")
    print(f"Narration audio generated and saved to {combined_path}!")

if __name__ == "__main__":
    main()
