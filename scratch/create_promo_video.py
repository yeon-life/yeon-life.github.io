import os
import subprocess
import shutil
from PIL import Image, ImageFilter, ImageDraw

def main():
    print("Starting video generation...")

    # Define paths
    workspace_dir = r"c:\Claude\연라이프\yeon-life.github.io\내친구인공지능_월간"
    img_dir = os.path.join(workspace_dir, "img")
    video_dir = os.path.join(workspace_dir, "video")
    scratch_dir = r"c:\Claude\연라이프\scratch"
    temp_frames_dir = os.path.join(scratch_dir, "temp_frames")
    os.makedirs(temp_frames_dir, exist_ok=True)

    original_video = os.path.join(video_dir, "backup", "promo_vertical.mp4")
    temp_audio = os.path.join(scratch_dir, "audio.aac")
    output_video = os.path.join(video_dir, "promo_vertical.mp4")
    dest_video_onedrive = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\내친구인공지능_월간\video\promo_vertical.mp4"

    # Step 1: Extract audio from original video
    print("Extracting audio from original video...")
    audio_cmd = [
        "ffmpeg", "-y", "-i", original_video, "-vn", "-acodec", "copy", temp_audio
    ]
    subprocess.run(audio_cmd, check=True)
    print("Audio extracted successfully!")

    # Step 2: Get total duration using ffprobe
    duration_cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", original_video
    ]
    duration_output = subprocess.check_output(duration_cmd).decode().strip()
    total_duration = float(duration_output)
    print(f"Original video duration: {total_duration} seconds")

    # Step 3: Define slides order and load images
    # 10 images total
    image_names = [
        "intro-poster.png",
        "corner-cover.png",
        "corner-weekly.png",
        "corner-app.png",
        "corner-voice.png",
        "corner-mythbust.png",
        "corner-word.png",
        "corner-future.png",
        "corner-qna.png",
        "corner-tobook.png"
    ]

    images_paths = [os.path.join(img_dir, name) for name in image_names]

    # Target resolution
    width, height = 1080, 1920
    fps = 30
    total_frames = int(total_duration * fps)
    print(f"Target frames: {total_frames} at {fps} fps")

    # Step 4: Pre-process each image to vertical frame layout (blurred pad background)
    processed_slides = []
    for idx, path in enumerate(images_paths):
        print(f"Processing slide {idx}: {os.path.basename(path)}")
        orig_img = Image.open(path).convert("RGBA")
        
        # 1. Create blurred background
        # Scale square image to cover the vertical height (e.g. scale 1024x1024 to 1920x1920)
        bg_size = 1920
        bg_img = orig_img.resize((bg_size, bg_size), Image.Resampling.LANCZOS)
        # Crop to 1080x1920 centered
        left = (bg_size - width) // 2
        top = (bg_size - height) // 2
        bg_cropped = bg_img.crop((left, top, left + width, top + height))
        # Apply heavy blur
        bg_blurred = bg_cropped.filter(ImageFilter.GaussianBlur(radius=50))

        # 2. Prepare centered foreground card
        # Scale square image to fit width (e.g. 960x960) with margins
        fg_size = 920
        fg_img = orig_img.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
        
        # Create a mask for rounded corners on the foreground image
        mask = Image.new("L", (fg_size, fg_size), 0)
        draw = ImageDraw.Draw(mask)
        draw.rounded_rectangle((0, 0, fg_size, fg_size), radius=32, fill=255)

        # Apply rounded corners to foreground
        fg_rounded = Image.new("RGBA", (fg_size, fg_size))
        fg_rounded.paste(fg_img, (0, 0), mask=mask)

        # 3. Draw a subtle border and shadow around the card
        # Combine background and foreground
        slide_canvas = bg_blurred.copy()
        fg_x = (width - fg_size) // 2
        fg_y = (height - fg_size) // 2
        
        # Draw a beautiful glassmorphic container outline
        draw_border = ImageDraw.Draw(slide_canvas)
        draw_border.rounded_rectangle(
            (fg_x - 3, fg_y - 3, fg_x + fg_size + 3, fg_y + fg_size + 3),
            radius=34, outline=(255, 255, 255, 60), width=4
        )

        # Paste the foreground image
        slide_canvas.paste(fg_rounded, (fg_x, fg_y), mask=fg_rounded)
        
        processed_slides.append(slide_canvas.convert("RGB"))

    # Step 5: Render frames with cross-fade transition
    # Calculate duration per slide in frames
    num_slides = len(processed_slides)
    frames_per_slide = total_frames / num_slides
    transition_frames = 15 # 0.5s transition

    print("Generating frames...")
    for f in range(total_frames):
        # Determine current slide
        slide_time = f / fps
        slide_idx = int(f / frames_per_slide)
        if slide_idx >= num_slides:
            slide_idx = num_slides - 1

        # Calculate position within the current slide's segment
        segment_start_frame = int(slide_idx * frames_per_slide)
        segment_frame = f - segment_start_frame

        # Check if we are in the transition zone to the next slide
        next_slide_idx = slide_idx + 1
        if next_slide_idx < num_slides and (frames_per_slide - segment_frame) <= transition_frames:
            # Transition blend
            alpha = (transition_frames - (frames_per_slide - segment_frame)) / transition_frames
            frame_img = Image.blend(
                processed_slides[slide_idx],
                processed_slides[next_slide_idx],
                alpha
            )
        else:
            # Pure slide image
            frame_img = processed_slides[slide_idx]

        # Save frame image
        frame_path = os.path.join(temp_frames_dir, f"frame_{f:04d}.jpg")
        frame_img.save(frame_path, "JPEG", quality=90)

        if f % 150 == 0:
            print(f"  Rendered {f}/{total_frames} frames...")

    print("All frames rendered! Compiling video with ffmpeg...")

    # Step 6: Compile video using ffmpeg
    compile_cmd = [
        "ffmpeg", "-y", "-framerate", str(fps), "-i",
        os.path.join(temp_frames_dir, "frame_%04d.jpg"),
        "-i", temp_audio,
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest", output_video
    ]
    subprocess.run(compile_cmd, check=True)
    print("Video compiled successfully in workspace!")

    # Step 7: Sync to OneDrive
    print("Copying compiled video to OneDrive...")
    shutil.copy(output_video, dest_video_onedrive)
    print("OneDrive video sync complete!")

    # Clean up temporary frames directory
    print("Cleaning up temp frames...")
    for f in range(total_frames):
        try:
            os.remove(os.path.join(temp_frames_dir, f"frame_{f:04d}.jpg"))
        except:
            pass
    try:
        os.rmdir(temp_frames_dir)
        os.remove(temp_audio)
    except:
        pass
    print("Cleanup completed. Done!")

if __name__ == "__main__":
    main()
