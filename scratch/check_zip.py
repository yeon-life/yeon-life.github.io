import os
import zipfile

zip_path = r"c:\Claude\연라이프\리디자인_2026-05-16_전체.zip"
if os.path.exists(zip_path):
    print("Zip file exists.")
    with zipfile.ZipFile(zip_path) as z:
        for f in z.namelist():
            if any(k in f for k in ["인공지능", "결", "index.html"]):
                print(f)
else:
    print("Zip file does not exist at:", zip_path)
