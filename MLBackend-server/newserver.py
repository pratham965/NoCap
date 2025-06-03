from fastapi import FastAPI, File, UploadFile, HTTPException
import uvicorn
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import validate_statement
from img_verify import query
import io, json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StatementRequest(BaseModel):
    statement: str

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        image = Image.open(io.BytesIO(await file.read())).convert("RGB")
        image_path = f"temp_{file.filename}"
        image.save(image_path)
        return query(image_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get('/predict')
def response():
    return "Server running"

@app.post("/validate")
async def validate(request: StatementRequest):
    try:
        result = validate_statement(request.statement)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

