import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

def read_previous_transcript():
    transcript_path = r"C:\Users\jinwo\.gemini\antigravity\brain\5bda318b-073a-4511-9ca3-cb901cfe8dd5\.system_generated\logs\transcript.jsonl"
    if not os.path.exists(transcript_path):
        print("Transcript does not exist.")
        return
    
    print("=== Reading User Messages from Previous Conversation ===")
    with open(transcript_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            try:
                step = json.loads(line)
                if step.get('type') == 'USER_INPUT':
                    print(f"[{step.get('created_at')}] USER: {step.get('content')}")
            except Exception as e:
                print(f"Error parsing line: {e}")

if __name__ == '__main__':
    read_previous_transcript()
