# AI 旅遊行程整理器｜完整本機版

本專案是完整的本機旅遊資料整理工具，不使用 GitHub Pages，也不會把照片、影片或 GPS 資料上傳到 GitHub。

## Windows EXE 版（推薦）

從 GitHub Release 下載 `AI-Travel-Organizer-v0.2.0-windows.zip`，解壓縮後雙擊：

```text
AI-Travel-Organizer.exe
```

這個版本不需要另外安裝 Python。啟動後開啟：

```text
http://127.0.0.1:8765/
```


### Windows

1. 安裝 Python 3.11 或 3.12：
   https://www.python.org/downloads/
2. 解壓縮 Release ZIP。
3. 雙擊：

```text
start_travel_ai.bat
```

啟動後開啟：

```text
http://127.0.0.1:8765/
```

啟動檔會自動安裝必要套件：

- Pillow：照片 EXIF / GPS / 縮圖
- pypdf：PDF 文字
- python-docx：Word
- openpyxl：Excel

### Git Bash / macOS / Linux

```bash
python3 -m pip install -r requirements.txt
python3 server.py
```

然後開啟 `http://127.0.0.1:8765/`。

## 功能

- 匯入本機旅遊資料夾
- 解析 JPG / JPEG / TIFF / PNG / WebP / HEIC
- 讀取照片拍攝時間與 GPS EXIF
- GPS 反查推測地點名稱
- 產生本機縮圖
- 解析 PDF / Word / Excel / TXT / Markdown / CSV / JSON
- 影片依檔案時間建立事件
- 每日時間排序
- 左側樹狀列表 + 照片縮圖
- 右側 Leaflet / OpenStreetMap 地圖
- 照片 📷、影片 🎬、文件 📄、地點 📍 marker
- 重複地點群組 marker，例如 `🖼️ 12`
- 群組 popup 最多顯示三張縮圖，其餘顯示 `...`
- 匯出 Markdown、JSON、互動地圖 HTML

## 本機資料

分析資料會留在本機：

```text
data/trips/<旅程代號>/
├── raw/
├── extracted/
├── thumbs/
├── timeline.json
├── places.json
├── report.md
└── map.html
```

這些資料預設不會被 Git 追蹤，也不會包含在 GitHub Release ZIP 裡。

## 注意

- GPS 反查是最佳努力；沒有網路時仍會顯示 GPS 座標。
- 大型照片資料夾第一次分析可能需要一些時間。
- 完整功能必須透過 `server.py` 執行，不能直接雙擊 `index.html`。
