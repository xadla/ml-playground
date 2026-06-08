from fastapi import FastAPI

app = FastAPI(title="ML-Playground")

@app.get("/")
async def root():
    return {"message": "Hello from ML-Playground backend!"}