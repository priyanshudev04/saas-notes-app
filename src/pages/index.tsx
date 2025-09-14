// File: src/pages/index.tsx

import { useState, useEffect, FormEvent } from 'react';
import Cookie from 'js-cookie';

interface Note {
  id: string;
  title: string;
  content: string | null;
}

export default function HomePage() {
  // State management
  const [token, setToken] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Login Form State ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- New Note Form State ---
  const [newNoteTitle, setNewNoteTitle] = useState('');

  // Check for token on component mount
  useEffect(() => {
    const storedToken = Cookie.get('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);
  
  // Fetch notes when token is available
  useEffect(() => {
    if (token) {
      fetchNotes();
    }
  }, [token]);


  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notes', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch notes.');
      const data = await res.json();
      setNotes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed.');
      
      Cookie.set('token', data.token, { expires: 1 }); // Expires in 1 day
      setToken(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateNote = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
        const res = await fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ title: newNoteTitle }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        setNewNoteTitle('');
        fetchNotes(); // Refresh list
    } catch (err: any) {
        setError(err.message);
    }
  };
  
  const handleLogout = () => {
    Cookie.remove('token');
    setToken(null);
    setNotes([]);
  };

  // Render Login Form if not authenticated
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <form onSubmit={handleLogin} className="p-8 bg-white rounded shadow-md w-96">
            <h2 className="text-2xl font-bold mb-4">Login</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {/* Input fields for email and password */}
            <button type="submit" disabled={isLoading} className="w-full bg-blue-500 text-white p-2 rounded">
                {isLoading ? 'Logging in...' : 'Login'}
            </button>
        </form>
      </div>
    );
  }

  // Render Notes Dashboard if authenticated
  return (
    <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">My Notes</h1>
            <button onClick={handleLogout} className="bg-red-500 text-white p-2 rounded">Logout</button>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        {/* Create Note Form / Upgrade Message */}
        {notes.length < 3 ? (
             <form onSubmit={handleCreateNote} className="mb-6">
                <input 
                    type="text" 
                    value={newNoteTitle} 
                    onChange={(e) => setNewNoteTitle(e.target.value)} 
                    placeholder="New note title" 
                    className="border p-2 rounded w-full mb-2"
                />
                <button type="submit" className="bg-green-500 text-white p-2 rounded w-full">Add Note</button>
            </form>
        ) : (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
                <p className="font-bold">Note Limit Reached</p>
                <p>Please upgrade to the Pro plan to add more notes. (Admin can upgrade)</p>
            </div>
        )}
       

        {/* Notes List */}
        <div className="space-y-4">
            {notes.map(note => (
                <div key={note.id} className="p-4 border rounded shadow">
                    <h3 className="font-bold text-lg">{note.title}</h3>
                </div>
            ))}
        </div>
    </div>
  );
}