import pandas as pd
import boto3
import io
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from xgboost import XGBClassifier
import joblib

# Use Colab's userdata for security if running in Colab
try:
    from google.colab import userdata
    aws_access_key_id = userdata.get('AWS_ACCESS_KEY_ID')
    aws_secret_access_key = userdata.get('AWS_SECRET_ACCESS_KEY')
except ImportError:
    # Local fallback or other environment
    import os
    aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
    aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')

aws_region = 'us-east-2'

s3_client = boto3.client(
    's3', 
    aws_access_key_id=aws_access_key_id, 
    aws_secret_access_key=aws_secret_access_key, 
    region_name=aws_region
)

print("Descargando la tabla del Banco desde S3...")
objeto_s3 = s3_client.get_object(Bucket='ia-bussiness2026', Key='UCI_Credit_Card.csv')
df = pd.read_csv(io.BytesIO(objeto_s3['Body'].read()))
print("¡Archivo cargado exitosamente!")

# Preprocesamiento
df.drop(['ID'], axis=1, inplace=True)

# Separar características y etiquetas
X = df.drop('default.payment.next.month', axis=1)
y = df['default.payment.next.month']

# Dividir datos en entrenamiento y prueba
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Escalar los datos
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Entrenar el modelo XGBoost
print("Entrenando el modelo XGBoost...")
model = XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
model.fit(X_train_scaled, y_train)

# Evaluación
y_pred = model.predict(X_test_scaled)
print("\nPrecisión del modelo:", accuracy_score(y_test, y_pred))
print("\nReporte de Clasificación:\n", classification_report(y_test, y_pred))

# Guardar el modelo y el escalador
joblib.dump(model, 'model.joblib')
joblib.dump(scaler, 'scaler.joblib')
print("\nModelo y Escalador guardados como 'model.joblib' y 'scaler.joblib'")
