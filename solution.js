import fetch from 'node-fetch';

const API_KEY = 'ak_1161683bcb97c0efa04a376d1578c7a6b33745a4e754a6c1';
const BASE_URL = 'https://assessment.ksensetech.com/api/patients';
const SUBMIT_URL = 'https://assessment.ksensetech.com/api/submit-assessment';

async function fetchAllPatients() {
  let allPatients = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    try {
      const response = await fetch(`${BASE_URL}?page=${page}&limit=5`, {
        headers: { 'x-api-key': API_KEY }
      });

      if (!response.ok) throw new Error('Retry page fetch');

      const result = await response.json();
      allPatients.push(...result.data);
      hasNext = result.pagination.hasNext;
      page++;
    } catch (err) {
      console.log(`Retrying page ${page}...`);
    }
  }
  return allPatients;
}

function calculateRisk(patient) {
  let bpScore = 0, tempScore = 0, ageScore = 0, invalid = false;

  if (patient.blood_pressure && patient.blood_pressure.includes('/')) {
    const [sys, dia] = patient.blood_pressure.split('/').map(Number);
    if (isNaN(sys) || isNaN(dia)) invalid = true;
    else if (sys >= 140 || dia >= 90) bpScore = 3;
    else if (sys >= 130 || dia >= 80) bpScore = 2;
    else if (sys >= 120) bpScore = 1;
  } else invalid = true;

  if (!isNaN(patient.temperature)) {
    if (patient.temperature >= 101.0) tempScore = 2;
    else if (patient.temperature >= 99.6) tempScore = 1;
  } else invalid = true;

  if (!isNaN(patient.age)) {
    if (patient.age > 65) ageScore = 2;
    else if (patient.age >= 40) ageScore = 1;
  } else invalid = true;

  return { total: invalid ? 0 : bpScore + tempScore + ageScore, invalid };
}

async function main() {
  const patients = await fetchAllPatients();
  console.log(`Fetched ${patients.length} patients.`);

  const highRisk = [];
  const feverPatients = [];
  const dataQualityIssues = [];

  patients.forEach(patient => {
    const { total, invalid } = calculateRisk(patient);
    if (invalid) dataQualityIssues.push(patient.patient_id);
    if (total >= 4) highRisk.push(patient.patient_id);
    if (!isNaN(patient.temperature) && patient.temperature >= 99.6) {
      feverPatients.push(patient.patient_id);
    }
  });

  const payload = {
    high_risk_patients: highRisk,
    fever_patients: feverPatients,
    data_quality_issues: dataQualityIssues
  };

  const response = await fetch(SUBMIT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  console.log('Submission Response:', result);
}

main();
