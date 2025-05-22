// src/services/facebookAdsApi.ts
import axios, { isAxiosError } from 'axios';

export interface Campaign {
  id: string;  // API field from backend
  name: string; // API field from backend 
  status: 'PAUSED' | 'ACTIVE';
  // Add any other fields that might be in the response
  adSets?: any[];
  ads?: any[];
}

export interface CreateCampaignPayload {
  name: string; // Backend expects this field name
  objective: string; // Using string for flexibility with API versions
  status: 'PAUSED' | 'ACTIVE'; // Backend expects this field name
  special_ad_categories?: string[];
  spendCap?: number;
  startTime?: string; // Backend expects this field name
  stopTime?: string; // Backend expects this field name
  buyingType: 'AUCTION' | 'FIXED_CPM' | 'RESERVED';
}

export interface CreateCampaignResponse {
  campaignId: string;
  adSetId?: string;
  creativeIds?: string[];
  adIds?: string[];
}

export interface CreateAdSetPayload {
  campaignId: string;
  name: string; // Backend expects this field name
  dailyBudget: number; // Backend expects this field name
  status?: 'PAUSED' | 'ACTIVE'; // Backend expects this field name
  billingEvent?: 'IMPRESSIONS' | 'LINK_CLICKS';
  optimizationGoal?: string;
  bidAmount: number; // Required for Facebook's bidding strategy
  bidStrategy?: 'LOWEST_COST_WITH_BID_CAP' | 'LOWEST_COST_WITHOUT_CAP' | 'COST_CAP'; // Strategy for bidding
  minimumRoasTarget?: number; // Required for ROAS optimization
  targeting: {
    geoLocations: { countries: string[] };
    ageMin: number;
    ageMax: number;
    genders: number[];
    publisherPlatforms?: string[];
    devicePlatforms?: string[];
    placements?: any;
    flexibleSpec?: any[];
    exclusionSpec?: any[];
    locales?: string[];
  };
  startTime?: string; // Backend expects this field name
  stopTime?: string; // Backend expects this field name
  selectedVideoIds: string[];
}

export interface CreateAdSetResponse {
  adSetId: string;
  creativeIds?: string[];
  adIds?: string[];
}

export interface AdSet {
  id: string;
  name: string;
  status: 'PAUSED' | 'ACTIVE';
  dailyBudget: number;
  campaignId: string;
}

export interface Insight {
  date: string;
  impressions: number;
  reach: number;
  spend: number;
  cpi: number;
}

export interface VideoDto {
  id: string;
  title: string;
  thumbnailUrl: string;
  createdTime: string;
}

const api = axios.create({ baseURL: '/api' });

// Add request and response interceptors for debugging
api.interceptors.request.use(request => {
  console.log('API Request:', {
    url: request.url,
    method: request.method,
    headers: request.headers,
    data: request.data,
    params: request.params
  });
  return request;
}, error => {
  console.error('Request error:', error);
  if (error.request) {
    console.error('Request details:', error.request);
  }
  return Promise.reject(error);
});

api.interceptors.response.use(response => {
  console.log('API Response:', {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    data: response.data
  });
  return response;
}, error => {
  console.error('Response error:', error);
  if (error.response) {
    console.error('Error response details:', {
      status: error.response.status,
      statusText: error.response.statusText,
      headers: error.response.headers,
      data: error.response.data
    });
  } else if (error.request) {
    console.error('No response received from server:', error.request);
  } else {
    console.error('Error message:', error.message);
  }
  return Promise.reject(error);
});

