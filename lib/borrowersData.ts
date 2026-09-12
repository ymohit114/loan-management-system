export interface BorrowerProfile {
  id: number;
  name: string;
  phone: string;
  area: string;
  idType: string;
  idNum: string;
  guarantor: string;
}

export const BASE_43_BORROWERS: BorrowerProfile[] = [
  { id: 1, name: 'Ramesh Kumar Verma', phone: '+91 98110 11001', area: 'Sector 12, Market', idType: 'Aadhaar', idNum: '4123 8812 1001', guarantor: 'Suresh Verma (Brother)' },
  { id: 2, name: 'Sunita Sharma', phone: '+91 98110 11002', area: 'Gandhi Nagar, Ward 4', idType: 'Aadhaar', idNum: '4123 8812 1002', guarantor: 'Rajesh Sharma (Spouse)' },
  { id: 3, name: 'Anil Kumar Yadav', phone: '+91 98110 11003', area: 'Adarsh Colony, Gali 2', idType: 'PAN Card', idNum: 'ABCY1003D', guarantor: 'Ram Yadav (Father)' },
  { id: 4, name: 'Manoj Gupta', phone: '+91 98110 11004', area: 'Main Bazaar, Shop 14', idType: 'Aadhaar', idNum: '4123 8812 1004', guarantor: 'Pawan Gupta (Friend)' },
  { id: 5, name: 'Priya Patel', phone: '+91 98110 11005', area: 'Navrangpura, Cross Rd', idType: 'Voter ID', idNum: 'GJ/01/1005', guarantor: 'Kiran Patel (Father)' },
  { id: 6, name: 'Rajesh Choudhary', phone: '+91 98110 11006', area: 'Shastri Nagar', idType: 'Aadhaar', idNum: '4123 8812 1006', guarantor: 'Vikram Choudhary (Brother)' },
  { id: 7, name: 'Deepak Singh', phone: '+91 98110 11007', area: 'Civil Lines, House 45', idType: 'Driving License', idNum: 'DL-04-1007', guarantor: 'Amar Singh (Father)' },
  { id: 8, name: 'Neha Mishra', phone: '+91 98110 11008', area: 'Shivaji Chowk', idType: 'Aadhaar', idNum: '4123 8812 1008', guarantor: 'Alok Mishra (Spouse)' },
  { id: 9, name: 'Suresh Jain', phone: '+91 98110 11009', area: 'Sarafa Bazaar', idType: 'PAN Card', idNum: 'ABCP1009K', guarantor: 'Navin Jain (Brother)' },
  { id: 10, name: 'Rekha Devi', phone: '+91 98110 11010', area: 'Subhash Nagar', idType: 'Aadhaar', idNum: '4123 8812 1010', guarantor: 'Madan Lal (Spouse)' },
  { id: 11, name: 'Ajay Meena', phone: '+91 98110 11011', area: 'Kalyan Nagar', idType: 'Aadhaar', idNum: '4123 8812 1011', guarantor: 'Sunil Meena (Brother)' },
  { id: 12, name: 'Pooja Joshi', phone: '+91 98110 11012', area: 'Vidhyadhar Nagar', idType: 'Voter ID', idNum: 'RJ/02/1012', guarantor: 'Mahesh Joshi (Father)' },
  { id: 13, name: 'Vikas Rawat', phone: '+91 98110 11013', area: 'Raja Park', idType: 'Aadhaar', idNum: '4123 8812 1013', guarantor: 'Kailash Rawat (Uncle)' },
  { id: 14, name: 'Kavita Saini', phone: '+91 98110 11014', area: 'Malviya Nagar', idType: 'Aadhaar', idNum: '4123 8812 1014', guarantor: 'Gopal Saini (Spouse)' },
  { id: 15, name: 'Rahul Saxena', phone: '+91 98110 11015', area: 'Vaishali Sector 3', idType: 'PAN Card', idNum: 'ABCS1015R', guarantor: 'Nitin Saxena (Friend)' },
  { id: 16, name: 'Geeta Rani', phone: '+91 98110 11016', area: 'Old City, Gali 9', idType: 'Aadhaar', idNum: '4123 8812 1016', guarantor: 'Santosh Kumar (Spouse)' },
  { id: 17, name: 'Sanjay Tiwari', phone: '+91 98110 11017', area: 'Hanuman Mandir Rd', idType: 'Aadhaar', idNum: '4123 8812 1017', guarantor: 'Vinay Tiwari (Brother)' },
  { id: 18, name: 'Meena Kumari', phone: '+91 98110 11018', area: 'Indira Colony', idType: 'Voter ID', idNum: 'UP/14/1018', guarantor: 'Prem Chand (Spouse)' },
  { id: 19, name: 'Ashok Pandey', phone: '+91 98110 11019', area: 'Station Road', idType: 'Aadhaar', idNum: '4123 8812 1019', guarantor: 'Rakesh Pandey (Son)' },
  { id: 20, name: 'Shweta Dubey', phone: '+91 98110 11020', area: 'Nehru Ground', idType: 'Aadhaar', idNum: '4123 8812 1020', guarantor: 'Siddharth Dubey (Spouse)' },
  { id: 21, name: 'Amit Chauhan', phone: '+91 98110 11021', area: 'Transport Nagar', idType: 'Driving License', idNum: 'UP-16-1021', guarantor: 'Devendra Chauhan (Brother)' },
  { id: 22, name: 'Babita Maurya', phone: '+91 98110 11022', area: 'Patel Nagar', idType: 'Aadhaar', idNum: '4123 8812 1022', guarantor: 'Jagdish Maurya (Father)' },
  { id: 23, name: 'Dharmendra Prajapati', phone: '+91 98110 11023', area: 'Kumbhar Mohalla', idType: 'Aadhaar', idNum: '4123 8812 1023', guarantor: 'Hira Prajapati (Brother)' },
  { id: 24, name: 'Pinki Roy', phone: '+91 98110 11024', area: 'Lake Road', idType: 'Voter ID', idNum: 'WB/08/1024', guarantor: 'Subhash Roy (Father)' },
  { id: 25, name: 'Ravi Shankar', phone: '+91 98110 11025', area: 'Vasant Vihar', idType: 'PAN Card', idNum: 'ABCR1025S', guarantor: 'Harish Shankar (Friend)' },
  { id: 26, name: 'Seema Thakur', phone: '+91 98110 11026', area: 'Krishna Nagar', idType: 'Aadhaar', idNum: '4123 8812 1026', guarantor: 'Rohit Thakur (Spouse)' },
  { id: 27, name: 'Jitendra Soni', phone: '+91 98110 11027', area: 'Swarnkar Market', idType: 'Aadhaar', idNum: '4123 8812 1027', guarantor: 'Babulal Soni (Father)' },
  { id: 28, name: 'Aarti Das', phone: '+91 98110 11028', area: 'Tagore Garden', idType: 'Aadhaar', idNum: '4123 8812 1028', guarantor: 'Bikram Das (Spouse)' },
  { id: 29, name: 'Mukesh Rathore', phone: '+91 98110 11029', area: 'Kalyan Ji Rasta', idType: 'Aadhaar', idNum: '4123 8812 1029', guarantor: 'Govind Rathore (Brother)' },
  { id: 30, name: 'Mamta Sen', phone: '+91 98110 11030', area: 'Bapu Bazaar', idType: 'Voter ID', idNum: 'RJ/01/1030', guarantor: 'Kishan Sen (Spouse)' },
  { id: 31, name: 'Narendra Lodhi', phone: '+91 98110 11031', area: 'Kisan Mandi', idType: 'Aadhaar', idNum: '4123 8812 1031', guarantor: 'Bhagwan Lodhi (Father)' },
  { id: 32, name: 'Ritu Agarwal', phone: '+91 98110 11032', area: 'Aggarwal Farm', idType: 'PAN Card', idNum: 'ABCA1032G', guarantor: 'Pankaj Agarwal (Spouse)' },
  { id: 33, name: 'Rohit Kushwaha', phone: '+91 98110 11033', area: 'Subji Mandi', idType: 'Aadhaar', idNum: '4123 8812 1033', guarantor: 'Dinesh Kushwaha (Brother)' },
  { id: 34, name: 'Manju Pal', phone: '+91 98110 11034', area: 'Rajeev Nagar', idType: 'Aadhaar', idNum: '4123 8812 1034', guarantor: 'Ramlal Pal (Spouse)' },
  { id: 35, name: 'Santosh Bunkar', phone: '+91 98110 11035', area: 'Weavers Colony', idType: 'Aadhaar', idNum: '4123 8812 1035', guarantor: 'Mohan Bunkar (Father)' },
  { id: 36, name: 'Jyoti Kushwah', phone: '+91 98110 11036', area: 'Surajpole', idType: 'Voter ID', idNum: 'RJ/04/1036', guarantor: 'Lalit Kushwah (Spouse)' },
  { id: 37, name: 'Satish Jangid', phone: '+91 98110 11037', area: 'Carpenter Lane', idType: 'Aadhaar', idNum: '4123 8812 1037', guarantor: 'Bhawani Jangid (Brother)' },
  { id: 38, name: 'Sarita Sahu', phone: '+91 98110 11038', area: 'Oil Mill Compound', idType: 'Aadhaar', idNum: '4123 8812 1038', guarantor: 'Hemant Sahu (Spouse)' },
  { id: 39, name: 'Vinod Gour', phone: '+91 98110 11039', area: 'Brahmapuri', idType: 'Aadhaar', idNum: '4123 8812 1039', guarantor: 'Girish Gour (Brother)' },
  { id: 40, name: 'Usha Tomar', phone: '+91 98110 11040', area: 'Police Line Road', idType: 'PAN Card', idNum: 'ABCT1040U', guarantor: 'Ajit Tomar (Spouse)' },
  { id: 41, name: 'Pawan Vishwakarma', phone: '+91 98110 11041', area: 'Industrial Area', idType: 'Aadhaar', idNum: '4123 8812 1041', guarantor: 'Anand Vishwakarma (Father)' },
  { id: 42, name: 'Sunita Baghel', phone: '+91 98110 11042', area: 'Ganga Vihar', idType: 'Aadhaar', idNum: '4123 8812 1042', guarantor: 'Devraj Baghel (Spouse)' },
  { id: 43, name: 'Kamal Kishore', phone: '+91 98110 11043', area: 'Railway Colony', idType: 'Aadhaar', idNum: '4123 8812 1043', guarantor: 'Shyam Kishore (Brother)' },
];

