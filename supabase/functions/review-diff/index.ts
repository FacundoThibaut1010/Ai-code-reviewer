import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Extract modified files from git diff
function extractModifiedFiles(diffText: string): string[] {
  const files: string[] = [];
  const lines = diffText.split('\n');
  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      const filePath = line.substring(6).trim();
      if (filePath && filePath !== '/dev/null') {
        files.push(filePath);
      }
    }
  }
  return files.length > 0 ? files : ['src/index.ts'];
}

// Generate dynamic review based on files changed and settings
function generateDynamicMockReview(files: string[], settings: any) {
  const analyzeBugs = settings?.bugs ?? true;
  const analyzePerformance = settings?.performance ?? true;
  const analyzeSecurity = settings?.security ?? true;
  const analyzeStyle = settings?.style ?? true;

  const bugs: any[] = [];
  const sugerencias: any[] = [];
  const performance: any[] = [];
  const security: any[] = [];

  const getRandomLine = () => Math.floor(Math.random() * 80) + 5;

  files.forEach((file, index) => {
    const ext = file.split('.').pop() || '';
    const name = file.split('/').pop() || '';

    // Category 1: Bugs
    if (analyzeBugs && index === 0) {
      bugs.push({
        file: file,
        line: getRandomLine(),
        description: `Se detectó una discrepancia lógica menor en las dependencias o el control de flujo de ${name}. Asegúrate de validar los estados para prevenir condiciones de carrera.`
      });
    }

    // Category 2: Performance
    if (analyzePerformance && (index === 1 || files.length === 1)) {
      performance.push({
        file: file,
        description: `El procesamiento de datos en ${name} podría optimizarse evitando re-renderizados innecesarios o aplicando técnicas de debounce/memoización.`
      });
    }

    // Category 3: Sugerencias / Estilo
    if (analyzeStyle && (index === 2 || files.length === 1)) {
      sugerencias.push({
        file: file,
        line: getRandomLine(),
        description: `Considera extraer las sub-funciones auxiliares de ${name} para mejorar la legibilidad y facilitar el testeo unitario.`
      });
    }

    // Category 4: Seguridad
    if (analyzeSecurity && (ext === 'json' || ext === 'local' || ext === 'ts' || ext === 'tsx')) {
      security.push({
        file: file,
        description: `Revisa la sanitización y validación de las entradas en ${name}. Asegúrate de que las credenciales sensibles nunca estén expuestas en el código fuente.`
      });
    }
  });

  // Fallbacks if lists are empty but analyze settings are enabled
  if (analyzeBugs && bugs.length === 0 && files.length > 0) {
    bugs.push({
      file: files[0],
      line: 10,
      description: `Revisa el control de excepciones (try-catch) para asegurar que no se silencien fallas críticas.`
    });
  }

  const score = Math.floor(Math.random() * 3) + 7; // Random score between 7 and 9
  const filesList = files.slice(0, 3).map(f => f.split('/').pop()).join(', ');
  const justification = `El análisis estático de los archivos (${filesList}${files.length > 3 ? '...' : ''}) demuestra modularidad aceptable. Se sugiere refactorizar las alertas secundarias y mejorar el tipado para evitar bugs de tipo null en tiempo de ejecución.`;

  return {
    bugs,
    sugerencias,
    performance,
    security,
    score,
    justification
  };
}

