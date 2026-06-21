import React, { useEffect } from 'react';
import { useVoiceAgent } from '../hooks/useVoiceAgent';
import './VoiceAgent.css';

export const VoiceAgent: React.FC = () => {
  const { isConnected, isRecording, messages, error, connect, disconnect, startRecording, stopRecording, sendText } = useVoiceAgent();
  const [inputText, setInputText] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendText(inputText);
      setInputText('');
    }
  };

  return (
    <div className="voice-agent">
      <div className="agent-header">
        <h1>🤖 AI Voice Agent</h1>
        <div className="status">
          <span className={`indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="messages-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-label">{msg.role === 'user' ? '👤 You' : '🤖 Agent'}</div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="controls">
        {!isConnected ? (
          <button className="btn btn-primary" onClick={connect}>
            🎤 Connect
          </button>
        ) : (
          <>
            <button className={`btn ${isRecording ? 'btn-stop' : 'btn-record'}`} onClick={isRecording ? stopRecording : startRecording}>
              {isRecording ? '⏹ Stop Recording' : '🎙️ Start Recording'}
            </button>
            <button className="btn btn-secondary" onClick={disconnect}>
              ❌ Disconnect
            </button>
          </>
        )}
      </div>

      {isConnected && (
        <form onSubmit={handleSendText} className="input-form">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="input-field"
          />
          <button type="submit" className="btn btn-primary">
            Send
          </button>
        </form>
      )}
    </div>
  );
};
