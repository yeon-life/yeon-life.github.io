import os
import subprocess
import shutil
import math
import soundfile as sf
from PIL import Image, ImageFilter, ImageDraw

background_cache = {}

def get_blurred_background(img_path, width=1920, height=1080):
    if img_path in background_cache:
        return background_cache[img_path]
        
    print(f"Pre-rendering blurred background for: {os.path.basename(img_path)}")
    orig_img = Image.open(img_path).convert("RGBA")
    
    # Scale to 1920x1920 to cover screen
    bg_scale_size = 1920
    bg_img = orig_img.resize((bg_scale_size, bg_scale_size), Image.Resampling.LANCZOS)
    
    # Crop to 1920x1080 centered
    left = 0
    top = (bg_scale_size - height) // 2
    bg_cropped = bg_img.crop((left, top, left + width, top + height))
    
    # Apply heavy blur
    bg_blurred = bg_cropped.filter(ImageFilter.GaussianBlur(radius=40))
    bg_rgb = bg_blurred.convert("RGB")
    
    background_cache[img_path] = bg_rgb
    return bg_rgb

def render_slide_frame(slide, t_rel, img_dir, width=1920, height=1080):
    # Show primary image for the first half of narration, and secondary for the rest
    half_speech = slide["audio_duration"] / 2.0
    img_name = slide["img1"] if t_rel < half_speech else slide["img2"]
    img_path = os.path.join(img_dir, img_name)
    
    # Get cached blurred background
    bg_canvas = get_blurred_background(img_path, width, height).copy()
    
    # Load original image for foreground card
    orig_img = Image.open(img_path).convert("RGBA")
    
    # Foreground Floating & Zoom-In: scale from 95% to 100% of standard size (950)
    fg_progress = min(1.0, t_rel / slide["duration"])
    fg_scale = 0.95 + 0.05 * fg_progress
    fg_base_size = 950
    fg_size = int(fg_base_size * fg_scale)
    
    # Vertical float (sine wave: 3.0 seconds period, 15px amplitude)
    fg_y_offset = int(15 * math.sin(2 * math.pi * t_rel / 3.0))
    
    # Resize foreground card
    fg_img = orig_img.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
    
    # Rounded corners mask
    mask = Image.new("L", (fg_size, fg_size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, fg_size, fg_size), radius=int(32 * fg_scale), fill=255)
    
    fg_rounded = Image.new("RGBA", (fg_size, fg_size))
    fg_rounded.paste(fg_img, (0, 0), mask=mask)
    
    fg_x = (width - fg_size) // 2
    fg_y = (height - fg_size) // 2 + fg_y_offset
    
    # Glassmorphic border
    draw_border = ImageDraw.Draw(bg_canvas)
    border_thickness = 4
    draw_border.rounded_rectangle(
        (fg_x - border_thickness, fg_y - border_thickness, fg_x + fg_size + border_thickness, fg_y + fg_size + border_thickness),
        radius=int((32 + border_thickness) * fg_scale),
        outline=(255, 255, 255, 70),
        width=border_thickness
    )
    
    bg_canvas.paste(fg_rounded, (fg_x, fg_y), mask=fg_rounded)
    return bg_canvas

