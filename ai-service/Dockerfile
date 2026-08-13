# Must match the interpreter the model was trained under — see requirements.txt.
FROM python:3.13-slim

WORKDIR /app

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source + pre-trained model (commit yield_model.pkl before deploying)
COPY . .

# Fail at build time rather than on the first request: verify the model loads
# under the installed scikit-learn, and that it is a bundle from the current
# training script rather than a stale pkl missing the prior tables.
RUN python -c "\
import joblib, sys; \
b = joblib.load('yield_model.pkl'); \
missing = {'model','encoders','priors','interval_z'} - set(b); \
sys.exit('ERROR: yield_model.pkl is stale, missing %s. Re-run train_model.py and commit it.' % missing) if missing else None; \
print('model OK:', type(b['model']).__name__, len(b['known_crops']), 'crops')"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
