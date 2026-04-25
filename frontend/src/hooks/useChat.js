import { useState, useCallback } from 'react'
import { askClaude } from '../services/claude'

const WELCOME = {
  role: 'assistant',
  content: null,
  ui: {
    type: 'welcome',
    text: '¡Hola, soy Profi! Describime el trabajo que querés realizar y te calculo un presupuesto orientativo basado en las tarifas actualizadas de Argentina.\n\nEjemplos: *"quiero cambiar el tablero de mi casa de 3 ambientes"* o *"necesito 6 tomas nuevas en un local comercial"*.',
  },
}

export function useChat(userType) {
  const [messages, setMessages] = useState([WELCOME])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Historial en formato API (sin mensajes de UI)
  const getApiHistory = useCallback((msgs) => {
    return msgs
      .filter((m) => m.role !== 'assistant' || m.content)
      .map((m) => ({ role: m.role, content: m.content || m.ui?.text || '' }))
  }, [])

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || loading) return

      const userMsg = { role: 'user', content: text, ui: { type: 'text', text } }
      const next = [...messages, userMsg]
      setMessages(next)
      setLoading(true)
      setError(null)

      try {
        const apiHistory = getApiHistory(next)
        const result = await askClaude(apiHistory, userType)

        const assistantMsg = {
          role: 'assistant',
          content: result.texto,
          ui: {
            type: 'budget',
            text: result.texto,
            items: result.items || [],
            total: result.total || '',
            notas: result.notas || '',
          },
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch (err) {
        setError(err.message || 'Error al conectar con el asistente.')
        const errMsg = {
          role: 'assistant',
          content: 'Hubo un error al procesar tu consulta.',
          ui: {
            type: 'error',
            text: 'No pude procesar tu consulta. Verificá tu conexión e intentá de nuevo.',
          },
        }
        setMessages((prev) => [...prev, errMsg])
      } finally {
        setLoading(false)
      }
    },
    [messages, loading, userType, getApiHistory]
  )

  const clearChat = useCallback(() => {
    setMessages([WELCOME])
    setError(null)
  }, [])

  return { messages, loading, error, sendMessage, clearChat }
}
