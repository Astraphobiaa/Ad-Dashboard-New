// src/components/CampaignForm.tsx
import React, { useState, useEffect } from 'react';
import { Button, Form, Alert, Card, Row, Col } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import * as facebookAdsApi from '../services/facebookAdsApi';
import { toast } from 'react-toastify';
import Select from 'react-select';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface CampaignFormProps {
  projectId: number;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ projectId }) => {
  // Form state
  const [formData, setFormData] = useState({
    // Campaign properties
    name: '',
    objective: 'OUTCOME_AWARENESS',
    status: 'PAUSED' as 'PAUSED',
    special_ad_categories: ['NONE'] as string[],
    spendCap: undefined as number | undefined,
    startTime: null as Date | null,
    stopTime: null as Date | null,
    buyingType: 'AUCTION' as 'AUCTION' | 'FIXED_CPM' | 'RESERVED',
    // AdSet properties (if creating together)
    adSetName: '', // Will be auto-populated based on campaign name
    dailyBudget: 1000,
    billingEvent: 'IMPRESSIONS' as 'IMPRESSIONS' | 'LINK_CLICKS',
    optimizationGoal: 'IMPRESSIONS',
    bidAmount: 100,
    bidStrategy: 'LOWEST_COST_WITH_BID_CAP' as 'LOWEST_COST_WITH_BID_CAP' | 'LOWEST_COST_WITHOUT_CAP' | 'COST_CAP',
    minimumRoasTarget: 2,
    targeting: {
      geoLocations: {
        countries: ['US'] as string[],
      },
      ageMin: 18,
      ageMax: 65,
      genders: [] as number[],
      devicePlatforms: [] as string[],
      publisherPlatforms: [] as string[],
      facebookPositions: [] as string[],
    },
    selectedVideoIds: [] as string[]
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Show AdSet fields state
  const [showAdSetFields, setShowAdSetFields] = useState(true); // Always true to ensure adset fields are shown
  
  // Debug state
  const [debugPayload, setDebugPayload] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<string>('');
  const [apiResponseVisible, setApiResponseVisible] = useState<boolean>(false);
  
  // Testing state
  const [testingApi, setTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [validatingCampaign, setValidatingCampaign] = useState(false);
  const [campaignValidationResult, setCampaignValidationResult] = useState<any>(null);

  // Log the form data whenever it changes
  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  // Objectives & Optimization Goals according to Facebook Graph API
  const objectives = [
    { value: 'OUTCOME_TRAFFIC', label: 'Traffic (Link Clicks)' },
    { value: 'OUTCOME_ENGAGEMENT', label: 'Engagement' },
    { value: 'OUTCOME_AWARENESS', label: 'Awareness' },
    { value: 'OUTCOME_LEADS', label: 'Leads' },
    { value: 'OUTCOME_SALES', label: 'Sales (Conversions)' },
    { value: 'OUTCOME_APP_PROMOTION', label: 'App Promotion' }
  ];

  const specialCategories = [
    { value: 'NONE', label: 'None' }
  ];
  
  const bidStrategyOptions = [
    { value: 'LOWEST_COST_WITH_BID_CAP' as const, label: 'Lowest Cost with Bid Cap' },
    { value: 'LOWEST_COST_WITHOUT_CAP' as const, label: 'Lowest Cost without Cap' },
    { value: 'COST_CAP' as const, label: 'Cost Cap' }
  ];
  
  const optimizationGoals = [
    { value: 'REACH', label: 'Reach' },
    { value: 'IMPRESSIONS', label: 'Impressions' },
    { value: 'LINK_CLICKS', label: 'Link Clicks' },
    { value: 'PAGE_LIKES', label: 'Page Likes' },
    { value: 'POST_ENGAGEMENT', label: 'Post Engagement' },
    { value: 'VIDEO_VIEWS', label: 'Video Views' },
    { value: 'LEAD_GENERATION', label: 'Lead Generation' },
    { value: 'APP_INSTALLS', label: 'App Installs' },
    { value: 'CONVERSIONS', label: 'Conversions' },
    { value: 'LANDING_PAGE_VIEWS', label: 'Landing Page Views' },
    { value: 'VALUE', label: 'Value (ROAS)' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    
    if (name === 'name') {
      // Auto-populate AdSet name when campaign name changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        adSetName: value ? `${value} Ad Set` : ''
      }));
    } else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    }
  };

  const handleSelectChange = (name: string) => (option: any) => {
    console.log(`Select changed: ${name}`, option);
    if (Array.isArray(option)) {
      // For multi-select
      setFormData(prev => ({
        ...prev,
        [name]: option.map(item => item.value)
      }));
    } else {
      // For single select
      setFormData(prev => ({
        ...prev,
        [name]: option.value
      }));
    }
  };

  const handleDateChange = (name: string) => (date: Date | null) => {
    console.log(`Date changed: ${name}`, date);
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleSpecialCategoriesChange = (selected: any) => {
    console.log('Special categories changed:', selected);
    // Always use NONE
    setFormData(prev => ({
      ...prev,
      special_ad_categories: ['NONE']
    }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Campaign validation
    if (!formData.name.trim()) {
      errors.name = 'Campaign name is required';
    }

    if (!formData.objective) {
      errors.objective = 'Campaign objective is required';
    }

    if (!formData.buyingType) {
      errors.buyingType = 'Buying type is required';
    }

    // Check if campaign is scheduled for at least 24 hours if both dates are provided
    if (formData.startTime && formData.stopTime) {
      const durationHours = (formData.stopTime.getTime() - formData.startTime.getTime()) / (1000 * 60 * 60);
      if (durationHours < 24) {
        errors.stopTime = 'Campaign must be scheduled for at least 24 hours';
      }
    }

    // AdSet validation - always required
      if (!formData.adSetName.trim()) {
        errors.adSetName = 'Ad Set name is required';
      }

      if (formData.dailyBudget < 100) {
        errors.dailyBudget = 'Daily budget must be at least 100';
      }

      if (formData.bidAmount < 1 || formData.bidAmount > 1000) {
        errors.bidAmount = 'Bid amount must be between 1 and 1000';
      }

      // Validate ROAS target when optimization goal is VALUE
      if (formData.optimizationGoal === 'VALUE' && (formData.minimumRoasTarget < 1 || formData.minimumRoasTarget > 10)) {
        errors.minimumRoasTarget = 'Minimum ROAS target must be between 1 and 10';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const preparePayload = () => {
    try {
      // Basic campaign payload
      const payload: any = {
        name: formData.name,
        objective: formData.objective,
        status: formData.status,
        special_ad_categories: formData.special_ad_categories,
        buyingType: formData.buyingType
      };

      // Optional fields
      if (formData.spendCap) {
        payload.spendCap = formData.spendCap;
      }

      if (formData.startTime) {
        payload.startTime = formData.startTime.toISOString();
      }

      if (formData.stopTime) {
        payload.stopTime = formData.stopTime.toISOString();
      }

      // Always include AdSet data - it's required by the backend
      payload.adSetName = formData.adSetName || `${formData.name} Ad Set`;
        payload.dailyBudget = formData.dailyBudget;
        payload.billingEvent = formData.billingEvent;
        payload.optimizationGoal = formData.optimizationGoal;
        payload.bidAmount = formData.bidAmount;
        payload.bidStrategy = formData.bidStrategy;
        
        // Add minimumRoasTarget only for VALUE optimization goal
        if (formData.optimizationGoal === 'VALUE') {
          payload.minimumRoasTarget = formData.minimumRoasTarget;
        }
        
      // Always include targeting - it's required by the backend
        payload.targeting = {
          geoLocations: formData.targeting.geoLocations,
          ageMin: formData.targeting.ageMin,
          ageMax: formData.targeting.ageMax,
          genders: formData.targeting.genders,
        };
        
        // Only add these if they have values
        if (formData.targeting.devicePlatforms && formData.targeting.devicePlatforms.length > 0) {
          payload.targeting.devicePlatforms = formData.targeting.devicePlatforms;
        }
        
        if (formData.targeting.publisherPlatforms && formData.targeting.publisherPlatforms.length > 0) {
          payload.targeting.publisherPlatforms = formData.targeting.publisherPlatforms;
        }
        
        if (formData.targeting.facebookPositions && formData.targeting.facebookPositions.length > 0) {
          payload.targeting.facebookPositions = formData.targeting.facebookPositions;
        }

        // Add selected videos if any
        if (formData.selectedVideoIds && formData.selectedVideoIds.length > 0) {
          payload.selectedVideoIds = formData.selectedVideoIds;
      }

      return payload;
    } catch (error) {
      console.error('Error preparing payload:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');
    setApiResponse('');
    setApiResponseVisible(false);

    try {
      // Prepare payload
      const payload = preparePayload();
      
      // Set debug payload for display
      setDebugPayload(JSON.stringify(payload, null, 2));
      
      console.log('Creating campaign with payload:', payload);
      
      try {
        // Submit to API
        const response = await facebookAdsApi.createCampaign(payload);
        
        // Save the response for debugging
        setApiResponse(JSON.stringify(response, null, 2));
        
        // Show success message
        let successMsg = `Campaign successfully created! Campaign ID: ${response.campaignId}`;
        
        if (response.adSetId) {
          successMsg += `, Ad Set ID: ${response.adSetId}`;
        }
        
        if (response.adIds && response.adIds.length > 0) {
          successMsg += `, with ${response.adIds.length} ads created`;
        }
        
        setSuccessMessage(successMsg);
        toast.success('Campaign successfully created!');
        
        // Reset form
        setFormData({
          name: '',
          objective: 'OUTCOME_AWARENESS',
          status: 'PAUSED',
          special_ad_categories: ['NONE'],
          spendCap: undefined,
          startTime: null,
          stopTime: null,
          buyingType: 'AUCTION',
          adSetName: '',
          dailyBudget: 1000,
          billingEvent: 'IMPRESSIONS',
          optimizationGoal: 'IMPRESSIONS',
          bidAmount: 100,
          bidStrategy: 'LOWEST_COST_WITH_BID_CAP',
          minimumRoasTarget: 2,
          targeting: {
            geoLocations: {
              countries: ['US'],
            },
            ageMin: 18,
            ageMax: 65,
            genders: [],
            devicePlatforms: [],
            publisherPlatforms: [],
            facebookPositions: [],
          },
          selectedVideoIds: []
        });
        
        // Reset UI state
        setShowAdSetFields(true);
        setDebugPayload('');
      } catch (error: any) {
        // Display the error message from the API
        const errorMessage = error.message || 'Unknown error occurred';
        console.error('Campaign creation error:', error);
        toast.error(`Error: ${errorMessage}`);
        
        // Store the full error details for display
        setApiResponse(JSON.stringify(error, null, 2));
        setApiResponseVisible(true); // Show error details
      }
    } catch (error: any) {
      toast.error(`Error preparing payload: ${error.message || 'Unknown error'}`);
      setApiResponse(JSON.stringify(error, null, 2));
      setApiResponseVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  const testFacebookApi = async () => {
    setTestingApi(true);
    setApiTestResult(null);
    
    try {
      const result = await facebookAdsApi.testFacebookApi();
      setApiTestResult(result);
      
      if (result.success) {
        toast.success('Facebook API test passed!');
      } else {
        toast.error(`Facebook API test failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing Facebook API:', error);
      setApiTestResult({ success: false, message: 'Error running test' });
      toast.error('Error testing Facebook API connection');
    } finally {
      setTestingApi(false);
    }
  };

  const validateCampaignCreation = async () => {
    setValidatingCampaign(true);
    setCampaignValidationResult(null);
    
    try {
      const result = await facebookAdsApi.validateCampaignCreation();
      setCampaignValidationResult(result);
      
      if (result.success) {
        toast.success('Campaign creation validation passed!');
      } else {
        toast.error(`Campaign creation validation failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error validating campaign creation:', error);
      setCampaignValidationResult({ success: false, message: 'Error running validation' });
      toast.error('Error validating campaign creation');
    } finally {
      setValidatingCampaign(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Create Campaign</Card.Header>
      <Card.Body>
        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
            {successMessage}
          </Alert>
        )}

        <Alert variant="info" className="mb-3">
          <strong>Note:</strong> When creating a campaign, default targeting settings will be applied (US, age 18-65). 
          You can modify these settings later by creating a custom Ad Set for this campaign.
        </Alert>

        <Alert variant="warning" className="mb-3">
          <strong>Important Facebook Ad Requirements:</strong>
          <ul className="mb-0 ps-3 mt-1">
            <li>Campaigns with daily budget must be scheduled for at least 24 hours</li>
            <li>Facebook limits bid amounts to a maximum of 1000</li>
            <li>Special Ad Categories must comply with Facebook's policies</li>
          </ul>
        </Alert>

        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Campaign Name*</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!formErrors.name}
                  disabled={submitting}
                />
                <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
                <Form.Text className="text-muted">Enter a unique name for your campaign</Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Campaign Objective*</Form.Label>
                <Select
                  options={objectives}
                  value={objectives.find(o => o.value === formData.objective)}
                  onChange={handleSelectChange('objective')}
                  isDisabled={submitting}
                  className={formErrors.objective ? "is-invalid" : ""}
                />
                {formErrors.objective && (
                  <div className="text-danger">{formErrors.objective}</div>
                )}
                <Form.Text className="text-muted">Select the primary objective for your campaign</Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Buying Type*</Form.Label>
                <Select
                  options={[
                    { value: 'AUCTION', label: 'Auction' },
                    { value: 'FIXED_CPM', label: 'Fixed CPM (Reach & Frequency)' },
                  ]}
                  value={{ value: formData.buyingType, label: formData.buyingType === 'AUCTION' ? 'Auction' : 'Fixed CPM (Reach & Frequency)' }}
                  onChange={handleSelectChange('buyingType')}
                  isDisabled={submitting}
                  className={formErrors.buyingType ? "is-invalid" : ""}
                />
                {formErrors.buyingType && (
                  <div className="text-danger">{formErrors.buyingType}</div>
                )}
                <Form.Text className="text-muted">Determines how you'll be charged for this campaign</Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date (Optional)</Form.Label>
                <div>
                  <DatePicker
                    selected={formData.startTime}
                    onChange={handleDateChange('startTime')}
                    showTimeSelect
                    dateFormat="yyyy-MM-dd HH:mm"
                    className="form-control"
                    placeholderText="Select start date"
                    disabled={submitting}
                  />
                </div>
                <Form.Text className="text-muted">Leave empty to start immediately</Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>End Date (Optional)</Form.Label>
                <div>
                  <DatePicker
                    selected={formData.stopTime}
                    onChange={handleDateChange('stopTime')}
                    showTimeSelect
                    dateFormat="yyyy-MM-dd HH:mm"
                    className={`form-control ${formErrors.stopTime ? 'is-invalid' : ''}`}
                    placeholderText="Select end date"
                    minDate={formData.startTime || new Date()}
                    disabled={submitting}
                  />
                  {formErrors.stopTime && (
                    <div className="invalid-feedback d-block">{formErrors.stopTime}</div>
                  )}
                </div>
                <Form.Text className="text-muted">
                  If you specify both start and end dates, the campaign must run for at least 24 hours.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4">
              <h6>Debug Tools</h6>
              
              <div className="border rounded p-3 mb-3">
                <Form.Check 
                  type="checkbox"
                  id="show-payload"
                  label="Show API Payload"
                  checked={!!debugPayload}
                  onChange={() => setDebugPayload(debugPayload ? '' : JSON.stringify(preparePayload(), null, 2))}
                  className="mb-2"
                />
                
                {debugPayload && (
                  <div className="bg-light p-3 rounded mb-3">
                    <h6>API Payload Preview:</h6>
                    <pre style={{ maxHeight: '200px', overflowY: 'auto' }}>{debugPayload}</pre>
                  </div>
                )}
                
                <Form.Check 
                  type="checkbox"
                  id="show-response"
                  label="Show API Response/Error"
                  checked={apiResponseVisible}
                  onChange={() => setApiResponseVisible(!apiResponseVisible)}
                  className="mb-2"
                />
                
                {apiResponseVisible && apiResponse && (
                  <div className="bg-light p-3 rounded">
                    <h6>API Response/Error:</h6>
                    <pre style={{ maxHeight: '200px', overflowY: 'auto' }}>{apiResponse}</pre>
                    {apiResponse.includes('error_user_title') && (
                      <Alert variant="warning" className="mt-3">
                        <strong>Facebook API Error:</strong> 
                        <div className="mt-2">
                          <ul className="mb-0">
                            {JSON.parse(apiResponse).data?.error?.error_user_title && (
                              <li><strong>Error Type:</strong> {JSON.parse(apiResponse).data.error.error_user_title}</li>
                            )}
                            {JSON.parse(apiResponse).data?.error?.error_user_msg && (
                              <li><strong>Description:</strong> {JSON.parse(apiResponse).data.error.error_user_msg}</li>
                            )}
                            {JSON.parse(apiResponse).data?.error?.code && (
                              <li><strong>Error Code:</strong> {JSON.parse(apiResponse).data.error.code}</li>
                            )}
                            {JSON.parse(apiResponse).data?.error?.error_subcode && (
                              <li><strong>Error Subcode:</strong> {JSON.parse(apiResponse).data.error.error_subcode}</li>
                            )}
                          </ul>
                        </div>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end mt-4">
            <Button 
              variant="primary" 
              type="submit" 
              disabled={submitting}
            >
              {submitting ? 'Creating Campaign...' : 'Create Campaign'}
            </Button>
          </div>
        </Form>
        
        {/* Add the diagnostic test button */}
        <div className="mt-4 pt-3 border-top">
          <h6>Diagnostic Tools</h6>
          <div className="mb-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={testFacebookApi}
              disabled={testingApi}
              className="me-2"
            >
              {testingApi ? 'Testing API...' : 'Test Facebook API Connection'}
            </Button>
            
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={validateCampaignCreation}
              disabled={validatingCampaign}
            >
              {validatingCampaign ? 'Validating...' : 'Validate Campaign Creation'}
            </Button>
          </div>
          
          {apiTestResult && (
            <div className="mt-2 p-2 bg-light">
              <h6>API Test Result: {apiTestResult.success ? 'Success' : 'Failed'}</h6>
              <pre style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {JSON.stringify(apiTestResult.data || apiTestResult.message, null, 2)}
              </pre>
            </div>
          )}
          
          {campaignValidationResult && (
            <div className="mt-2 p-2 bg-light">
              <h6>Validation Result: {campaignValidationResult.success ? 'Success' : 'Failed'}</h6>
              <pre style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {JSON.stringify(campaignValidationResult.results || campaignValidationResult.message, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default CampaignForm;
