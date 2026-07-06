const fs = require('fs');

const employeeMap = {
  "Alice Johnson": "Aarti Desai",
  "Bob Smith": "Bala Murugan",
  "Charlie Davis": "Chitra Iyer",
  "Diana Prince": "Deepak Kumar",
  "Evan Wright": "Eshaan Verma",
  "Fiona Gallagher": "Farhan Qureshi", // just in case
  "George Costanza": "Gaurav Singh"
};

const leadNameMap = {
  "Sarah Jenkins": "Priya Sharma",
  "Emily Watson": "Neha Gupta",
  "Jessica Taylor": "Sneha Reddy",
  "Sofia Rodriguez": "Pooja Patel",
  "Chloe Bennett": "Anjali Deshmukh",
  "Michael Chang": "Rahul Jain",
  "David Kim": "Amit Kumar",
  "Laura Martinez": "Riya Singh",
  "James Wilson": "Suresh Raina",
  "William Brown": "Karthik Nair",
  "Isabella Smith": "Meera Menon",
  "Mason Garcia": "Ravi Teja",
  "Olivia Jones": "Kavya Iyer",
  "Daniel Miller": "Sanjay Dutt",
  "Sophia Davis": "Geeta Phogat",
  "Elijah Garcia": "Arun Jaitley",
  "Mia Rodriguez": "Rekha Bhardwaj",
  "Alexander Martinez": "Rajesh Khanna",
  "Charlotte Hernandez": "Radhika Apte",
  "James Lopez": "Siddharth Malhotra",
  "Amelia Gonzalez": "Alia Bhatt",
  "Benjamin Wilson": "Varun Dhawan",
  "Harper Anderson": "Kareena Kapoor",
  "Lucas Thomas": "Ranbir Kapoor",
  "Evelyn Taylor": "Deepika Padukone",
  "Mason Moore": "Salman Khan",
  "Abigail Jackson": "Katrina Kaif",
  "Michael Martin": "Shah Rukh Khan",
  "Emily Lee": "Priyanka Chopra",
  "Daniel Perez": "Aamir Khan",
  "Elizabeth Thompson": "Aishwarya Rai",
  "Henry White": "Hrithik Roshan",
  "Avery Harris": "Anushka Sharma",
  "Jackson Sanchez": "Akshay Kumar",
  "Sofia Clark": "Sonam Kapoor",
  "Sebastian Ramirez": "Ajay Devgn",
  "Ella Lewis": "Kajol Devgn",
  "Jack Robinson": "Saif Ali Khan",
  "Grace Walker": "Madhuri Dixit",
  "Luke Young": "Sunny Deol",
  "Chloe Allen": "Juhi Chawla",
  "Jayden King": "Govinda Ahuja",
  "Victoria Wright": "Karisma Kapoor",
  "Dylan Scott": "Anil Kapoor",
  "Madison Torres": "Shilpa Shetty",
  "Leo Nguyen": "Sunil Shetty",
  "Zoey Hill": "Raveena Tandon",
  "Carter Flores": "Jackie Shroff",
  "Penelope Green": "Tabu Hashmi",
  "Wyatt Adams": "Sanjay Kapoor",
  "Layla Nelson": "Twinkle Khanna",
  "Jayden Baker": "Bobby Deol",
  "Riley Hall": "Preity Zinta",
  "Gabriel Rivera": "Arbaaz Khan"
};

let content = fs.readFileSync('server.ts', 'utf8');

// Replace Employee Names
for (const [oldName, newName] of Object.entries(employeeMap)) {
  content = content.split(oldName).join(newName);
}

// Replace non-Indian Lead Names
for (const [oldName, newName] of Object.entries(leadNameMap)) {
  content = content.split(oldName).join(newName);
}

// Just globally match some other common names that might be in there and replace them to random Indian names
const namesRegex = /name: "([A-Z][a-z]+) ([A-Z][a-z]+)"/g;
let match;
while ((match = namesRegex.exec(content)) !== null) {
  const oldName = match[1] + " " + match[2];
  if (!oldName.match(/(Mehta|Sharma|Nair|Malhotra|Patil|Desai|Murugan|Iyer|Kumar|Verma|Gupta|Reddy|Patel|Deshmukh|Jain|Singh|Raina|Menon|Teja|Dutt|Phogat|Jaitley|Bhardwaj|Khanna|Apte|Malhotra|Bhatt|Dhawan|Kapoor|Padukone|Khan|Kaif|Chopra|Rai|Roshan|Devgn|Dixit|Deol|Chawla|Ahuja|Shetty|Tandon|Shroff|Hashmi|Zinta)/i) &&
      !["Arjun Mehta", "Rohan Sharma", "Aditya Nair", "Vikram Malhotra", "Pranav Patil"].includes(oldName)) {
    console.log("Unreplaced old name:", oldName);
    // Replace with a generic Indian name
    const newName = "Vivek " + match[2];
    content = content.split(oldName).join(newName);
  }
}

fs.writeFileSync('server.ts', content);
