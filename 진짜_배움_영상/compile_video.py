import os
import math
import subprocess
import shutil
import soundfile as sf
from PIL import Image, ImageFilter, ImageDraw, ImageFont

def render_slide_frame(slide_idx, t_rel, slide_duration, img_dir, width=1920, height=1080):
    img_path = os.path.join(img_dir, f"slide_{slide_idx+1}.webp")
    if not os.path.exists(img_path):
        print(f"Error: {img_path} does not exist!")
        return Image.new("RGB", (width, height), (0,0,0))
        
    orig_img = Image.open(img_path).convert("RGB")
    
    # Square size is 1024x1024.
    # Scale width to 1920 -> height becomes 1920.
    scaled_w = width
    scaled_h = int(1024 * (width / 1024)) # 1920
    scaled_img = orig_img.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
    
    progress = min(1.0, t_rel / slide_duration)
    
    # Determine animation type based on slide index
    anim_type = slide_idx % 4
    
    if anim_type == 0:
        # 1. Pan Down (top to bottom)
        max_y = scaled_h - height # 1920 - 1080 = 840
        y = int(max_y * 0.2 + max_y * 0.6 * progress) # Panning from 20% height to 80% height
        frame_img = scaled_img.crop((0, y, width, y + height))
    elif anim_type == 1:
        # 2. Pan Up (bottom to top)
        max_y = scaled_h - height # 840
        y = int(max_y * 0.8 - max_y * 0.6 * progress) # Panning from 80% down to 20%
        frame_img = scaled_img.crop((0, y, width, y + height))
    elif anim_type == 2:
        # 3. Zoom In (centered zoom)
        scale = 1.0 + 0.08 * progress
        scaled_zoom_w = int(width * scale)
        scaled_zoom_h = int(scaled_h * scale)
        zoom_img = orig_img.resize((scaled_zoom_w, scaled_zoom_h), Image.Resampling.LANCZOS)
        
        left = (scaled_zoom_w - width) // 2
        top = (scaled_zoom_h - height) // 2
        frame_img = zoom_img.crop((left, top, left + width, top + height))
    else:
        # 4. Zoom Out (centered zoom out)
        scale = 1.08 - 0.08 * progress
        scaled_zoom_w = int(width * scale)
        scaled_zoom_h = int(scaled_h * scale)
        zoom_img = orig_img.resize((scaled_zoom_w, scaled_zoom_h), Image.Resampling.LANCZOS)
        
        left = (scaled_zoom_w - width) // 2
        top = (scaled_zoom_h - height) // 2
        frame_img = zoom_img.crop((left, top, left + width, top + height))
        
    return frame_img

def render_text_card(lines, progress, width=1920, height=1080):
    # Dark blue-grey background
    card = Image.new("RGB", (width, height), (10, 14, 22))
    
    # Vignette shadow overlay (draw a simple radial gradient)
    draw = ImageDraw.Draw(card)
    
    # Load batang/malgun font
    font_path = r"C:\Windows\Fonts\batang.ttc"
    if not os.path.exists(font_path):
        font_path = r"C:\Windows\Fonts\malgun.ttf"
        
    try:
        font_main = ImageFont.truetype(font_path, 48)
    except:
        font_main = None
        
    y_start = height // 2 - len(lines) * 45
    
    # Calculate opacity
    opacity = 255
    if progress < 0.15:
        opacity = int(255 * (progress / 0.15))
    elif progress > 0.85:
        opacity = int(255 * ((1.0 - progress) / 0.15))
        
    for idx, line in enumerate(lines):
        if font_main:
            try:
                bbox = draw.textbbox((0, 0), line, font=font_main)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]
            except:
                text_w = len(line) * 24
                text_h = 48
        else:
            text_w = len(line) * 24
            text_h = 48
            
        x = (width - text_w) // 2
        y = y_start + idx * 100
        
        color = (245, 243, 237, opacity)
        
        if font_main:
            # Render with transparent alpha layer
            txt_layer = Image.new("RGBA", (width, height), (0,0,0,0))
            txt_draw = ImageDraw.Draw(txt_layer)
            txt_draw.text((x, y), line, fill=color, font=font_main)
            card = Image.alpha_composite(card.convert("RGBA"), txt_layer).convert("RGB")
        else:
            draw.text((x, y), line, fill=(245, 243, 237))
            
    return card

