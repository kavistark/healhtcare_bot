import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import os

class HCPPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.label_encoders = {}
        self.categorical_cols = [
            'specialty', 'territory', 'channel', 'patient_type', 'writer_status', 
            'program_type', 'event_type', 'follow_up_status'
        ]
        self.is_trained = False

    def preprocess_data(self, df, is_training=True):
        """Preprocesses the DataFrame for machine learning."""
        processed_df = df.copy()
        
        # Fill missing values for follow_up_status with 'None'
        if 'follow_up_status' in processed_df.columns:
            processed_df['follow_up_status'] = processed_df['follow_up_status'].fillna('None')
            
        # Fill remaining missing values
        processed_df = processed_df.fillna(0)
        
        # Encode categorical variables
        for col in self.categorical_cols:
            if col in processed_df.columns:
                if is_training:
                    le = LabelEncoder()
                    processed_df[col] = le.fit_transform(processed_df[col].astype(str))
                    self.label_encoders[col] = le
                else:
                    le = self.label_encoders.get(col)
                    if le:
                        # Handle unseen labels by mapping them to the first known class
                        classes = le.classes_
                        processed_df[col] = processed_df[col].apply(
                            lambda x: x if x in classes else classes[0]
                        )
                        processed_df[col] = le.transform(processed_df[col].astype(str))
                    else:
                        processed_df[col] = 0
                        
        # Map binary columns to 1 and 0
        if 'rte_opt_out' in processed_df.columns:
            processed_df['rte_opt_out'] = processed_df['rte_opt_out'].map({'Yes': 1, 'No': 0, 'Y': 1, 'N': 0}).fillna(0)
        if 'xr_early_adopter' in processed_df.columns:
            processed_df['xr_early_adopter'] = processed_df['xr_early_adopter'].map({'Yes': 1, 'No': 0, 'Y': 1, 'N': 0}).fillna(0)
            
        return processed_df

    def train(self, csv_path):
        """Trains the Random Forest model on prescription data."""
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Database CSV not found at {csv_path}")
            
        df = pd.read_csv(csv_path)
        
        # Preprocess features
        features_df = self.preprocess_data(df, is_training=True)
        
        # Features and Targets
        # We construct a proxy target to simulate forecasting next week's Rx counts
        np.random.seed(42)
        target = features_df['current_week_rx'] * (1 + np.random.normal(0.05, 0.1, len(features_df)))
        target = np.clip(target, 0, None).round(1)
        
        # Define X
        feature_cols = [
            'specialty', 'territory', 'channel', 'patient_type', 'writer_status', 
            'program_type', 'event_type', 'follow_up_status',
            'prior_week_rx', 'current_week_rx', 'rte_opt_out', 'xr_early_adopter'
        ]
        
        # Ensure all columns exist in features_df
        existing_cols = [c for c in feature_cols if c in features_df.columns]
        X = features_df[existing_cols]
        y = target
        
        self.feature_cols = existing_cols
        self.model.fit(X, y)
        self.is_trained = True
        return self

    def predict_trends(self, df):
        """Predicts the next week's prescriptions for all HCPs in the dataframe."""
        if not self.is_trained:
            # Heuristic backup
            return (df['current_week_rx'] * 1.05).round(1)
            
        features_df = self.preprocess_data(df, is_training=False)
        X = features_df[self.feature_cols]
        predictions = self.model.predict(X)
        return np.clip(predictions, 0, None).round(1)

    def calculate_priority_score(self, row):
        """Calculates a custom engagement priority score for a JAKAFI alert card."""
        score = 0
        reasons = []
        
        # Rule 1: follow_up_status: None (high priority), Scheduled (medium), Completed (none)
        status = row['follow_up_status']
        if status == 'None':
            score += 45
            reasons.append("Follow-up is required (None)")
        elif status == 'Scheduled':
            score += 20
            reasons.append("Follow-up is scheduled")
            
        # Rule 2: xr_early_adopter: Yes / Y
        if row['xr_early_adopter'] in ['Yes', 'Y']:
            score += 20
            reasons.append("XR Early Adopter segment profile")
            
        # Rule 3: Prescriptions increased this week (momentum check)
        pw_rx = row['prior_week_rx']
        cw_rx = row['current_week_rx']
        if pw_rx > 0:
            growth = (cw_rx - pw_rx) / pw_rx
            if growth >= 0.2:
                score += 20
                reasons.append(f"Rx increased by {int(growth * 100)}% this week")
        elif cw_rx > 0: # New prescriber
            score += 15
            reasons.append("New active writer starting this week")
            
        # Rule 4: writer_status is New Writer
        if row['writer_status'] == 'New Writer':
            score += 15
            reasons.append("New JAKAFI writer profile")
            
        # Ensure boundaries
        score = min(score, 100)
        
        if not reasons:
            reasons.append("Routine relationship maintenance")
            score = 10
            
        return score, reasons
