// Script to add 43 customers with 20 EMIs of ₹4,050 each
const customersData = [
  { name: 'Ramesh Kumar Verma', phone: '+91 98110 11001', area: 'Sector 12, Market', idType: 'Aadhaar', idNum: '4123 8812 1001', guarantor: 'Suresh Verma (Brother)' },
  { name: 'Sunita Sharma', phone: '+91 98110 11002', area: 'Gandhi Nagar, Ward 4', idType: 'Aadhaar', idNum: '4123 8812 1002', guarantor: 'Rajesh Sharma (Spouse)' },
  { name: 'Anil Kumar Yadav', phone: '+91 98110 11003', area: 'Adarsh Colony, Gali 2', idType: 'PAN Card', idNum: 'ABCY1003D', guarantor: 'Ram Yadav (Father)' },
  { name: 'Manoj Gupta', phone: '+91 98110 11004', area: 'Main Bazaar, Shop 14', idType: 'Aadhaar', idNum: '4123 8812 1004', guarantor: 'Pawan Gupta (Friend)' },
  { name: 'Priya Patel', phone: '+91 98110 11005', area: 'Navrangpura, Cross Rd', idType: 'Voter ID', idNum: 'GJ/01/1005', guarantor: 'Kiran Patel (Father)' },
  { name: 'Rajesh Choudhary', phone: '+91 98110 11006', area: 'Shastri Nagar', idType: 'Aadhaar', idNum: '4123 8812 1006', guarantor: 'Vikram Choudhary (Brother)' },
  { name: 'Deepak Singh', phone: '+91 98110 11007', area: 'Civil Lines, House 45', idType: 'Driving License', idNum: 'DL-04-1007', guarantor: 'Amar Singh (Father)' },
  { name: 'Neha Mishra', phone: '+91 98110 11008', area: 'Shivaji Chowk', idType: 'Aadhaar', idNum: '4123 8812 1008', guarantor: 'Alok Mishra (Spouse)' },
  { name: 'Suresh Jain', phone: '+91 98110 11009', area: 'Sarafa Bazaar', idType: 'PAN Card', idNum: 'ABCP1009K', guarantor: 'Navin Jain (Brother)' },
  { name: 'Rekha Devi', phone: '+91 98110 11010', area: 'Subhash Nagar', idType: 'Aadhaar', idNum: '4123 8812 1010', guarantor: 'Madan Lal (Spouse)' },
  { name: 'Ajay Meena', phone: '+91 98110 11011', area: 'Kalyan Nagar', idType: 'Aadhaar', idNum: '4123 8812 1011', guarantor: 'Sunil Meena (Brother)' },
  { name: 'Pooja Joshi', phone: '+91 98110 11012', area: 'Vidhyadhar Nagar', idType: 'Voter ID', idNum: 'RJ/02/1012', guarantor: 'Mahesh Joshi (Father)' },
  { name: 'Vikas Rawat', phone: '+91 98110 11013', area: 'Raja Park', idType: 'Aadhaar', idNum: '4123 8812 1013', guarantor: 'Kailash Rawat (Uncle)' },
  { name: 'Kavita Saini', phone: '+91 98110 11014', area: 'Malviya Nagar', idType: 'Aadhaar', idNum: '4123 8812 1014', guarantor: 'Gopal Saini (Spouse)' },
  { name: 'Rahul Saxena', phone: '+91 98110 11015', area: 'Vaishali Sector 3', idType: 'PAN Card', idNum: 'ABCS1015R', guarantor: 'Nitin Saxena (Friend)' },
  { name: 'Geeta Rani', phone: '+91 98110 11016', area: 'Old City, Gali 9', idType: 'Aadhaar', idNum: '4123 8812 1016', guarantor: 'Santosh Kumar (Spouse)' },
  { name: 'Sanjay Tiwari', phone: '+91 98110 11017', area: 'Hanuman Mandir Rd', idType: 'Aadhaar', idNum: '4123 8812 1017', guarantor: 'Vinay Tiwari (Brother)' },
  { name: 'Meena Kumari', phone: '+91 98110 11018', area: 'Indira Colony', idType: 'Voter ID', idNum: 'UP/14/1018', guarantor: 'Prem Chand (Spouse)' },
  { name: 'Ashok Pandey', phone: '+91 98110 11019', area: 'Station Road', idType: 'Aadhaar', idNum: '4123 8812 1019', guarantor: 'Rakesh Pandey (Son)' },
  { name: 'Shweta Dubey', phone: '+91 98110 11020', area: 'Nehru Ground', idType: 'Aadhaar', idNum: '4123 8812 1020', guarantor: 'Siddharth Dubey (Spouse)' },
  { name: 'Amit Chauhan', phone: '+91 98110 11021', area: 'Transport Nagar', idType: 'Driving License', idNum: 'UP-16-1021', guarantor: 'Devendra Chauhan (Brother)' },
  { name: 'Babita Maurya', phone: '+91 98110 11022', area: 'Patel Nagar', idType: 'Aadhaar', idNum: '4123 8812 1022', guarantor: 'Jagdish Maurya (Father)' },
  { name: 'Dharmendra Prajapati', phone: '+91 98110 11023', area: 'Kumbhar Mohalla', idType: 'Aadhaar', idNum: '4123 8812 1023', guarantor: 'Hira Prajapati (Brother)' },
  { name: 'Pinki Roy', phone: '+91 98110 11024', area: 'Lake Road', idType: 'Voter ID', idNum: 'WB/08/1024', guarantor: 'Subhash Roy (Father)' },
  { name: 'Ravi Shankar', phone: '+91 98110 11025', area: 'Vasant Vihar', idType: 'PAN Card', idNum: 'ABCR1025S', guarantor: 'Harish Shankar (Friend)' },
  { name: 'Seema Thakur', phone: '+91 98110 11026', area: 'Krishna Nagar', idType: 'Aadhaar', idNum: '4123 8812 1026', guarantor: 'Rohit Thakur (Spouse)' },
  { name: 'Jitendra Soni', phone: '+91 98110 11027', area: 'Swarnkar Market', idType: 'Aadhaar', idNum: '4123 8812 1027', guarantor: 'Babulal Soni (Father)' },
  { name: 'Aarti Das', phone: '+91 98110 11028', area: 'Tagore Garden', idType: 'Aadhaar', idNum: '4123 8812 1028', guarantor: 'Bikram Das (Spouse)' },
  { name: 'Mukesh Rathore', phone: '+91 98110 11029', area: 'Kalyan Ji Rasta', idType: 'Aadhaar', idNum: '4123 8812 1029', guarantor: 'Govind Rathore (Brother)' },
  { name: 'Mamta Sen', phone: '+91 98110 11030', area: 'Bapu Bazaar', idType: 'Voter ID', idNum: 'RJ/01/1030', guarantor: 'Kishan Sen (Spouse)' },
  { name: 'Narendra Lodhi', phone: '+91 98110 11031', area: 'Kisan Mandi', idType: 'Aadhaar', idNum: '4123 8812 1031', guarantor: 'Bhagwan Lodhi (Father)' },
  { name: 'Ritu Agarwal', phone: '+91 98110 11032', area: 'Aggarwal Farm', idType: 'PAN Card', idNum: 'ABCA1032G', guarantor: 'Pankaj Agarwal (Spouse)' },
  { name: 'Rohit Kushwaha', phone: '+91 98110 11033', area: 'Subji Mandi', idType: 'Aadhaar', idNum: '4123 8812 1033', guarantor: 'Dinesh Kushwaha (Brother)' },
  { name: 'Manju Pal', phone: '+91 98110 11034', area: 'Rajeev Nagar', idType: 'Aadhaar', idNum: '4123 8812 1034', guarantor: 'Ramlal Pal (Spouse)' },
  { name: 'Santosh Bunkar', phone: '+91 98110 11035', area: 'Weavers Colony', idType: 'Aadhaar', idNum: '4123 8812 1035', guarantor: 'Mohan Bunkar (Father)' },
  { name: 'Jyoti Kushwah', phone: '+91 98110 11036', area: 'Surajpole', idType: 'Voter ID', idNum: 'RJ/04/1036', guarantor: 'Lalit Kushwah (Spouse)' },
  { name: 'Satish Jangid', phone: '+91 98110 11037', area: 'Carpenter Lane', idType: 'Aadhaar', idNum: '4123 8812 1037', guarantor: 'Bhawani Jangid (Brother)' },
  { name: 'Sarita Sahu', phone: '+91 98110 11038', area: 'Oil Mill Compound', idType: 'Aadhaar', idNum: '4123 8812 1038', guarantor: 'Hemant Sahu (Spouse)' },
  { name: 'Vinod Gour', phone: '+91 98110 11039', area: 'Brahmapuri', idType: 'Aadhaar', idNum: '4123 8812 1039', guarantor: 'Girish Gour (Brother)' },
  { name: 'Usha Tomar', phone: '+91 98110 11040', area: 'Police Line Road', idType: 'PAN Card', idNum: 'ABCT1040U', guarantor: 'Ajit Tomar (Spouse)' },
  { name: 'Pawan Vishwakarma', phone: '+91 98110 11041', area: 'Industrial Area', idType: 'Aadhaar', idNum: '4123 8812 1041', guarantor: 'Anand Vishwakarma (Father)' },
  { name: 'Sunita Baghel', phone: '+91 98110 11042', area: 'Ganga Vihar', idType: 'Aadhaar', idNum: '4123 8812 1042', guarantor: 'Devraj Baghel (Spouse)' },
  { name: 'Kamal Kishore', phone: '+91 98110 11043', area: 'Railway Colony', idType: 'Aadhaar', idNum: '4123 8812 1043', guarantor: 'Shyam Kishore (Brother)' },
];

