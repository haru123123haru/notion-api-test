from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import shutil
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# 1. CORSの設定 (Viteからのアクセスを許可)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 画像を一時保存するディレクトリの作成とマウント
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Notionの認証情報
NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_VERSION = "2022-06-28"
BASE_PUBLIC_URL = os.getenv("BASE_PUBLIC_URL")


class NotionImagePayload(BaseModel):
    page_id: str
    image_url: str

# ---------------------------------------------------------
# 1: 画像をアップロードしてURLを返すエンドポイント
# ---------------------------------------------------------
@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        # ファイルをローカルの static/uploads に保存
        file_location = f"static/uploads/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        
        # Notionがアクセスできる公開URLを生成して返す
        public_url = f"{BASE_PUBLIC_URL}/{file_location}"
        return {"imageUrl": public_url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# 2: Notion APIに画像ブロックを追加するエンドポイント
# ---------------------------------------------------------
@app.post("/api/send-to-notion")
async def send_to_notion(payload: NotionImagePayload):
    url = f"https://api.notion.com/v1/blocks/{payload.page_id}/children"
    
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json"
    }
    
    # Notionに送付する画像ブロックのJSON構造
    notion_data = {
        "children": [
            {
                "object": "block",
                "type": "image",
                "image": {
                    "type": "external",
                    "external": {
                        "url": payload.image_url
                    }
                }
            }
        ]
    }

    # 非同期でNotion APIを叩く
    async with httpx.AsyncClient() as client:
        response = await client.patch(url, headers=headers, json=notion_data)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
            
        return {"message": "Successfully sent to Notion", "data": response.json()}