// Dynamically generated extended pool for long-horizon simulations (60, 120 months)
const FIRST_NAMES = [
  'Vikram', 'Sangeeta', 'Prakash', 'Anita', 'Kailash', 'Sunil', 'Reena', 'Lalit', 'Pooja', 'Rakesh',
  'Deepak', 'Suman', 'Govind', 'Meenakshi', 'Arun', 'Kiran', 'Hemant', 'Bhavna', 'Naveen', 'Shalini',
  'Dinesh', 'Geetanjali', 'Suraj', 'Vimla', 'Tarun', 'Rashmi', 'Rajendra', 'Manish', 'Kusum', 'Bhagwan',
  'Anand', 'Preeti', 'Virendra', 'Mamta', 'Gopal', 'Urmila', 'Chandra', 'Santosh', 'Kamlesh', 'Roshni',
];

const LAST_NAMES = [
  'Rathore', 'Soni', 'Meena', 'Rawat', 'Jain', 'Verma', 'Gupta', 'Sharma', 'Tiwari', 'Yadav',
  'Joshi', 'Choudhary', 'Prajapat', 'Sen', 'Saxena', 'Malviya', 'Saini', 'Bunkar', 'Gour', 'Tomar',
  'Vishwakarma', 'Baghel', 'Kishore', 'Dubey', 'Patel', 'Pandey', 'Mishra', 'Chauhan', 'Roy', 'Thakur',
];

