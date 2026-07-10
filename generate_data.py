import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Ensure data directory exists
os.makedirs('data', exist_ok=True)

# Seed for reproducibility
np.random.seed(42)

# Names lists
first_names = ['John', 'Sarah', 'Rajesh', 'Amit', 'Priya', 'David', 'Elena', 'Michael', 'Emily', 'Robert', 'Lisa', 'William', 'James', 'Patricia', 'Daniel', 'Jennifer', 'Charles', 'Elizabeth', 'Thomas', 'Susan']
last_names = ['Smith', 'Lee', 'Kumar', 'Patel', 'Sharma', 'Johnson', 'Rodriguez', 'Brown', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Harris', 'Sanchez']

hcps = []
territories = ['North', 'South', 'East', 'West', 'Chennai', 'Bangalore', 'Mumbai', 'Delhi']
channels = ['Direct', 'SPP']
patient_types = ['New Patient', 'Established Patient']
writer_statuses = ['New Writer', 'Established Writer', 'Lapsed Writer']
program_types = ['Speaker Program', 'Webcast', 'Advisory Board', 'Lunch & Learn']
event_types = ['In-Person', 'Virtual']
statuses = ['None', 'Scheduled', 'Completed']
yes_no = ['Yes', 'No']

start_date = datetime(2026, 5, 1)

for i in range(1, 51):
    hcp_id = f"HCP{i:03d}"
    name = f"Dr. {np.random.choice(first_names)} {np.random.choice(last_names)}"
    territory = np.random.choice(territories)
    brand = 'JAKAFI'
    channel = np.random.choice(channels)
    patient_type = np.random.choice(patient_types, p=[0.4, 0.6])
    writer_status = np.random.choice(writer_statuses, p=[0.2, 0.6, 0.2])
    
    # Prescription numbers
    base_rx = np.random.choice([0, 5, 12, 28, 45, 60], p=[0.15, 0.25, 0.3, 0.15, 0.15, 0.0])
    prior_rx = int(np.clip(base_rx + np.random.randint(-3, 4), 0, None))
    
    # Growth or decay
    growth_chance = np.random.rand()
    if growth_chance > 0.8:  # growth
        current_rx = int(prior_rx * np.random.uniform(1.15, 1.35))
    elif growth_chance < 0.2:  # decay
        current_rx = int(prior_rx * np.random.uniform(0.7, 0.9))
    else:  # stable
        current_rx = int(prior_rx * np.random.uniform(0.95, 1.05))
    
    current_rx = max(current_rx, 0)
    
    program_type = np.random.choice(program_types)
    event_type = np.random.choice(event_types)
    
    # Dates
    prog_days = np.random.randint(5, 60)
    prog_dt = start_date + timedelta(days=prog_days)
    rec_dt = prog_dt + timedelta(days=np.random.randint(1, 4))
    
    program_date = prog_dt.strftime('%Y-%m-%d')
    received_date = rec_dt.strftime('%Y-%m-%d')
    
    follow_up_status = np.random.choice(statuses, p=[0.35, 0.25, 0.4])
    rte_opt_out = np.random.choice(yes_no, p=[0.15, 0.85])
    xr_early_adopter = np.random.choice(yes_no, p=[0.3, 0.7])
    
    hcps.append({
        'hcp_id': hcp_id,
        'hcp_name': name,
        'territory': territory,
        'brand': brand,
        'channel': channel,
        'patient_type': patient_type,
        'writer_status': writer_status,
        'prior_week_rx': prior_rx,
        'current_week_rx': current_rx,
        'program_type': program_type,
        'event_type': event_type,
        'program_date': program_date,
        'received_date': received_date,
        'follow_up_status': follow_up_status,
        'rte_opt_out': rte_opt_out,
        'xr_early_adopter': xr_early_adopter
    })

# Guarantee Dr. John Smith is in the first row and matches top priority alert details:
# Dr. John Smith has follow_up_status = 'None', Rx growth (40 -> 58), JAKAFI brand, etc.
hcps[0] = {
    'hcp_id': 'HCP001',
    'hcp_name': 'Dr. John Smith',
    'territory': 'Chennai',
    'brand': 'JAKAFI',
    'channel': 'Direct',
    'patient_type': 'New Patient',
    'writer_status': 'New Writer',
    'prior_week_rx': 40,
    'current_week_rx': 58,
    'program_type': 'Speaker Program',
    'event_type': 'In-Person',
    'program_date': '2026-06-15',
    'received_date': '2026-06-17',
    'follow_up_status': 'None',
    'rte_opt_out': 'No',
    'xr_early_adopter': 'Yes'
}

df = pd.DataFrame(hcps)
df.to_csv('data/hcp_data.csv', index=False)
print("Generated data/hcp_data.csv with JAKAFI schema successfully!")
