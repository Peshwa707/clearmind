import { Bot, User } from 'lucide-react'

/**
 * Single chat message bubble
 */
export default function ChatMessage({ message }) {
  const isBot = message.role === 'assistant'
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className={`chat-message ${isBot ? 'bot' : 'user'}`}>
      {isBot && (
        <div className="message-avatar bot-avatar">
          <Bot size={18} />
        </div>
      )}
      <div className="message-content">
        <div className="message-bubble">
          {message.content}
        </div>
        <span className="message-time">{time}</span>
      </div>
      {!isBot && (
        <div className="message-avatar user-avatar">
          <User size={18} />
        </div>
      )}
    </div>
  )
}
