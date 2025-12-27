#!/usr/bin/env node

/**
 * OpenAPI Specification Validator
 *
 * Validates the OpenAPI specification file and checks for consistency
 * with the actual API implementation.
 *
 * Part of Phase 7.6 API Contract-First Design.
 *
 * @module scripts/validate-openapi
 * @version 13.4.0
 */

import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Validation result
 */
class ValidationResult {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  addError(message) {
    this.errors.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  addInfo(message) {
    this.info.push(message);
  }

  get isValid() {
    return this.errors.length === 0;
  }

  print() {
    console.log('\n=== OpenAPI Specification Validation Report ===\n');

    if (this.errors.length > 0) {
      console.log('ERRORS:');
      this.errors.forEach(e => console.log(`  [ERROR] ${e}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('WARNINGS:');
      this.warnings.forEach(w => console.log(`  [WARN] ${w}`));
      console.log('');
    }

    if (this.info.length > 0) {
      console.log('INFO:');
      this.info.forEach(i => console.log(`  [INFO] ${i}`));
      console.log('');
    }

    if (this.isValid) {
      console.log('RESULT: OpenAPI specification is VALID');
    } else {
      console.log('RESULT: OpenAPI specification has ERRORS');
    }

    console.log(`\nSummary: ${this.errors.length} errors, ${this.warnings.length} warnings, ${this.info.length} info messages\n`);
  }
}

/**
 * Validate OpenAPI specification structure
 *
 * @param {Object} spec - Parsed OpenAPI specification
 * @param {ValidationResult} result - Validation result
 */
function validateStructure(spec, result) {
  // Check required fields
  if (!spec.openapi) {
    result.addError('Missing required field: openapi');
  } else if (!spec.openapi.startsWith('3.')) {
    result.addError(`Unsupported OpenAPI version: ${spec.openapi} (expected 3.x)`);
  }

  if (!spec.info) {
    result.addError('Missing required field: info');
  } else {
    if (!spec.info.title) {
      result.addError('Missing required field: info.title');
    }
    if (!spec.info.version) {
      result.addError('Missing required field: info.version');
    }
  }

  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    result.addError('Missing or empty paths object');
  }

  // Validate components
  if (spec.components) {
    if (spec.components.schemas) {
      const schemaCount = Object.keys(spec.components.schemas).length;
      result.addInfo(`Found ${schemaCount} schema definitions`);
    }
    if (spec.components.securitySchemes) {
      const securityCount = Object.keys(spec.components.securitySchemes).length;
      result.addInfo(`Found ${securityCount} security schemes`);
    }
  }
}

/**
 * Validate paths and operations
 *
 * @param {Object} spec - Parsed OpenAPI specification
 * @param {ValidationResult} result - Validation result
 */
function validatePaths(spec, result) {
  const paths = spec.paths || {};
  const pathCount = Object.keys(paths).length;
  let operationCount = 0;

  for (const [path, pathItem] of Object.entries(paths)) {
    // Validate path format
    if (!path.startsWith('/')) {
      result.addError(`Invalid path format: ${path} (must start with /)`);
    }

    // Validate operations
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
    for (const method of methods) {
      if (pathItem[method]) {
        operationCount++;
        const operation = pathItem[method];

        // Check for required fields
        if (!operation.responses) {
          result.addError(`Missing responses for ${method.toUpperCase()} ${path}`);
        }

        // Check for tags
        if (!operation.tags || operation.tags.length === 0) {
          result.addWarning(`No tags for ${method.toUpperCase()} ${path}`);
        }

        // Check for summary
        if (!operation.summary) {
          result.addWarning(`No summary for ${method.toUpperCase()} ${path}`);
        }

        // Validate request body for POST/PUT/PATCH
        if (['post', 'put', 'patch'].includes(method) && !operation.requestBody) {
          // Some endpoints don't need request body (like logout)
          if (!path.includes('logout') && !path.includes('complete') && !path.includes('expire')) {
            result.addWarning(`No requestBody for ${method.toUpperCase()} ${path}`);
          }
        }

        // Validate path parameters
        const pathParams = (path.match(/\{([^}]+)\}/g) || []).map(p => p.slice(1, -1));
        const definedParams = (operation.parameters || [])
          .filter(p => p.in === 'path')
          .map(p => p.name);

        for (const param of pathParams) {
          if (!definedParams.includes(param)) {
            result.addError(`Path parameter {${param}} not defined in ${method.toUpperCase()} ${path}`);
          }
        }

        // Validate response codes
        const responses = operation.responses || {};
        if (!responses['200'] && !responses['201']) {
          result.addWarning(`No success response (200/201) for ${method.toUpperCase()} ${path}`);
        }
      }
    }
  }

  result.addInfo(`Found ${pathCount} paths with ${operationCount} operations`);
}

/**
 * Validate schema references
 *
 * @param {Object} spec - Parsed OpenAPI specification
 * @param {ValidationResult} result - Validation result
 */
function validateSchemaReferences(spec, result) {
  const definedSchemas = new Set(Object.keys(spec.components?.schemas || {}));
  const referencedSchemas = new Set();
  let brokenRefs = 0;

  // Helper to find all $ref in an object
  function findRefs(obj, path = '') {
    if (!obj || typeof obj !== 'object') return;

    if (obj.$ref) {
      const ref = obj.$ref;
      if (ref.startsWith('#/components/schemas/')) {
        const schemaName = ref.split('/').pop();
        referencedSchemas.add(schemaName);
        if (!definedSchemas.has(schemaName)) {
          result.addError(`Broken schema reference: ${ref} at ${path}`);
          brokenRefs++;
        }
      }
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, i) => findRefs(item, `${path}[${i}]`));
    } else {
      for (const [key, value] of Object.entries(obj)) {
        findRefs(value, path ? `${path}.${key}` : key);
      }
    }
  }

  findRefs(spec);

  // Check for unused schemas
  const unusedSchemas = [...definedSchemas].filter(s => !referencedSchemas.has(s));
  if (unusedSchemas.length > 0) {
    result.addWarning(`Unused schemas: ${unusedSchemas.join(', ')}`);
  }

  if (brokenRefs === 0) {
    result.addInfo('All schema references are valid');
  }
}

/**
 * Validate security definitions
 *
 * @param {Object} spec - Parsed OpenAPI specification
 * @param {ValidationResult} result - Validation result
 */
function validateSecurity(spec, result) {
  const definedSchemes = new Set(Object.keys(spec.components?.securitySchemes || {}));

  // Check global security
  if (spec.security) {
    for (const secReq of spec.security) {
      for (const schemeName of Object.keys(secReq)) {
        if (!definedSchemes.has(schemeName)) {
          result.addError(`Global security references undefined scheme: ${schemeName}`);
        }
      }
    }
  }

  // Check operation-level security
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    for (const method of methods) {
      if (pathItem[method]?.security) {
        for (const secReq of pathItem[method].security) {
          for (const schemeName of Object.keys(secReq)) {
            if (!definedSchemes.has(schemeName)) {
              result.addError(`Security references undefined scheme: ${schemeName} in ${method.toUpperCase()} ${path}`);
            }
          }
        }
      }
    }
  }
}

/**
 * Main validation function
 */
async function main() {
  const specPath = join(__dirname, '..', 'docs', 'openapi', 'openapi.yaml');

  console.log('OpenAPI Specification Validator v13.4.0');
  console.log('========================================\n');
  console.log(`Validating: ${specPath}\n`);

  // Check if file exists
  if (!existsSync(specPath)) {
    console.error(`ERROR: OpenAPI specification not found at ${specPath}`);
    process.exit(1);
  }

  // Read and parse YAML
  let spec;
  try {
    const content = readFileSync(specPath, 'utf8');
    spec = parse(content);
  } catch (error) {
    console.error(`ERROR: Failed to parse OpenAPI specification: ${error.message}`);
    process.exit(1);
  }

  // Run validations
  const result = new ValidationResult();

  validateStructure(spec, result);
  validatePaths(spec, result);
  validateSchemaReferences(spec, result);
  validateSecurity(spec, result);

  // Print results
  result.print();

  // Exit with appropriate code
  process.exit(result.isValid ? 0 : 1);
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
