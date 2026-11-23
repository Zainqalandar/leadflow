import { toWhatsAppNumber } from "@/lib/places/normalize";

const cases = [
  { input: "0300 1234567", expected: "923001234567" },
  { input: "+92 300 1234567", expected: "923001234567" },
  { input: "0421234567", expected: null },
  { input: "03001234567", expected: "923001234567" },
];

let failed = false;

for (const testCase of cases) {
  const actual = toWhatsAppNumber(testCase.input);
  if (actual !== testCase.expected) {
    failed = true;
    console.error(
      `FAIL ${JSON.stringify(testCase.input)}: expected ${testCase.expected}, got ${actual}`,
    );
  } else {
    console.log(`PASS ${JSON.stringify(testCase.input)} -> ${actual ?? "null"}`);
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("All normalization checks passed.");
}
