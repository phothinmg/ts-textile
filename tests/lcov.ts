import fs from "node:fs/promises";
import path from "node:path";
import { parse, format, merge, sum, badge, LCOV } from "lcov-utils";

const locvFile = path.resolve(process.cwd(), "tests/lcov.info");
const contents = await fs.readFile(locvFile, "utf8");
const lcovJson = parse(contents); // transforms to JSON
const str = format(lcovJson); // equals to contents

const covbadge = badge(lcovJson);

console.log(covbadge);

//await fs.writeFile("tests/lcov.json", JSON.stringify(lcovJson, null, 2));
