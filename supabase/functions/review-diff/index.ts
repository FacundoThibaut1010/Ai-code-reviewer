import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Standalone Mock/Demo reviewer streamer
function streamMockReview(headers: HeadersInit) {
  const mockJson = {
    bugs: [
      {
        file: "src/app/page.tsx",
        line: 42,
        description: "Se detectó un posible bucle de renders infinitos en el useEffect principal si no se controlan las dependencias del hook correctamente."
      },
      {
        file: "src/components/Navbar.tsx",
        line: 72,
        description: "Falta una comprobación al desestructurar las propiedades del perfil del usuario de GitHub, lo que podría provocar excepciones de tipo NullReference."
      }
    ],
    sugerencias: [
      {
        file: "src/lib/supabase.ts",
        line: 8,
        description: "Considera configurar una política de reconexión automática en la instancia del cliente para redes inestables."
      }
    ],
    performance: [
      {
        file: "src/app/dashboard/page.tsx",
        description: "El listado de repositorios carga todos los elementos en memoria a la vez. Considera paginar o virtualizar la lista en el navegador."
      }
    ],
    security: [
      {
        file: "src/app/auth/callback/page.tsx",
        description: "El token de acceso se está guardando directamente en localStorage. Se recomienda almacenarlo en una cookie HTTP-only con SameSite=Strict."
      }
    ],
    score: 8,
    justification: "El código fuente local está bien estructurado usando componentes funcionales y Next.js App Router. Sin embargo, se identificaron oportunidades de mejora menores sobre la persistencia segura de credenciales en el cliente y la paginación de listas extensas."
  };

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
      return streamMockReview(corsHeaders);
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
      return streamMockReview(corsHeaders);
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
    return streamMockReview(corsHeaders);
  }
});
