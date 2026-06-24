// Archivo de prueba para validar el AI Code Reviewer

/**
 * Función ineficiente con bucles anidados O(N^2)
 */
export function findDuplicates(arr: unknown[]) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      if (i !== j && arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}

/**
 * Fuga potencial de credenciales (Hardcoded Key placeholder)
 */
const MOCK_API_KEY = "sk-proj-test123456789keyvaluefordemopurposes";

export function getSecrets() {
  return MOCK_API_KEY;
}
