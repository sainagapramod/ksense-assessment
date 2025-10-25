import fetch from 'node-fetch';

const API_KEY = 'ak_1161683bcb97c0efa04a376d1578c7a6b33745a4e754a6c1'; // 
const BASE_URL = 'https://assessment.ksenesetech.com/api/patients';
const SUBMIT_URL = 'https://assessment.ksenesetech.com/api/submit-assessment';

let highRisk = [];
let feverPatients = [];
let dataQualityIssues = [];


const parseNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? null : num;
};

function calculateRisk(patient) {
  const { patient_id, age, blood_pressure, temperature } = patient;

  let bpScore = 0, tempScore = 0, ageScore = 0;
  let invalidData = false;

  
  if (blood_pressure && blood_pressure.includes('/')) {
    const [sysStr, diaStr] = blood_pressure.split('/');
    const systolic = parseNumber(sysStr);
    const diastolic = parseNumber(diaStr);

    if (systolic === null || diastolic === null) {
      invalidData = true;
    } else if (systolic >= 140 || diastolic >= 90) {
      bpScore = 3;
    } else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
      bpScore = 2;
    } else if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
      bpScore = 1;
    }
  } else {
    invalidData = true;
  }

  // ------ Temperature ------
  const temp = parseNumber(temperature);
  if (temp === null) {
    invalidData = true;
  } else if (temp >= 101) {
    tempScore = 2;
  } else if (temp >= 99.6) {
    tempScore = 1;
  }

  
  const ageNum = parseNumber(age);
  if (ageNum === null) {
    invalidData = true;
  } else if (ageNum > 65) {
    ageScore = 2;
  } else if (ageNum >= 40) {
    ageScore = 1;
  }

  // ------ Data Quality ------
  if (invalidData) {
    dataQualityIssues.push(patient_id);
  }

  const totalScore = bpScore + tempScore + ageScore;

  
  if (totalScore >= 4) highRisk.push(patient_id);
  if (temp !== null && temp >= 99.6) feverPatients.push(patient_id);
}

async function fetchAllPatients() {
  let allPatients = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    try {
      const response = await fetch(${BASE_URL}?page=${page}&limit=5, {
        headers: { 'x-api-key': API_KEY }
      });

      if (!response.ok) throw new Error('Retry page fetch');

      const result = await response.json();
      allPatients.push(...result.data);

      hasNext = result.pagination.hasNext;
      page++;
    } catch (err) {
      console.log(Retrying page ${page}...);
    }
  }

  return allPatients;
}

async function main() {
  try {
    console.log('Fetching patient data...');
    const patients = await fetchAllPatients();
    console.log(Fetched ${patients.length} patients.);


    patients.forEach(calculateRisk);

    
    const payload = {
      high_risk_patients: [...new Set(highRisk)],
      fever_patients: [...new Set(feverPatients)],
      data_quality_issues: [...new Set(dataQualityIssues)],
    };

    console.log('Submitting results:', payload);

    
    const response = await fetch(SUBMIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Submission Response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error running solution:', error);
  }
}

main();
