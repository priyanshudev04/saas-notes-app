import { useState, useEffect, FormEvent } from 'react';
import Cookie from 'js-cookie';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';

interface Note {
  id: string;
  title: string;
  content: string | null;
}

interface UserPayload {
  userId: string;
  tenantId: string;
  role: 'ADMIN' | 'MEMBER';
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'ADMIN' | 'MEMBER' | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = Cookie.get('token');
    if (storedToken) {
      setToken(storedToken);
      try {
        const decoded = jwt.decode(storedToken) as UserPayload;
        setUserRole(decoded.role);
        fetchNotes(storedToken);
      } catch (err) {
        handleLogout();
      }
    } else {
      router.push('/');
    }
  }, [router]);

  const fetchNotes = async (accessToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notes', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch notes.');
      setNotes(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch notes due to an unknown error.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async (title: string, content: string) => {
    setError(null);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchNotes(token!);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create note due to an unknown error.");
      }
    }
  };

  const handleUpdateNote = async (id: string, title: string, content: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchNotes(token!);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update note due to an unknown error.");
      }
    }
  };

  const handleDeleteNote = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete note.');
      fetchNotes(token!);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete note due to an unknown error.");
      }
    }
  };

  const handleUpgrade = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/tenants/${(jwt.decode(token!) as UserPayload).tenantId}/upgrade`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upgrade failed.');
      fetchNotes(token!);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Upgrade failed due to an unknown error.");
      }
    }
  };

  const handleLogout = () => {
    Cookie.remove('token');
    router.push('/');
  };

  if (!token) {
    return null; // Redirecting...
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">My Notes</h1>
        <div className="flex items-center space-x-2">
          {userRole === 'ADMIN' && notes.length >= 3 && (
            <button onClick={handleUpgrade} className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600">Upgrade to Pro</button>
          )}
          <button onClick={handleLogout} className="bg-red-500 text-white p-2 rounded hover:bg-red-600">Logout</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {error}
        </div>
      )}

      <CreateNoteForm onCreateNote={handleCreateNote} noteCount={notes.length} />

      <NoteList notes={notes} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} />
    </div>
  );
}

// Reusable components
const CreateNoteForm = ({ onCreateNote, noteCount }: { onCreateNote: (title: string, content: string) => void; noteCount: number }) => {
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newNoteTitle.trim()) {
      onCreateNote(newNoteTitle, newNoteContent);
      setNewNoteTitle('');
      setNewNoteContent('');
    }
  };

  if (noteCount >= 3) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
        <p className="font-bold">Note Limit Reached</p>
        <p>Please upgrade to the Pro plan to add more notes. (Admin can upgrade)</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 border p-4 rounded-md shadow-sm bg-white">
      <h3 className="text-lg font-bold mb-2">Create New Note</h3>
      <input
        type="text"
        value={newNoteTitle}
        onChange={(e) => setNewNoteTitle(e.target.value)}
        placeholder="Note Title"
        className="w-full p-2 border border-gray-300 rounded mb-2"
        required
      />
      <textarea
        value={newNoteContent}
        onChange={(e) => setNewNoteContent(e.target.value)}
        placeholder="Note Content (Optional)"
        rows={4}
        className="w-full p-2 border border-gray-300 rounded mb-2"
      />
      <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">Add Note</button>
    </form>
  );
};

const NoteList = ({ notes, onUpdateNote, onDeleteNote }: { notes: Note[]; onUpdateNote: (id: string, title: string, content: string) => void; onDeleteNote: (id: string) => void }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleEditClick = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content || '');
  };

  const handleSaveClick = (id: string) => {
    onUpdateNote(id, editTitle, editContent);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {notes.map(note => (
        <div key={note.id} className="p-4 border rounded shadow-sm bg-white">
          {editingId === note.id ? (
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="font-bold text-lg border p-1 rounded"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="border p-1 rounded"
              />
              <div className="flex space-x-2">
                <button onClick={() => handleSaveClick(note.id)} className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">Save</button>
                <button onClick={() => setEditingId(null)} className="bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-bold text-lg">{note.title}</h3>
              {note.content && <p className="text-gray-600 mt-1">{note.content}</p>}
              <div className="flex space-x-2 mt-2">
                <button onClick={() => handleEditClick(note)} className="bg-yellow-500 text-white p-2 rounded-md hover:bg-yellow-600">Edit</button>
                <button onClick={() => onDeleteNote(note.id)} className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600">Delete</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};