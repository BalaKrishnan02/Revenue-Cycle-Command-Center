import os
import numpy as np
import pandas as pd

def generate_claims_dataset(n_samples=1000, random_state=42):
    np.random.seed(random_state)
    
    # Generate realistic features
    eligibility_verified = np.random.choice([0, 1], size=n_samples, p=[0.20, 0.80])
    authorization_available = np.random.choice([0, 1], size=n_samples, p=[0.25, 0.75])
    coding_complete = np.random.choice([0, 1], size=n_samples, p=[0.18, 0.82])
    documentation_complete = np.random.choice([0, 1], size=n_samples, p=[0.22, 0.78])
    
    claim_amount = np.random.choice([
        np.random.uniform(2000, 15000),
        np.random.uniform(15000, 45000),
        np.random.uniform(45000, 150000)
    ], size=n_samples)
    claim_amount = np.round(claim_amount, -2)
    
    previous_denials = np.random.choice([0, 1, 2, 3, 4, 5], size=n_samples, p=[0.55, 0.20, 0.12, 0.08, 0.03, 0.02])
    payer_risk_score = np.random.uniform(0.15, 0.85, size=n_samples)
    
    # Calculate latent risk score
    # High impact if eligibility is 0 or authorization is 0
    risk_score = (
        (1 - eligibility_verified) * 0.38 +
        (1 - authorization_available) * 0.35 +
        (1 - coding_complete) * 0.22 +
        (1 - documentation_complete) * 0.20 +
        (previous_denials / 5.0) * 0.18 +
        (payer_risk_score) * 0.15 +
        (claim_amount > 50000).astype(int) * 0.10 +
        np.random.normal(0, 0.05, size=n_samples)
    )
    
    # Sigmoid to probability
    prob_denial = 1 / (1 + np.exp(- (risk_score - 0.45) * 5.0))
    
    # Target denial label
    denied = (np.random.uniform(0, 1, size=n_samples) < prob_denial).astype(int)
    
    df = pd.DataFrame({
        'eligibility_verified': eligibility_verified,
        'authorization_available': authorization_available,
        'coding_complete': coding_complete,
        'documentation_complete': documentation_complete,
        'claim_amount': claim_amount,
        'previous_denials': previous_denials,
        'payer_risk_score': np.round(payer_risk_score, 2),
        'denied': denied
    })
    
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/synthetic_claims.csv', index=False)
    print(f"Generated {n_samples} synthetic claims records -> data/synthetic_claims.csv")
    print(f"Denial distribution: {df['denied'].value_counts(normalize=True).to_dict()}")
    return df

if __name__ == '__main__':
    generate_claims_dataset()
