import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  created_time: string;
}

export const videoService = {
  uploadVideo: async (file: File): Promise<{ success: boolean; message: string; videoId?: string }> => {
    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await axios.post(`${API_URL}/api/videos/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data[0]?.success) {
        return {
          success: true,
          message: 'Video başarıyla yüklendi',
          videoId: response.data[0].videoId,
        };
      } else {
        return {
          success: false,
          message: response.data[0]?.error || 'Video yüklenirken bir hata oluştu',
        };
      }
    } catch (error) {
      console.error('Video yükleme hatası:', error);
      return {
        success: false,
        message: 'Video yüklenirken bir hata oluştu',
      };
    }
  },

  getVideos: async (): Promise<Video[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/videos`);
      return response.data;
    } catch (error) {
      console.error('Videolar alınırken hata oluştu:', error);
      return [];
    }
  },
}; 