import { renderTemplate } from "../lib/templates";

const cases = [
  {
    name: "replaces owner and business placeholders",
    actual: renderTemplate("Assalam o alaikum {naam}, about {business}.", {
      ownerName: "Ayesha",
      name: "Spice Route Cafe",
    }),
    expected: "Assalam o alaikum Ayesha, about Spice Route Cafe.",
  },
  {
    name: "uses sahab when owner name is empty",
    actual: renderTemplate("Salam {naam}!", { ownerName: "  ", name: "Shop" }),
    expected: "Salam sahab!",
  },
  {
    name: "replaces every occurrence",
    actual: renderTemplate("{business} — {business}, {naam}.", {
      ownerName: "Ali",
      name: "Cafe One",
    }),
    expected: "Cafe One — Cafe One, Ali.",
  },
];

let failed = false;
for (const testCase of cases) {
  if (testCase.actual === testCase.expected) {
    console.log(`PASS ${testCase.name}`);
  } else {
    failed = true;
    console.error(`FAIL ${testCase.name}: expected ${testCase.expected}; got ${testCase.actual}`);
  }
}

if (failed) process.exitCode = 1;