def main():
    print("Starting optimized animated kindergarten promo video compiler...")
    
    workspace_dir = r"c:\Claude\연라이프\yeon-life.github.io\어린이의_결_유치_월간"
    img_dir = os.path.join(workspace_dir, "img")
    video_dir = os.path.join(workspace_dir, "video")
    os.makedirs(video_dir, exist_ok=True)
    
    scratch_dir = r"c:\Claude\연라이프\scratch"
    temp_frames_dir = os.path.join(scratch_dir, "temp_frames_yuchi_final")
    os.makedirs(temp_frames_dir, exist_ok=True)
    
    temp_audio = r"c:\Claude\연라이프\scratch\yuchi_narration.wav"
    output_video = os.path.join(video_dir, "promo_horizontal.mp4")
    dest_video_onedrive = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_유치_월간\video\promo_horizontal.mp4"
    os.makedirs(os.path.dirname(dest_video_onedrive), exist_ok=True)
    
    # Calculate durations based on actual WAV files
    slide_keys = ["cover", "math", "hangeul", "english", "future", "fairytale", "habit", "parents"]
    slide_infos = []
    current_time = 0.0
    
    for idx, key in enumerate(slide_keys):
        audio_path = os.path.join(scratch_dir, "audio", f"slide_{idx+1}.wav")
        if not os.path.exists(audio_path):
            print(f"ERROR: Audio file {audio_path} is missing! Generate narration first.")
            return
            
        info = sf.info(audio_path)
        audio_dur = info.duration
        slide_dur = audio_dur + 0.5  # Add 0.5s pause
        
        slide_infos.append({
            "index": idx,
            "key": key,
            "img1": f"corner-{key}.webp",
            "img2": f"corner-{key}-2.webp",
            "audio_path": audio_path,
            "audio_duration": audio_dur,
            "duration": slide_dur,
            "start_time": current_time,
            "end_time": current_time + slide_dur
        })
        print(f"Slide {idx+1} ({key}): Audio={audio_dur:.2f}s, Total={slide_dur:.2f}s")
        current_time += slide_dur
        
    total_duration = current_time
    width, height = 1920, 1080
    fps = 30
    total_frames = int(total_duration * fps)
    print(f"Total video duration: {total_duration:.2f}s ({total_frames} frames at {fps} fps)")
    
    # Pre-warm the background cache
    print("Pre-rendering all blurred backgrounds...")
    for s in slide_infos:
        get_blurred_background(os.path.join(img_dir, s["img1"]), width, height)
        get_blurred_background(os.path.join(img_dir, s["img2"]), width, height)
    
    # Render frames
    print("Generating animated frames...")
    transition_dur = 0.5  # 0.5 seconds cross-fade
    
    for f in range(total_frames):
        t = f / fps
        
        # 1. Determine active slide
        slide_idx = None
        for i, s in enumerate(slide_infos):
            if s["start_time"] <= t < s["end_time"]:
                slide_idx = i
                break
        if slide_idx is None:
            slide_idx = len(slide_infos) - 1
            
        curr_slide = slide_infos[slide_idx]
        t_rel = t - curr_slide["start_time"]
        
        # 2. Render current frame
        frame_img = render_slide_frame(curr_slide, t_rel, img_dir, width, height)
        
        # 3. Handle cross-fade transition
        time_to_end = curr_slide["end_time"] - t
        if time_to_end <= transition_dur and slide_idx + 1 < len(slide_infos):
            next_slide = slide_infos[slide_idx + 1]
            t_rel_next = 0.0  # Just starting
            next_frame_img = render_slide_frame(next_slide, t_rel_next, img_dir, width, height)
            
            # Blend
            alpha = (transition_dur - time_to_end) / transition_dur
            frame_img = Image.blend(frame_img, next_frame_img, alpha)
            
        # Save frame
        frame_path = os.path.join(temp_frames_dir, f"frame_{f:04d}.jpg")
        frame_img.save(frame_path, "JPEG", quality=90)
        
        if f % 300 == 0:
            print(f"  Rendered frame {f}/{total_frames}...")
            
    print("All frames rendered successfully! Compiling video with ffmpeg...")
    
    # Compile with ffmpeg
    compile_cmd = [
        "ffmpeg", "-y", "-framerate", str(fps), "-i",
        os.path.join(temp_frames_dir, "frame_%04d.jpg"),
        "-i", temp_audio,
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest", output_video
    ]
    subprocess.run(compile_cmd, check=True)
    print("Video compiled in workspace!")
    
    # Sync to OneDrive
    print("Copying compiled video to OneDrive...")
    shutil.copy(output_video, dest_video_onedrive)
    print("OneDrive video sync complete!")
    
    # Cleanup frames
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
    print("Cleanup complete. Done!")

if __name__ == "__main__":
    main()
