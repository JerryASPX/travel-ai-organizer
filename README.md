# AI 旅遊行程整理器 MVP

本機優先的旅遊資料整理工具：匯入行程文件、照片、影片資料夾，產生每日時間排序樹狀條列、互動地圖、Markdown 報告與 JSON。

## 啟動

在 Windows / Git Bash：

```bash
cd C:/Users/Jerry/travel-ai-organizer
python server.py
```

打開：

```text
http://127.0.0.1:8765/
```

## 目前支援

- TXT / MD / CSV / JSON / YAML 文字抽取
- PDF：若安裝 `pypdf` 可抽文字
- DOCX：若安裝 `python-docx` 可抽文字
- XLSX：若安裝 `openpyxl` 可抽文字
- JPG/TIFF 等照片 EXIF：若安裝 `Pillow` 可讀拍攝時間與 GPS
- MP4/MOV 等影片：目前用檔案時間建立事件，後續可加 ffmpeg/Whisper
- OpenStreetMap Nominatim 地理編碼
- 匯出 `report.md`、`map.html`、`timeline.json`

## 建議加裝套件

```bash
python -m pip install pillow pypdf python-docx openpyxl
```

沒有安裝也能跑，只是 PDF/DOCX/XLSX/照片 EXIF 解析能力會較弱。

## 資料位置

```text
data/trips/<旅程代號>/
├── raw/            # 匯入/複製的原始檔
├── extracted/      # 抽出的文字
├── timeline.json
├── places.json
├── report.md
└── map.html
```

## 後續可擴充

- OCR：圖片截圖/票券辨識
- ffmpeg：影片縮圖與 metadata
- faster-whisper + OpenCC：影片語音轉台灣繁中字幕/摘要
- LLM：事件合併、摘要、每日遊記
- SQLite：大型旅程索引
- GPX / Google My Maps 匯出
