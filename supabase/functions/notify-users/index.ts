import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const payload = await req.json()
    const ticket = payload.record 

    console.log(`🔔 Processando Ticket #${ticket.id}: ${ticket.Title}`)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'jcgomes@salesgroup.pt', 
        subject: `Ticket #${ticket.id} | ${ticket.Title}`,
        html: `
          <h2 style="color: #333;">Detalhes do Pedido</h2>
          <p><strong>Tipo:</strong> ${ticket.Type || 'N/A'}</p>
          <p><strong>Estado:</strong> ${ticket.Status}</p>
          <p><strong>Prioridade:</strong> ${ticket.Priority}</p>
          <p><strong>Atribuído a:</strong> ${ticket["Assigned To"] || 'Não definido'}</p>
          <p><strong>Data de Conclusão:</strong> ${ticket["End Date"] || 'Sem data'}</p>
          <p><strong>Solicitante:</strong> ${ticket["User Email"] || 'N/A'}</p>
          <hr />
          <h3>Descrição:</h3>
          <p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">
            ${ticket.Description || 'Sem descrição detalhada.'}
          </p>
          <br />
          <small>Enviado automaticamente pelo Sistema de Gestão de Pendentes</small>
        `,
      }),
    })

    const data = await res.json()
    console.log("✉️ Resposta do Resend:", data)
    
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (error) {
    console.error("❌ Erro:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})