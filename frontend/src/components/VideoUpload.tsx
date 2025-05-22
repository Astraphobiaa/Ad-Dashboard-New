// frontend/src/components/VideoUpload.tsx
import React, { useState, ChangeEvent } from 'react';
import axios from 'axios';
import { Box, Button, Typography } from '@mui/material';

interface VideoUploadProps {
  projectId: number;
  onUploaded: (ids: string[]) => void;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ projectId, onUploaded }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const formatError = (data: any): string => {
    if (typeof data === 'string') return data;
    if (data?.errors) {
      return Object.values(data.errors).flat().join(', ');
    }
    if (data?.title) return data.title;
    return JSON.stringify(data);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError('');
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      const res = await axios.post<
          { ok: boolean; fbVideoId: string; thumbnailUrl: string; videoId: number }[]
      >(`/api/projects/${projectId}/videos/upload`, formData);
      const ids = res.data.filter(r => r.ok).map(r => r.fbVideoId);
      onUploaded(ids);
      alert('Videolar başarıyla yüklendi.');
    } catch (err: any) {
      const msg = formatError(err.response?.data ?? err.message);
      setError(msg);
      alert('Hata: ' + msg);
    } finally {
      setUploading(false);
    }
  };

  return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Videoları Yükle
        </Typography>
        <input type="file" accept="video/*" multiple onChange={handleChange} />
        {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
        )}
        <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            sx={{ mt: 2 }}
        >
          {uploading ? 'Yükleniyor…' : 'Yükle'}
        </Button>
      </Box>
  );
};

export default VideoUpload;
