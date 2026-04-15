from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
import os
import signal

app = FastAPI(title="Credit Card Default Prediction API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the input data structure (23 features)
class PredictionInput(BaseModel):
    LIMIT_BAL: float
    SEX: int
    EDUCATION: int
    MARRIAGE: int
    AGE: int
    PAY_0: int
    PAY_2: int
    PAY_3: int
    PAY_4: int
    PAY_5: int
    PAY_6: int
    BILL_AMT1: float
    BILL_AMT2: float
    BILL_AMT3: float
    BILL_AMT4: float
    BILL_AMT5: float
    BILL_AMT6: float
    PAY_AMT1: float
    PAY_AMT2: float
    PAY_AMT3: float
    PAY_AMT4: float
    PAY_AMT5: float
    PAY_AMT6: float

# Placeholder for model and scaler
model = None
scaler = None

@app.on_event("startup")
def load_model():
    global model, scaler
    try:
        model = joblib.load('model.joblib')
        scaler = joblib.load('scaler.joblib')
        print("Model and Scaler loaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}. Please ensure train_model.py has been run.")

@app.get("/")
def read_root():
    return {"message": "Credit Card Default Prediction API is running"}

@app.post("/shutdown")
async def shutdown():
    print("Shutdown requested...")
    # Delay to allow response to be sent
    import asyncio
    asyncio.create_task(shutdown_after_delay())
    return {"message": "Server is shutting down..."}

async def shutdown_after_delay():
    import asyncio
    await asyncio.sleep(1)
    os.kill(os.getpid(), signal.SIGINT)

@app.post("/predict")
def predict(data: PredictionInput):
    if model is None or scaler is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please run the training script first.")
    
    # Prepare input data
    input_list = [
        data.LIMIT_BAL, data.SEX, data.EDUCATION, data.MARRIAGE, data.AGE,
        data.PAY_0, data.PAY_2, data.PAY_3, data.PAY_4, data.PAY_5, data.PAY_6,
        data.BILL_AMT1, data.BILL_AMT2, data.BILL_AMT3, data.BILL_AMT4, data.BILL_AMT5, data.BILL_AMT6,
        data.PAY_AMT1, data.PAY_AMT2, data.PAY_AMT3, data.PAY_AMT4, data.PAY_AMT5, data.PAY_AMT6
    ]
    
    # Scaling
    scaled_data = scaler.transform([input_list])
    
    # Prediction
    prediction = model.predict(scaled_data)
    probability = model.predict_proba(scaled_data)[:, 1]
    
    return {
        "default_prediction": int(prediction[0]),
        "probability": float(probability[0])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
