import type { Profile } from "./model";
const first = [
  "Aarav",
  "Ananya",
  "Rohan",
  "Meera",
  "Kabir",
  "Ishita",
  "Arjun",
  "Priya",
  "Vihaan",
  "Sana",
  "Dev",
  "Naina",
  "Aditya",
  "Tara",
  "Neil",
  "Aisha",
  "Ishan",
  "Kavya",
  "Rishi",
  "Zoya",
  "Dhruv",
  "Diya",
  "Kunal",
  "Avni",
  "Rehan",
  "Myra",
  "Yash",
  "Rhea",
  "Siddharth",
  "Siya",
];
// Explicit labels for fictional demo records; the app never infers gender from a real name.
const demoGender: Record<string, "man" | "woman"> = {
  Aarav: "man",
  Ananya: "woman",
  Rohan: "man",
  Meera: "woman",
  Kabir: "man",
  Ishita: "woman",
  Arjun: "man",
  Priya: "woman",
  Vihaan: "man",
  Sana: "woman",
  Dev: "man",
  Naina: "woman",
  Aditya: "man",
  Tara: "woman",
  Neil: "man",
  Aisha: "woman",
  Ishan: "man",
  Kavya: "woman",
  Rishi: "man",
  Zoya: "woman",
  Dhruv: "man",
  Diya: "woman",
  Kunal: "man",
  Avni: "woman",
  Rehan: "man",
  Myra: "woman",
  Yash: "man",
  Rhea: "woman",
  Siddharth: "man",
  Siya: "woman",
  Rahul: "man",
};
const last = [
  "Shah",
  "Rao",
  "Mehta",
  "Kapoor",
  "Sen",
  "Iyer",
  "Malhotra",
  "Das",
  "Bhat",
  "Khanna",
  "Sethi",
  "Verma",
  "Menon",
  "Bose",
  "Gill",
  "Nair",
  "Roy",
  "Joshi",
  "Saxena",
  "Suri",
  "Basu",
  "Bajaj",
  "Dutta",
  "Sinha",
  "Shetty",
];
export const cities = [
  "Mumbai",
  "Bengaluru",
  "Delhi",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Singapore",
  "Dubai",
  "London",
];
const jobs = [
  "Product designer",
  "Founder",
  "Architect",
  "Research scientist",
  "Marketing lead",
  "Software engineer",
  "Investment analyst",
  "Doctor",
  "Design director",
  "Strategy consultant",
  "Writer",
  "Product manager",
];
const hobbies = [
  "Slow travel",
  "Live music",
  "Sunday hikes",
  "Cooking",
  "Art & museums",
  "Books",
  "Photography",
  "Tennis",
  "Coffee trails",
  "Theatre",
  "Gardening",
  "Running",
];
export function makeProfiles(count = 1500): Profile[] {
  return Array.from({ length: count }, (_, i) => {
    const name =
      i === 0
        ? "Priya Shah"
        : i === 1
          ? "Rahul Mehta"
          : `${first[i % first.length]} ${last[Math.floor(i / first.length) % last.length]}`;
    const city = cities[i % cities.length];
    const smoking = i % 11 === 0 ? "Unknown" : i % 7 === 0 ? "Yes" : "No";
    const children = i % 9 === 0 ? "Unknown" : i % 4 === 0 ? "No" : "Yes";
    const source = `Fictional intake / TDC-${String(i + 1).padStart(4, "0")}`;
    const p: Profile = {
      key: `TDC-${String(i + 1).padStart(4, "0")}`,
      name,
      age: 27 + ((i * 7) % 16),
      gender: demoGender[name.split(" ")[0]] ?? "woman",
      city,
      role: jobs[(i * 7) % jobs.length],
      initials: name
        .split(" ")
        .map((n) => n[0])
        .join(""),
      hue: 100 + ((i * 31) % 110),
      bio: `Enjoys ${hobbies[i % 12].toLowerCase()}, ${hobbies[(i + 5) % 12].toLowerCase()} and conversations that go somewhere. Looking for a thoughtful, grounded partnership.`,
      interests: [
        hobbies[i % 12],
        hobbies[(i + 5) % 12],
        hobbies[(i + 8) % 12],
      ],
      facts: {
        city: { value: city, source, recordedAt: "2026-10-22" },
        smoking: { value: smoking, source, recordedAt: "2026-10-22" },
        children: { value: children, source, recordedAt: "2026-10-22" },
      },
      preferences: [
        {
          field: "smoking",
          value: "No",
          importance: "must",
          confirmed: true,
          quote: "I do not want to date someone who smokes.",
          source,
        },
        {
          field: "city",
          value: city,
          importance: "prefer",
          confirmed: true,
          quote: `I would prefer someone in ${city}, but I am open to discussing location.`,
          source,
        },
        {
          field: "children",
          value: "Yes",
          importance: "prefer",
          confirmed: i % 5 !== 0,
          quote:
            "I think I would like children, but I would want to talk about it.",
          source,
        },
      ],
      source,
      importedAt: "2026-10-22",
    };
    if (i === 0) {
      p.age = 31;
      p.role = "Product design lead";
      p.facts.smoking.value = "No";
      p.facts.children.value = "Yes";
    }
    if (i === 1) {
      p.city = "Pune";
      p.age = 33;
      p.role = "Architect";
      p.facts.city.value = "Pune";
      p.facts.smoking.value = "No";
      p.facts.children.value = "Unknown";
    }
    return p;
  });
}
