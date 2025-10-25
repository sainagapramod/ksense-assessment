# Ksense Patient Risk Assessment Solution

## Overview
This project implements the Ksense assessment:
- Fetch paginated patient data from /api/patients
- Score each patient by *Blood Pressure, **Temperature, and **Age*
- Produce three lists:
  - high_risk_patients — total risk score *≥ 4*
  - fever_patients — temperature *≥ 99.6°F*
  - data_quality_issues — invalid/missing BP, Temp, or Age
- Submit results to /api/submit-assessment

## ⚙ Risk Scoring Rules (summary)
*Blood Pressure (systolic/diastolic)*
- Invalid/missing → 0 (counts as data quality issue)
- Normal: <120 and <80 → 0
- Elevated: 120–129 and <80 → 1
- Stage 1: 130–139 *or* 80–89 → 2
- Stage 2: ≥140 *or* ≥90 → 3

*Temperature*
- Invalid/missing → 0 (data quality)
- <99.6°F → 0
- 99.6–100.9°F → 1
- ≥101.0°F → 2

*Age*
- Invalid/missing → 0 (data quality)
- <40 → 0
- 40–65 → 1
- >65 → 2

*Total Risk Score = BP + Temp + Age*

## 🛠 How to Run Locally (optional)
1. Install Node.js (v18+ recommended)
2. Clone this repo:
   ```bash
   git clone https://github.com/sainagapramod/ksense-assessment
   cd ksense-assessment
