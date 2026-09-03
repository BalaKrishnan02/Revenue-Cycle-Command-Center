import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from generate_dataset import generate_claims_dataset

def train_denial_model():
    data_path = 'data/synthetic_claims.csv'
    if not os.path.exists(data_path):
        print("Dataset not found. Generating dataset first...")
        df = generate_claims_dataset(1000)
    else:
        df = pd.read_csv(data_path)
        
    features = [
        'eligibility_verified',
        'authorization_available',
        'coding_complete',
        'documentation_complete',
        'claim_amount',
        'previous_denials',
        'payer_risk_score'
    ]
    target = 'denied'
    
    X = df[features]
    y = df[target]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        random_state=42,
        class_weight='balanced'
    )
    model.fit(X_train, y_train)
    
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = model.predict(X_test)
    
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    print(f"Model Training Complete! ROC-AUC: {roc_auc:.4f}")
    print(classification_report(y_test, y_pred))
    
    os.makedirs('models', exist_ok=True)
    model_path = 'models/denial_model.pkl'
    joblib.dump(model, model_path)
    print(f"Saved trained model to {model_path}")
    return model

if __name__ == '__main__':
    train_denial_model()
