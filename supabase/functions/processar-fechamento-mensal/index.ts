import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  manual?: boolean
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Processando fechamento mensal...')

    // Verificar se é execução manual ou automática
    let isManual = false
    if (req.method === 'POST') {
      try {
        const body: RequestBody = await req.json()
        isManual = body.manual || false
      } catch {
        // Se não conseguir fazer parse do body, considera como automático
        isManual = false
      }
    }

    // Se não for execução manual, verificar se é o último dia do mês
    if (!isManual) {
      const { data: shouldProcess, error: checkError } = await supabase
        .rpc('verificar_limpeza_mensal')

      if (checkError) {
        console.error('Erro ao verificar se deve processar:', checkError)
        return new Response(
          JSON.stringify({ error: 'Erro ao verificar condições de processamento' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Se não é o último dia do mês, não processar
      if (!shouldProcess) {
        console.log('Não é o último dia do mês. Não processando.')
        return new Response(
          JSON.stringify({ 
            message: 'Não é o último dia do mês',
            processedCount: 0,
            processed: false
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Executar o processamento do fechamento mensal
    const { data: processedCount, error } = await supabase
      .rpc('processar_fechamento_mensal')

    if (error) {
      console.error('Erro ao processar fechamento mensal:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao processar fechamento mensal' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Fechamento processado. ${processedCount} chamadas pendentes arquivadas.`)

    return new Response(
      JSON.stringify({ 
        message: 'Fechamento mensal processado com sucesso',
        processedCount: processedCount || 0,
        processed: true,
        manual: isManual
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro interno do servidor:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})