def main():
    print("Starting cinematic video compilation script...")
    
    project_dir = r"C:\Claude\연라이프\진짜_배움_영상"
    img_dir = os.path.join(project_dir, "img")
    audio_dir = os.path.join(project_dir, "audio")
    video_dir = os.path.join(project_dir, "video")
    
    temp_frames_dir = os.path.join(project_dir, "temp_frames")
    os.makedirs(temp_frames_dir, exist_ok=True)
    
    temp_audio = os.path.join(audio_dir, "narration.wav")
    output_video = os.path.join(video_dir, "진짜_배움.mp4")
    
    # 1. Parse slide audio durations
    slide_keys = ["student", "couple", "busker", "family", "glitch", "tsunami", "absorb", "realization", "connecting", "pixel"]
    slide_infos = []
    current_time = 0.0
    
    for idx in range(10):
        audio_path = os.path.join(audio_dir, f"slide_{idx+1}.wav")
        if not os.path.exists(audio_path):
            print(f"Error: {audio_path} does not exist! Run narration generation first.")
            return
            
        info = sf.info(audio_path)
        audio_dur = info.duration
        slide_dur = audio_dur + 0.8  # Add 0.8s pause for dramatic pacing
        
        slide_infos.append({
            "index": idx,
            "img": f"slide_{idx+1}.webp",
            "audio_duration": audio_dur,
            "duration": slide_dur,
            "start_time": current_time,
            "end_time": current_time + slide_dur
        })
        print(f"Slide {idx+1} ({slide_keys[idx]}): Audio={audio_dur:.2f}s, Total={slide_dur:.2f}s")
        current_time += slide_dur
        
    narration_duration = current_time
    print(f"Total narration duration: {narration_duration:.2f} seconds")
    
    # 2. Add ending text cards duration (9 seconds total)
    card1_lines = ["“지식은 인공지능이 채울 것이다.”", "“그렇다면 인간은 무엇을 준비해야 하는가?”"]
    card2_lines = ["“우리가 진짜 공부해야 할 것은,”", "“기계가 결코 배울 수 없는 ‘인간으로 살아가는 법’이다.”"]
    
    ending_cards = [
        {"lines": card1_lines, "duration": 4.0, "start_time": narration_duration, "end_time": narration_duration + 4.0},
        {"lines": card2_lines, "duration": 5.0, "start_time": narration_duration + 4.0, "end_time": narration_duration + 9.0}
    ]
    
    total_duration = narration_duration + 9.0
    fps = 30
    total_frames = int(total_duration * fps)
    print(f"Total video duration (including ending cards): {total_duration:.2f} seconds ({total_frames} frames)")
    
    # Render frames
    print("Rendering animated frames...")
    transition_dur = 0.5  # 0.5s cross-fade
    
    for f in range(total_frames):
        t = f / fps
        
        if t < narration_duration:
            # Determine active slide
            slide_idx = None
            for i, s in enumerate(slide_infos):
                if s["start_time"] <= t < s["end_time"]:
                    slide_idx = i
                    break
            if slide_idx is None:
                slide_idx = len(slide_infos) - 1
                
            curr_slide = slide_infos[slide_idx]
            t_rel = t - curr_slide["start_time"]
            
            # Render frame
            frame_img = render_slide_frame(slide_idx, t_rel, curr_slide["duration"], img_dir)
            
            # Cross-fade transition to next slide
            time_to_end = curr_slide["end_time"] - t
            if time_to_end <= transition_dur and slide_idx + 1 < len(slide_infos):
                next_slide = slide_infos[slide_idx + 1]
                next_frame_img = render_slide_frame(slide_idx + 1, 0.0, next_slide["duration"], img_dir)
                
                alpha = (transition_dur - time_to_end) / transition_dur
                frame_img = Image.blend(frame_img, next_frame_img, alpha)
                
            # Cross-fade to first ending card at the very end of slide 10
            elif time_to_end <= transition_dur and slide_idx + 1 == len(slide_infos):
                next_card_img = render_text_card(ending_cards[0]["lines"], 0.0)
                alpha = (transition_dur - time_to_end) / transition_dur
                frame_img = Image.blend(frame_img, next_card_img, alpha)
                
        else:
            # Render ending text cards
            card_idx = None
            for i, c in enumerate(ending_cards):
                if c["start_time"] <= t < c["end_time"]:
                    card_idx = i
                    break
            if card_idx is None:
                card_idx = len(ending_cards) - 1
                
            curr_card = ending_cards[card_idx]
            t_rel = t - curr_card["start_time"]
            
            progress = t_rel / curr_card["duration"]
            frame_img = render_text_card(curr_card["lines"], progress)
            
            # Cross-fade between ending cards
            time_to_end = curr_card["end_time"] - t
            if time_to_end <= transition_dur and card_idx + 1 < len(ending_cards):
                next_card = ending_cards[card_idx + 1]
                next_frame_img = render_text_card(next_card["lines"], 0.0)
                
                alpha = (transition_dur - time_to_end) / transition_dur
                frame_img = Image.blend(frame_img, next_frame_img, alpha)
                
        # Save frame
        frame_path = os.path.join(temp_frames_dir, f"frame_{f:04d}.jpg")
        frame_img.save(frame_path, "JPEG", quality=93)
        
        if f % 300 == 0:
            print(f"  Rendered frame {f}/{total_frames}...")
            
    print("All frames rendered successfully! Compiling final video with ffmpeg...")
    
    # Compile with ffmpeg
    compile_cmd = [
        "ffmpeg", "-y", "-framerate", str(fps), "-i",
        os.path.join(temp_frames_dir, "frame_%04d.jpg"),
        "-i", temp_audio,
        "-filter_complex", f"[1:a]apad=whole_dur={total_duration}[a]",
        "-map", "0:v", "-map", "[a]",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest", output_video
    ]
    
    subprocess.run(compile_cmd, check=True)
    print(f"Cinematic video compiled successfully at: {output_video}!")
    
    # Clean up
    print("Cleaning up temp frames...")
    for f in range(total_frames):
        try:
            os.remove(os.path.join(temp_frames_dir, f"frame_{f:04d}.jpg"))
        except:
            pass
    try:
        os.rmdir(temp_frames_dir)
    except:
        pass
    print("Cleanup completed. Done!")

if __name__ == "__main__":
    main()