const AREAS = [
  'Shastri Circle', 'New Sanganer Rd', 'Tonk Phatak', 'Mansarovar Sec 7', 'Ajmer Road',
  'Khatipura', 'Jhotwara', 'C-Scheme', 'Vidhyadhar Nagar', 'Malviya Industrial Area',
  'Raja Park Gali 4', 'Civil Lines', 'Sodala Market', 'Bapu Nagar', 'Pratap Nagar'
];

export const ALL_BORROWERS: BorrowerProfile[] = [
  ...BASE_43_BORROWERS,
  ...Array.from({ length: 157 }, (_, i) => {
    const id = 44 + i;
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 7 + 3) % LAST_NAMES.length];
    const area = AREAS[i % AREAS.length];
    const guarantorFirstName = FIRST_NAMES[(i + 5) % FIRST_NAMES.length];
    const relations = ['Brother', 'Spouse', 'Father', 'Uncle', 'Friend'];
    const relation = relations[i % relations.length];

    return {
      id,
      name: `${firstName} ${lastName}`,
      phone: `+91 98110 ${String(11000 + id).slice(-5)}`,
      area,
      idType: i % 3 === 0 ? 'PAN Card' : i % 3 === 1 ? 'Voter ID' : 'Aadhaar',
      idNum: `4123 8812 ${String(1000 + id).slice(-4)}`,
      guarantor: `${guarantorFirstName} ${lastName} (${relation})`,
    };
  }),
];

export function getBorrowerById(id: number): BorrowerProfile {
  const found = ALL_BORROWERS.find((b) => b.id === id);
  if (found) return found;
  return {
    id,
    name: `Borrower #${id}`,
    phone: `+91 98110 ${String(11000 + id).slice(-5)}`,
    area: 'Branch Area',
    idType: 'Aadhaar',
    idNum: `4123 8812 ${String(1000 + id).slice(-4)}`,
    guarantor: 'Verified Guarantor',
  };
}
