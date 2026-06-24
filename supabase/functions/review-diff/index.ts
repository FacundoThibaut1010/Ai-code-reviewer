import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'Configuración incorrecta: Falta ANTHROPIC_API_KEY en el servidor' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
      return new Response(
        JSON.stringify({ error: `Error de API de Claude: ${response.status} - ${errorText}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
    return new Response(JSON.stringify({ error: `Error del servidor: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