export const getCampaigns = async (): Promise<Campaign[]> => {
  try {
    console.log('Calling GET /campaigns API endpoint');
    const res = await api.get<Campaign[]>('/campaigns');
    console.log('Raw campaign response:', res.data);
    
    // In case the API returns a different structure
    if (Array.isArray(res.data)) {
      return res.data;
    } else if (res.data && typeof res.data === 'object') {
      // Attempt to extract campaigns array if wrapped in a container object
      const possibleArrays = Object.values(res.data).filter(Array.isArray);
      if (possibleArrays.length > 0) {
        console.log('Found campaigns array in response object');
        return possibleArrays[0] as Campaign[];
      }
    }
    
    console.warn('Unexpected campaigns response format:', res.data);
    return [];
  } catch (error) {
    console.error('getCampaigns failed:', error);
    let errorMessage = 'Failed to get campaigns';
    if (isAxiosError(error) && error.response) {
      errorMessage = error.response.data?.error || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

export const getAdSets = async (campaignId?: string): Promise<AdSet[]> => {
  try {
    if (campaignId) {
      console.log(`Calling GET /campaigns/${campaignId}/adsets API endpoint for specific campaign`);
      const res = await api.get<AdSet[]>(`/campaigns/${campaignId}/adsets`);
      console.log('Raw ad sets response for campaign:', res.data);
      
      // Handle different response formats
      if (Array.isArray(res.data)) {
        console.log(`Found ${res.data.length} ad sets for campaign ${campaignId}`);
        return res.data.map(adSet => ({
          ...adSet,
          // Ensure campaignId is set if it's not in the response
          campaignId: adSet.campaignId || campaignId
        }));
      } else if (res.data && typeof res.data === 'object') {
        // Attempt to extract adSets array if wrapped in a container object
        const possibleArrays = Object.values(res.data).filter(Array.isArray);
        if (possibleArrays.length > 0) {
          console.log('Found ad sets array in response object');
          const adSets = possibleArrays[0] as AdSet[];
          return adSets.map(adSet => ({
            ...adSet,
            // Ensure campaignId is set if it's not in the response
            campaignId: adSet.campaignId || campaignId
          }));
        }
      }
      
      console.warn('Unexpected ad sets response format:', res.data);
      return [];
    } else {
      console.log('Calling GET /campaigns/adsets API endpoint for all ad sets');
      const res = await api.get<AdSet[]>('/campaigns/adsets');
      console.log('Raw ad sets response (all):', res.data);
    
    // Handle different response formats
    if (Array.isArray(res.data)) {
        console.log(`Found ${res.data.length} total ad sets`);
      return res.data;
    } else if (res.data && typeof res.data === 'object') {
      // Attempt to extract adSets array if wrapped in a container object
      const possibleArrays = Object.values(res.data).filter(Array.isArray);
      if (possibleArrays.length > 0) {
        console.log('Found ad sets array in response object');
        return possibleArrays[0] as AdSet[];
      }
    }
    
    console.warn('Unexpected ad sets response format:', res.data);
    return [];
    }
  } catch (error) {
    console.error('getAdSets failed:', error);
    let errorMessage = 'Failed to get ad sets';
    if (isAxiosError(error) && error.response) {
      errorMessage = error.response.data?.error || error.message;
      console.error('API error details:', error.response.data);
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

export const createCampaign = async (
    payload: Partial<CreateCampaignPayload>
): Promise<CreateCampaignResponse> => {
  try {
    console.log('createCampaign called with payload:', JSON.stringify(payload, null, 2));
    
    // Ensure all required fields are present
    if (!payload.name) throw new Error('Campaign name is required');
    if (!payload.objective) throw new Error('Campaign objective is required');
    if (!payload.status) throw new Error('Campaign status is required');
    
    console.log(`Making POST request to ${api.defaults.baseURL}/campaigns`);
    
    try {
      const res = await api.post<CreateCampaignResponse>('/campaigns', payload, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('createCampaign successful:', res.data);
      return res.data;
    } catch (axiosError) {
      console.error('createCampaign axios error:', axiosError);
      
      if (isAxiosError(axiosError)) {
        // Extract detailed error information from response
        if (axiosError.response) {
          const statusCode = axiosError.response.status;
          const responseData = axiosError.response.data;
          
          console.error('API Error Status:', statusCode);
          console.error('API Error Response:', responseData);
          
          // Create a detailed error object that contains all error information
          const errorDetail = {
            message: 'Failed to create campaign',
            status: statusCode,
            data: responseData
          };
          
          let errorMessage = 'Failed to create campaign';
          
          // Handle different error formats but preserve the full error data
          if (typeof responseData === 'object') {
            if (responseData.error) {
              errorMessage = typeof responseData.error === 'string' 
                ? responseData.error 
                : `Error: ${JSON.stringify(responseData.error)}`;
            } else if (responseData.message) {
              errorMessage = responseData.message;
            }
          } else if (typeof responseData === 'string') {
            errorMessage = responseData;
          }
          
          // Create an error object with the message, but attach the full error details
          const error = new Error(errorMessage) as Error & { detail?: any };
          error.detail = errorDetail;
          throw error;
        } else if (axiosError.request) {
          // Request was made but no response received
          throw new Error('Network error: No response received from server');
        } else {
          // Error setting up the request
          throw new Error(`Request setup error: ${axiosError.message}`);
        }
      }
      
      // If it's not an Axios error, rethrow
      throw axiosError;
    }
  } catch (error) {
    console.error('createCampaign failed:', error);
    
    if (error instanceof Error) {
      throw error; // Rethrow the error with the message and details
    } else {
      throw new Error('Unknown error creating campaign');
    }
  }
};

export const getVideos = async (): Promise<{ success: boolean, data: VideoDto[], error?: string }> => {
  try {
    const res = await api.get<VideoDto[]>('/campaigns/videos');
    return { success: true, data: res.data };
  } catch (error) {
    console.error('getVideos failed:', error);
    let errorMessage = 'Failed to get videos';
    if (isAxiosError(error) && error.response) {
      errorMessage = error.response.data?.error || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, data: [], error: errorMessage };
  }
};

export const getInsights = async (
    campaignId: string,
    since?: string,
    until?: string
): Promise<Insight[]> => {
  try {
  const res = await api.get<Insight[]>(
      `/campaigns/${campaignId}/insights`,
      { params: since && until ? { since, until } : undefined }
  );
  return res.data;
  } catch (error) {
    console.error('getInsights failed:', error);
    let errorMessage = 'Failed to get insights';
    if (isAxiosError(error) && error.response) {
      errorMessage = error.response.data?.error || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

export const testApiConnection = async (): Promise<{ success: boolean, message: string }> => {
  try {
    console.log('Testing API connection...');
    // First try a GET request which might be less likely to have CORS issues
    try {
      console.log('Testing GET request...');
      const getRes = await api.get('/campaigns');
      console.log('GET test successful:', getRes.data);
      
      // If GET works, try a POST
      console.log('Testing POST request...');
      const postRes = await api.post('/campaigns/ping', { test: true });
      console.log('POST test successful:', postRes.data);
      
      return { success: true, message: 'API connection successful (GET and POST)' };
    } catch (getError) {
      console.error('GET test failed, trying POST only:', getError);
      
      // If GET fails, try just POST
      const postRes = await api.post('/campaigns/ping', { test: true });
      console.log('POST test successful:', postRes.data);
      
      return { success: true, message: 'API connection successful (POST only)' };
    }
  } catch (error) {
    console.error('API connection test failed:', error);
    let message = 'Unknown error';
    
    if (isAxiosError(error)) {
      if (error.response) {
        message = `HTTP Error: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        message = 'Network Error: No response received from server';
      } else {
        message = `Error: ${error.message}`;
      }
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = String(error);
    }
    
    return { success: false, message };
  }
};

export const createAdSet = async (
  payload: CreateAdSetPayload
): Promise<CreateAdSetResponse> => {
  try {
    console.log('createAdSet called with payload:', JSON.stringify(payload, null, 2));
    
    // Ensure all required fields are present
    if (!payload.campaignId) throw new Error('Campaign ID is required');
    if (!payload.name) throw new Error('Ad Set name is required');
    if (!payload.dailyBudget || payload.dailyBudget < 100) throw new Error('Daily budget must be at least 100');
    
    // Make the API call
    console.log(`Making POST request to ${api.defaults.baseURL}/campaigns/adsets`);
    console.log('Final payload:', JSON.stringify(payload, null, 2));
    
    try {
      const res = await api.post<CreateAdSetResponse>('/campaigns/adsets', payload, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('createAdSet successful:', res.data);
      return res.data;
    } catch (axiosError) {
      console.error('createAdSet axios error:', axiosError);
      
      if (isAxiosError(axiosError)) {
        // Extract detailed error information from response
        if (axiosError.response) {
          const statusCode = axiosError.response.status;
          const responseData = axiosError.response.data;
          
          console.error('API Error Status:', statusCode);
          console.error('API Error Response:', responseData);
          
          // Create a detailed error object that contains all error information
          const errorDetail = {
            message: 'Failed to create ad set',
            status: statusCode,
            data: responseData
          };
          
          let errorMessage = 'Failed to create ad set';
          
          // Handle different error formats but preserve the full error data
          if (typeof responseData === 'object') {
            if (responseData.error) {
              errorMessage = typeof responseData.error === 'string' 
                ? responseData.error 
                : `Error: ${JSON.stringify(responseData.error)}`;
            } else if (responseData.message) {
              errorMessage = responseData.message;
            }
          } else if (typeof responseData === 'string') {
            errorMessage = responseData;
          }
          
          // Create an error object with the message, but attach the full error details
          const error = new Error(errorMessage) as Error & { detail?: any };
          error.detail = errorDetail;
          throw error;
        } else if (axiosError.request) {
          // Request was made but no response received
          throw new Error('Network error: No response received from server');
        } else {
          // Error setting up the request
          throw new Error(`Request setup error: ${axiosError.message}`);
        }
      }
      
      // If it's not an Axios error, rethrow
      throw axiosError;
    }
  } catch (error) {
    console.error('createAdSet failed:', error);
    
    if (error instanceof Error) {
      throw error; // Rethrow the error with the message and details
    } else {
      // Fallback for unknown error types
      throw new Error('Unknown error creating ad set');
    }
  }
};

export const testFacebookApi = async (): Promise<{ success: boolean, message: string, data?: any }> => {
  try {
    console.log('Testing Facebook API integration...');
    const res = await api.get('/campaigns/test-facebook');
    console.log('Facebook API test successful:', res.data);
    return { 
      success: true, 
      message: 'Facebook API connection successful',
      data: res.data
    };
  } catch (error) {
    console.error('Facebook API test failed:', error);
    let message = 'Facebook API test failed';
    let errorData = null;
    
    if (isAxiosError(error)) {
      if (error.response) {
        message = error.response.data?.error || error.message;
        errorData = error.response.data;
        console.error('Error response data:', error.response.data);
      } else if (error.request) {
        message = 'Network Error: No response received from server';
      } else {
        message = `Error: ${error.message}`;
      }
    } else if (error instanceof Error) {
      message = error.message;
    }
    
    return { 
      success: false, 
      message,
      data: errorData
    };
  }
};

export const validateCampaignCreation = async (): Promise<{ success: boolean, message: string, data?: any }> => {
  try {
    console.log('Validating campaign creation...');
    const res = await api.get('/campaigns/validate-campaign-creation');
    console.log('Campaign creation validation results:', res.data);
    
    // Check if the validation was successful
    const results = res.data.results;
    const isSuccess = results.isSuccess || results.jsonIsSuccess;
    
    return {
      success: isSuccess,
      message: isSuccess ? 'Campaign creation validation passed!' : 'Campaign creation validation failed',
      data: res.data
    };
  } catch (error) {
    console.error('Campaign validation failed:', error);
    let message = 'Campaign validation test failed';
    let errorData = null;
    
    if (isAxiosError(error)) {
      if (error.response) {
        message = error.response.data?.error || error.message;
        errorData = error.response.data;
        console.error('Error response data:', error.response.data);
      } else if (error.request) {
        message = 'Network Error: No response received from server';
      } else {
        message = `Error: ${error.message}`;
      }
    } else if (error instanceof Error) {
      message = error.message;
    }
    
    return {
      success: false,
      message,
      data: errorData
    };
  }
};

// New method for creating ads on a specific ad set
export const createAdsForAdSet = async (
  adSetId: string,
  payload: {
    projectId: number;
    videoIds: string[];
    name?: string;
    status?: string;
    creativeIds?: string[];
  }
): Promise<{ adIds: string[], creativeIds?: string[] }> => {
  try {
    console.log(`Creating ads for Ad Set ${adSetId} with payload:`, JSON.stringify(payload, null, 2));
    
    if (!adSetId) {
      throw new Error('Ad Set ID is required');
    }
    
    // Ensure name parameter exists and is not empty
    if (!payload.name || payload.name.trim() === '') {
      throw new Error('Ad name is required');
    }
    
    // Ensure at least one selection method is provided
    if ((!payload.videoIds || payload.videoIds.length === 0) && (!payload.creativeIds || payload.creativeIds.length === 0)) {
      throw new Error('At least one video or creative must be selected');
    }
    
    // Prepare request payload - ensure collections aren't null
    const requestPayload = {
      projectId: payload.projectId,
      videoIds: payload.videoIds || [],
      creativeIds: payload.creativeIds || [],
      name: payload.name.trim(),
      status: payload.status || 'PAUSED'
    };
    
    console.log(`Sending request to /adsets/${adSetId}/ads with name: ${requestPayload.name}`, requestPayload);
    
    const res = await api.post<{ adIds: string[], creativeIds?: string[] }>(`/adsets/${adSetId}/ads`, requestPayload, {
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('createAdsForAdSet successful:', res.data);
    
    // Handle empty response
    if (!res.data || Object.keys(res.data).length === 0) {
      console.error('Server returned empty JSON response');
      throw new Error('Server returned empty response. Please check server logs for details.');
    }
    
    // Validate the response structure
    if (!res.data.adIds) {
      console.error('Missing adIds in response:', res.data);
      throw new Error('Invalid response format from server: missing adIds');
    }
    
    return res.data;
  } catch (error) {
    console.error('createAdsForAdSet error:', error);
    
    let errorMessage = 'Failed to create ads';
    if (isAxiosError(error) && error.response) {
      console.error('API error response:', error.response.data);
      errorMessage = error.response.data?.error || error.message;
      
      // If the error has a structured validation error, format it nicely
      if (error.response.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => {
            // Ensure messages is treated as an array
            const messageArray = Array.isArray(messages) ? messages : [String(messages)];
            return `${field}: ${messageArray.join(', ')}`;
          })
          .join('; ');
        errorMessage = `Validation error: ${errorMessages}`;
      }
      
      // Include the raw response in the error for debugging
      const enhancedError = new Error(errorMessage) as Error & { rawResponse?: any };
      enhancedError.rawResponse = error.response.data;
      throw enhancedError;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};