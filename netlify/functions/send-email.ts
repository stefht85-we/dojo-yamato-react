import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function handler(event: any) {
  try {
    const body = JSON.parse(event.body)

    const { nome, email, messaggio } = body

    const data = await resend.emails.send({
      from: 'Dojo Yamato <info@asddojoyamato.it>',
      to: ['info@asddojoyamato.it'],
      subject: `Nuovo contatto da ${nome}`,
      reply_to: email,
      html: `
        <h2>Nuovo messaggio dal sito</h2>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Messaggio:</strong></p>
        <p>${messaggio}</p>
      `,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Errore invio email' }),
    }
  }
}