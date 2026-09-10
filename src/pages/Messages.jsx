import React, { useEffect, useRef, useState } from 'react';
import messageService from '../services/messageService';
import Loading from '../components/Loading';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Messages() {
  const { user, viewingBusiness, isSuperAdmin } = useAuth();
  const { refreshMessageCount, refreshMunicipalitiesTotal } = useNotifications();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const threadLabel = isSuperAdmin && viewingBusiness ? viewingBusiness.name : (user?.businessName || 'your municipality');

  const loadMessages = () => {
    setLoading(true);
    messageService
      .getAll()
      .then((data) => {
        setMessages(data);
        // The backend just marked this thread read on our side as a side
        // effect of loading it — reflect that in the badge right away
        // instead of waiting for the next poll.
        refreshMessageCount();
        refreshMunicipalitiesTotal();
      })
      .catch(() => setError('Failed to load messages.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMessages();
    // Intentionally run once per mount, not on every change to
    // refreshMessageCount/refreshMunicipalitiesTotal: this page always
    // fully remounts when the business context actually changes (entering
    // or exiting a municipality navigates to a different route), so a
    // fresh load already happens at the right time without re-running this
    // effect on unrelated auth-state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setSending(true);
    setError('');
    try {
      await messageService.send(subject.trim(), body.trim(), files);
      setSubject('');
      setBody('');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadMessages();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async (message, attachment) => {
    try {
      await messageService.download(message.id, attachment);
    } catch {
      alert('Failed to download this document.');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Messages</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>
            Communication and shared documents with {threadLabel}.
          </p>
        </div>
      </div>

      {/* Compose */}
      <form
        onSubmit={handleSend}
        style={{
          background: '#fff',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          required
          style={{ ...inputStyle, fontWeight: 700, marginBottom: '0.6rem' }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', marginBottom: '0.6rem' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} id="message-files" />
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              📎 Attach Documents
            </Button>
            {files.length > 0 && (
              <span style={{ marginLeft: '0.6rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {files.length} file{files.length === 1 ? '' : 's'} selected
              </span>
            )}
          </div>
          <Button type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send'}</Button>
        </div>

        {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '0.6rem' }}>{error}</div>}
      </form>

      {/* Thread */}
      {loading && <Loading label="Loading messages…" />}

      {!loading && messages.length === 0 && (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius)' }}>
          No messages yet. Start the conversation above.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {messages.map((m) => (
          <MessageCard key={m.id} message={m} currentUsername={user?.username} onDownload={handleDownload} />
        ))}
      </div>
    </div>
  );
}

function MessageCard({ message, currentUsername, onDownload }) {
  const [attachments, setAttachments] = useState(null);
  const isOwn = message.sender?.username === currentUsername;
  const senderIsPlatform = message.sender?.role === 'SUPER_ADMIN';

  useEffect(() => {
    messageService.getAttachments(message.id).then(setAttachments).catch(() => setAttachments([]));
  }, [message.id]);

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${senderIsPlatform ? 'var(--color-black)' : 'var(--color-primary)'}`,
        borderRadius: 'var(--radius)',
        padding: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.4rem' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{message.subject}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {message.sender?.fullName || message.sender?.username || 'Unknown'}
            {senderIsPlatform ? ' · Platform Admin' : ''}
            {isOwn ? ' (you)' : ''}
            {' · '}{formatDate(message.createdAt)}
          </div>
        </div>
      </div>

      {message.body && (
        <p style={{ margin: '0.4rem 0 0.6rem', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{message.body}</p>
      )}

      {attachments && attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.6rem' }}>
          {attachments.map((a) => (
            <button
              key={a.id}
              onClick={() => onDownload(message, a)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'var(--color-primary-light)', border: '1px solid var(--color-border)',
                borderRadius: 999, padding: '0.35rem 0.75rem', fontSize: '0.8rem',
                color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer',
              }}
            >
              📄 {a.fileName} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{formatSize(a.fileSizeBytes)}</span>
              <span style={{ marginLeft: '0.2rem' }}>⬇</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.55rem 0.7rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  fontSize: '0.9rem',
};
