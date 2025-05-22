import React, { useState, useEffect } from 'react';
import { videoService, Video } from '../services/videoService';
import { Button, Table, message, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

interface VideoManagerProps {
  onVideoSelect?: (videoId: string) => void;
  isSelectable?: boolean;
}

const VideoManager: React.FC<VideoManagerProps> = ({ onVideoSelect, isSelectable = false }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const videoList = await videoService.getVideos();
      setVideos(videoList);
    } catch (error) {
      message.error('Videolar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    try {
      const result = await videoService.uploadVideo(file as File);
      if (result.success) {
        message.success(result.message);
        fetchVideos();
        onSuccess?.(result);
      } else {
        message.error(result.message);
        onError?.(new Error(result.message));
      }
    } catch (error) {
      message.error('Video yüklenirken bir hata oluştu');
      onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: 'Video',
      dataIndex: 'thumbnail_url',
      key: 'thumbnail_url',
      render: (url: string) => (
        url ? <img src={url} alt="Video thumbnail" style={{ width: 120, height: 68 }} /> : 'Önizleme yok'
      ),
    },
    {
      title: 'Başlık',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Yüklenme Tarihi',
      dataIndex: 'created_time',
      key: 'created_time',
      render: (date: string) => new Date(date).toLocaleDateString('tr-TR'),
    },
    ...(isSelectable
      ? [
          {
            title: 'İşlem',
            key: 'action',
            render: (_: any, record: Video) => (
              <Button
                type="primary"
                onClick={() => onVideoSelect?.(record.id)}
              >
                Seç
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <Upload
        customRequest={handleUpload}
        showUploadList={false}
        accept="video/*"
      >
        <Button icon={<UploadOutlined />} loading={uploading}>
          Video Yükle
        </Button>
      </Upload>

      <Table
        columns={columns}
        dataSource={videos}
        loading={loading}
        rowKey="id"
        style={{ marginTop: 16 }}
      />
    </div>
  );
};

export default VideoManager; 