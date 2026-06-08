import os
import subprocess
import shutil
from PIL import Image, ImageFilter, ImageDraw

def main():
    print("Starting yuchi video generation...")

    # Define paths
    workspace_dir = r"c:\Claude\연라이프\yeon-life.github.io\어린이의_결_유치_월간"
    img_dir = os.path.join(workspace_dir, "img")
    video_dir = os.path.join(workspace_dir, "video")
    os.makedirs(video_dir, exist_ok=True)
    
    scratch_dir = r"c:\Claude\연라이프\scratch"
    temp_frames_dir = os.path.join(scratch_dir, "temp_frames_yuchi")
    os.makedirs(temp_frames_dir, exist_ok=True)

    temp_audio = os.path.join(scratch_dir, "audio.aac")
    # If temp_audio doesn't exist, we extract it from the monthly AI video
    if not os.path.exists(temp_audio):
        print("Extracting audio from monthly AI video...")
        original_video = r"c:\Claude\연라이프\yeon-life.github.io\내친구인공지능_월간\video\backup\promo_vertical.mp4"
        audio_cmd = [
            "ffmpeg", "-y", "-i", original_video, "-vn", "-acodec", "copy", temp_audio
        ]
        subprocess.run(audio_cmd, check=True)
        print("Audio extracted successfully!")

    output_video = os.path.join(video_dir, "promo_horizontal.mp4")
    dest_video_onedrive = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_유치_월간\video\promo_horizontal.mp4"
    os.makedirs(os.path.dirname(dest_video_onedrive), exist_ok=True)

    # Step 2: Define video settings
    total_duration = 180.0  # 3 minutes
    width, height = 1920, 1080  # Horizontal YouTube 16:9
    fps = 30
    total_frames = int(total_duration * fps)
    print(f"Target duration: {total_duration} seconds ({total_frames} frames at {fps} fps)")

    # Step 3: Define slides order and load images
    image_names = [
        "corner-cover.webp",
        "corner-math.webp",
        "corner-hangeul.webp",
        "corner-english.webp",
        "corner-future.webp",
        "corner-fairytale.webp",
        "corner-habit.webp",
        "corner-parents.webp"
    ]

    images_paths = [os.path.join(img_dir, name) for name in image_names]

    # Step 4: Pre-process each image to horizontal layout
    processed_slides = []
    fg_size = 980 # 980x980 square fits vertically inside 1080 height
    for idx, path in enumerate(images_paths):
        print(f"Processing slide {idx}: {os.path.basename(path)}")
        orig_img = Image.open(path).convert("RGBA")
        
        # 1. Create blurred background
        bg_scale_size = 1920
        bg_img = orig_img.resize((bg_scale_size, bg_scale_size), Image.Resampling.LANCZOS)
        # Crop to 1920x1080 centered
        left = 0
        top = (bg_scale_size - height) // 2
        bg_cropped = bg_img.crop((left, top, left + width, top + height))
        # Apply heavy blur
        bg_blurred = bg_cropped.filter(ImageFilter.GaussianBlur(radius=50))

        # 2. Prepare centered foreground card
        fg_img = orig_img.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
        
        # Mask for rounded corners on foreground card
        mask = Image.new("L", (fg_size, fg_size), 0)
        draw = ImageDraw.Draw(mask)
        draw.rounded_rectangle((0, 0, fg_size, fg_size), radius=32, fill=255)

        fg_rounded = Image.new("RGBA", (fg_size, fg_size))
        fg_rounded.paste(fg_img, (0, 0), mask=mask)

        # 3. Combine bg and fg
        slide_canvas = bg_blurred.copy()
        fg_x = (width - fg_size) // 2
        fg_y = (height - fg_size) // 2
        
        # Glassmorphic border
        draw_border = ImageDraw.Draw(slide_canvas)
        draw_border.rounded_rectangle(
            (fg_x - 3, fg_y - 3, fg_x + fg_size + 3, fg_y + fg_size + 3),
            radius=34, outline=(255, 255, 255, 60), width=4
        )

        slide_canvas.paste(fg_rounded, (fg_x, fg_y), mask=fg_rounded)
        processed_slides.append(slide_canvas.convert("RGB"))

    # Step 5: Render frames with cross-fade transition
    num_slides = len(processed_slides)
    frames_per_slide = total_frames / num_slides
    transition_frames = 15  # 0.5s transition

    print("Generating frames...")
    for f in range(total_frames):
        slide_idx = int(f / frames_per_slide)
        if slide_idx >= num_slides:
            slide_idx = num_slides - 1

        segment_start_frame = int(slide_idx * frames_per_slide)
        segment_frame = f - segment_start_frame

        next_slide_idx = slide_idx + 1
        if next_slide_idx < num_slides and (frames_per_slide - segment_frame) <= transition_frames:
            # Cross-fade
            alpha = (transition_frames - (frames_per_slide - segment_frame)) / transition_frames
            frame_img = Image.blend(
                processed_slides[slide_idx],
                processed_slides[next_slide_idx],
                alpha
            )
        else:
            frame_img = processed_slides[slide_idx]

        frame_path = os.path.join(temp_frames_dir, f"frame_{f:04d}.jpg")
        frame_img.save(frame_path, "JPEG", quality=90)

        if f % 300 == 0:
            print(f"  Rendered {f}/{total_frames} frames...")

    print("All frames rendered! Compiling video with ffmpeg...")

    # Step 6: Compile video using ffmpeg with looped audio
    compile_cmd = [
        "ffmpeg", "-y", "-framerate", str(fps), "-i",
        os.path.join(temp_frames_dir, "frame_%04d.jpg"),
        "-stream_loop", "-1", "-i", temp_audio,
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
