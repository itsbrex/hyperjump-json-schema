import fs from "fs";
import * as JsonSchema from "./index.js";
import type { SchemaObject, DialectID, Validator } from "./index.js";
import { expect } from "chai";


type Suite = {
  description: string;
  schema: SchemaObject;
  tests: Test[];
};

type Test = {
  description: string;
  data: unknown;
  valid: boolean;
};

// Tests are only skipped if I have good reason to decide not to fix them. This
// is usually because there has been some tradeoff I've made to not support
// something that doesn't come up in real schemas in favor of something that has
// value.
const skip: Set<string> = new Set([
  // Skip tests for pointers that cross schema resource boundaries. There might
  // be a way to solve this, but because this functionality has been removed
  // from the spec and there is no good reason to do this, it will probably not
  // ever be fixed.
  "|draft6|refRemote.json|base URI change - change folder in subschema",

  // Skip tests that ignore keywords in places that are not schemas such as a
  // $ref in a const. Because this implementation is dialect agnostic, there's
  // no way to know whether a location is a schema or not. Especially since this
  // isn't a real problem that comes up with real schemas, I'm not concerned
  // about making it work.
  "|draft6|id.json|id inside an enum is not a real identifier",
  "|draft6|unknownKeyword.json|$id inside an unknown keyword is not a real identifier",
  "|draft6|ref.json|$ref prevents a sibling $id from changing the base uri",
  "|draft6|ref.json|naive replacement of $ref with its destination is not correct",

  // Skip tests with URNs
  "|draft6|ref.json|simple URN base URI with $ref via the URN",
  "|draft6|ref.json|simple URN base URI with JSON pointer",
  "|draft6|ref.json|URN base URI with NSS",
  "|draft6|ref.json|URN base URI with r-component",
  "|draft6|ref.json|URN base URI with q-component",
  "|draft6|ref.json|URN base URI with URN and JSON pointer ref",
  "|draft6|ref.json|URN base URI with URN and anchor ref"
]);

const shouldSkip = (path: string[]): boolean => {
  let key = "";
  for (const segment of path) {
    key = `${key}|${segment}`;
    if (skip.has(key)) {
      return true;
    }
  }
  return false;
};

const testSuitePath = "./node_modules/json-schema-test-suite";

const addRemotes = (dialectId: DialectID, filePath = `${testSuitePath}/remotes`, url = "") => {
  fs.readdirSync(filePath, { withFileTypes: true })
    .forEach((entry) => {
      if (entry.isFile() && entry.name.endsWith(".json")) {
        const remote = JSON.parse(fs.readFileSync(`${filePath}/${entry.name}`, "utf8")) as SchemaObject;
        try {
          JsonSchema.addSchema(remote, `http://localhost:1234${url}/${entry.name}`, dialectId);
        } catch (error: unknown) {
          console.log(`WARNING: Failed to load remote 'http://localhost:1234${url}/${entry.name}'`);
        }
      } else if (entry.isDirectory()) {
        addRemotes(dialectId, `${filePath}/${entry.name}`, `${url}/${entry.name}`);
      }
    });
};

const runTestSuite = (draft: string, dialectId: DialectID) => {
  const testSuiteFilePath = `${testSuitePath}/tests/${draft}`;

  describe(`${draft} ${dialectId}`, () => {
    before(() => {
      addRemotes(dialectId);
    });

    //[{ name: "type.json" }]
    fs.readdirSync(testSuiteFilePath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .forEach((entry) => {
        const file = `${testSuiteFilePath}/${entry.name}`;

        describe(entry.name, () => {
          const suites = JSON.parse(fs.readFileSync(file, "utf8")) as Suite[];

          suites.forEach((suite) => {
            describe(suite.description, () => {
              let validate: Validator;

              before(async () => {
                if (shouldSkip([draft, entry.name, suite.description])) {
                  return;
                }
                const path = "/" + suite.description.replace(/\s+/g, "-");
                const url = `http://${draft}-test-suite.json-schema.org${path}`;
                JsonSchema.addSchema(suite.schema, url, dialectId);

                validate = await JsonSchema.validate(url);
              });

              suite.tests.forEach((test) => {
                if (shouldSkip([draft, entry.name, suite.description, test.description])) {
                  it.skip(test.description, () => { /* empty */ });
                } else {
                  it(test.description, () => {
                    const output = validate(test.data);
                    expect(output.valid).to.equal(test.valid);
                  });
                }
              });
            });
          });
        });
      });
  });
};

runTestSuite("draft6", "http://json-schema.org/draft-06/schema");