import { useState } from 'react';
import axios from 'axios';

export default function Chat() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) return;

    setMessages(prev => [...prev, { type: 'user', text: question }]);
    
    try {
      const response = await axios.post('http://localhost:5000/api/ask', { question });
      setMessages(prev => [...prev, { type: 'bot', text: response.data.answer }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { type: 'bot', text: "Sorry, I couldn't answer." }]);
    }

    setQuestion('');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4 font-bold">Customer Support Chat</h1>

      <div className="border rounded p-4 h-96 overflow-y-scroll mb-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-3 py-2 rounded ${msg.type === 'user' ? 'bg-blue-200' : 'bg-gray-200'}`}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="border rounded-l p-2 flex-1"
          placeholder="Ask a question..."
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-r">Send</button>
      </form>
    </div>
  );
}