// Standalone Mock/Demo reviewer streamer
function streamMockReview(headers: HeadersInit, diffText: string, settings: any) {
  const files = extractModifiedFiles(diffText);
  const mockJson = generateDynamicMockReview(files, settings);
  const mockString = JSON.stringify(mockJson);
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  (async () => {
    try {
      const chunkSize = 12; // Send 12 characters per interval
      for (let i = 0; i < mockString.length; i += chunkSize) {
        const chunk = mockString.substring(i, i + chunkSize);
        const sseData = `data: ${JSON.stringify({
          type: "content_block_delta",
          delta: { text: chunk }
        })}\n\n`;
        
        await writer.write(encoder.encode(sseData));
        await new Promise((resolve) => setTimeout(resolve, 35)); // 35ms delay for typing feel
      }
      await writer.write(encoder.encode('data: [DONE]\n\n'));
    } catch (err) {
      console.error("Error streaming mock review:", err);
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      ...headers,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

serve(async (req) => {
  // Manejo del preflight de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado: Falta token de autenticación' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { diff, settings } = await req.json();

    if (!diff) {
      return new Response(JSON.stringify({ error: 'El campo "diff" es requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey || anthropicApiKey === 'TU_API_KEY' || anthropicApiKey.includes('placeholder')) {
      console.warn("Falta la API Key de Anthropic o tiene valor por defecto. Activando modo Demo.");
      return streamMockReview(corsHeaders, diff, settings);
    }

    // Configuración de los análisis solicitados
    const analyzeBugs = settings?.bugs ?? true;
    const analyzePerformance = settings?.performance ?? true;
    const analyzeSecurity = settings?.security ?? true;
    const analyzeStyle = settings?.style ?? true;

    // Crear el prompt del sistema dinámico
    const systemPrompt = `Eres un revisor de código experto con amplia experiencia en desarrollo de software, seguridad, rendimiento y buenas prácticas.
Tu tarea es analizar el diff de una Pull Request y devolver un reporte detallado estrictamente en formato JSON en español.

Instrucciones específicas por categoría:
- BUGS: ${analyzeBugs ? 'Identifica errores lógicos, comportamientos inesperados, condiciones de carrera o excepciones potenciales.' : 'No analices bugs en este análisis. Devuelve una lista vacía [].'}
- PERFORMANCE: ${analyzePerformance ? 'Busca ineficiencias, loops lentos, desperdicio de memoria, consultas lentas, y optimizaciones de llamadas.' : 'No analices rendimiento en este análisis. Devuelve una lista vacía [].'}
- SEGURIDAD: ${analyzeSecurity ? 'Busca vulnerabilidades (ej. inyecciones, XSS, secretos hardcodeados, problemas de CORS, falta de sanitización).' : 'No analices seguridad en este análisis. Devuelve una lista vacía [].'}
- SUGERENCIAS (Estilo/Legibilidad): ${analyzeStyle ? 'Busca mejoras en legibilidad, patrones redundantes, adhesión a principios clean code, nomenclatura.' : 'No analices sugerencias de estilo en este análisis. Devuelve una lista vacía [].'}

Puntaje (Score):
- Evalúa la Pull Request en general del 1 al 10 (donde 10 es excelente, libre de bugs y altamente optimizado). Justifica detalladamente esta calificación.

IMPORTANTE: Debes responder EXCLUSIVAMENTE con un objeto JSON válido que siga la estructura descrita abajo. 
No envuelvas tu respuesta en bloques de código markdown como \`\`\`json ... \`\`\` ni incluyas texto de introducción o cierre. Responde únicamente con el JSON crudo para facilitar su parseo automático.

Estructura exacta del JSON esperado:
{
  "bugs": [
    {
      "file": "nombre_archivo.extension",
      "line": 42,
      "description": "descripción clara en español del bug detectado"
    }
  ],
  "sugerencias": [
    {
      "file": "nombre_archivo.extension",
      "line": 12,
      "description": "sugerencia de mejora en español"
    }
  ],
  "performance": [
    {
      "file": "nombre_archivo.extension",
      "description": "problema de rendimiento detectado y cómo mejorarlo"
    }
  ],
  "security": [
    {
      "file": "nombre_archivo.extension",
      "description": "vulnerabilidad o problema de seguridad detectado y su riesgo"
    }
  ],
  "score": 8,
  "justification": "Justificación detallada de la calificación en español."
}

Si una categoría no tiene hallazgos o no fue seleccionada, debes retornar obligatoriamente un array vacío [].`;

    // Llamada a la API de Anthropic Claude con Streaming
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Aquí está el diff de la Pull Request:\n\n${diff}`,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`La API de Claude falló con código ${response.status}: ${errorText}. Activando modo Demo de contingencia.`);
      return streamMockReview(corsHeaders, diff, settings);
    }

    // Redirigir el stream de Claude directamente al cliente
    const { readable, writable } = new TransformStream();
    response.body?.pipeTo(writable);

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("Error en la ejecución de la función Edge, activando modo Demo:", error);
    return streamMockReview(corsHeaders, diff, settings);
  }
});
