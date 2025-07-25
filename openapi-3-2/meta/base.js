export default {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$dynamicAnchor": "meta",

  "title": "OAS Base Vocabulary",
  "description": "A JSON Schema Vocabulary used in the OpenAPI Schema Dialect",

  "type": ["object", "boolean"],
  "properties": {
    "example": true,
    "discriminator": { "$ref": "#/$defs/discriminator" },
    "externalDocs": { "$ref": "#/$defs/external-docs" },
    "xml": { "$ref": "#/$defs/xml" }
  },
  "$defs": {
    "extensible": {
      "patternProperties": {
        "^x-": true
      }
    },
    "discriminator": {
      "$ref": "#/$defs/extensible",
      "type": "object",
      "properties": {
        "propertyName": {
          "type": "string"
        },
        "mapping": {
          "type": "object",
          "additionalProperties": {
            "type": "string"
          }
        }
      },
      "required": ["propertyName"],
      "unevaluatedProperties": false
    },
    "external-docs": {
      "$ref": "#/$defs/extensible",
      "type": "object",
      "properties": {
        "url": {
          "type": "string",
          "format": "uri-reference"
        },
        "description": {
          "type": "string"
        }
      },
      "required": ["url"],
      "unevaluatedProperties": false
    },
    "xml": {
      "$ref": "#/$defs/extensible",
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "namespace": {
          "type": "string",
          "format": "uri"
        },
        "prefix": {
          "type": "string"
        },
        "attribute": {
          "type": "boolean"
        },
        "wrapped": {
          "type": "boolean"
        }
      },
      "unevaluatedProperties": false
    }
  }
};
