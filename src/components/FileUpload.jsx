import React, { useRef, useState } from 'react';
import Button from './Button';

export default function FileUpload({ onUpload, accept = 'image/*', label = 'Upload photo' }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading…' : label}
      </Button>
      {fileName && !error && (
        <span style={{ marginLeft: '0.6rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {fileName}
        </span>
      )}
      {error && (
        <span style={{ marginLeft: '0.6rem', fontSize: '0.8rem', color: 'var(--color-danger)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
