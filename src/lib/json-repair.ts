export function repairJson(json: string): string {
  let insideString = false;
  let escaped = false;
  const stack: ('{' | '[')[] = [];

  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      insideString = !insideString;
      continue;
    }
    if (!insideString) {
      if (char === '{') {
        stack.push('{');
      } else if (char === '[') {
        stack.push('[');
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }
  }

  let repaired = json;
  if (insideString) {
    repaired += '"';
  }

  // Trim trailing characters that would cause syntax errors before closing brackets
  repaired = repaired.trim();
  
  // Keep doing this until no more trailing commas or colons exist
  while (repaired.endsWith(',') || repaired.endsWith(':')) {
    if (repaired.endsWith(',')) {
      repaired = repaired.slice(0, -1).trim();
    } else if (repaired.endsWith(':')) {
      // If it ends with key:, we append null so it parses as a key: null pair
      repaired += ' null';
      break;
    }
  }

  // Close open brackets/braces from the stack
  const localStack = [...stack];
  while (localStack.length > 0) {
    const last = localStack.pop();
    if (last === '{') {
      repaired += '}';
    } else if (last === '[') {
      repaired += ']';
    }
  }

  return repaired;
}

export function parsePartialJson<T>(json: string): Partial<T> {
  if (!json || json.trim() === '') {
    return {} as Partial<T>;
  }

  try {
    return JSON.parse(json);
  } catch {
    try {
      const repaired = repairJson(json);
      return JSON.parse(repaired);
    } catch {
      // Fallback: try parsing line by line or return empty object
      return {} as Partial<T>;
    }
  }
}
