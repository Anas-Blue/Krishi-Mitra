FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source + pre-trained model (commit yield_model.pkl before deploying)
COPY . .

# Fail loudly at build time if model is missing
RUN python -c "import joblib, os; joblib.load('yield_model.pkl')" || \
    (echo 'ERROR: yield_model.pkl not found. Run python train_model.py locally and commit the file.' && exit 1)

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