async function seed() {
  console.log(`Starting bulk onboarding of ${customersData.length} borrowers...`);
  
  let successCount = 0;
  for (let i = 0; i < customersData.length; i++) {
    const item = customersData[i];

    // 1. Create Customer
    const custRes = await fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: item.name,
        phone: item.phone,
        address: item.area,
        id_type: item.idType,
        id_number: item.idNum,
        guarantor_name: item.guarantor,
        guarantor_phone: item.phone.replace('98110', '98220'),
        guarantor_relation: 'Guarantor',
        notes: `Customer #${i + 1} of 43 - 20 EMI Scheme @ ₹4,050/mo`,
        status: 'active'
      })
    });

    const custJson = await custRes.json();
    if (!custJson.success) {
      console.error(`Failed to create customer ${item.name}:`, custJson.error);
      continue;
    }

    const customerId = custJson.data.id;

    // 2. Disburse Loan:
    // Principal: ₹60,000, 1.75% monthly flat rate, 20 months
    // Total interest = ₹21,000. Total payable = ₹81,000.
    // Monthly EMI = ₹4,050.
    const loanRes = await fetch('http://localhost:3000/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: customerId,
        principal: 60000,
        interest_rate: 1.75,
        rate_type: 'monthly',
        calculation_type: 'flat',
        frequency: 'monthly',
        tenure_value: 20,
        tenure_unit: 'months',
        disbursal_date: '2026-09-01',
        first_payment_date: '2026-10-01',
        processing_fee: 1000,
        collateral_details: 'Signed Promissory Note & Blank Cheque',
        notes: '20 Months Scheme, Monthly EMI: ₹4,050'
      })
    });

    const loanJson = await loanRes.json();
    if (loanJson.success) {
      successCount++;
      console.log(`[${successCount}/43] Added ${item.name} -> Loan ${loanJson.data.loan_code} (20 EMIs x ₹4,050 = ₹81,000)`);
    } else {
      console.error(`Failed to create loan for ${item.name}:`, loanJson.error);
    }
  }

  console.log(`\nSuccessfully onboarded ${successCount} customers with active loans of 20 EMIs @ ₹4,050/month!`);
}

seed().catch(err => console.error(err));
