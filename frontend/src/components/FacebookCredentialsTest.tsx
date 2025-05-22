import React, { useState } from 'react';
import { Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

const FacebookCredentialsTest: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [shortLivedToken, setShortLivedToken] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testCredentials = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const url = shortLivedToken 
        ? `/api/campaigns/test-credentials?shortLivedToken=${encodeURIComponent(shortLivedToken)}`
        : '/api/campaigns/test-credentials';
        
      const response = await axios.get(url);
      setResult(response.data);
    } catch (err: any) {
      console.error('Error testing credentials:', err);
      setError(err.response?.data?.error || err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Facebook API Credentials Test</Card.Header>
      <Card.Body>
        <p className="text-muted mb-3">
          Test your Facebook API credentials and generate a long-lived access token if needed.
        </p>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Short-lived Access Token (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={shortLivedToken}
              onChange={(e) => setShortLivedToken(e.target.value)}
              placeholder="Paste a short-lived token here to exchange it for a long-lived token"
            />
            <Form.Text className="text-muted">
              If you have a short-lived token, you can paste it here to exchange it for a long-lived token.
              Otherwise, the system will use the token from your configuration.
            </Form.Text>
          </Form.Group>

          <Button 
            variant="primary" 
            onClick={testCredentials}
            disabled={loading}
            className="d-flex align-items-center"
          >
            {loading && <Spinner animation="border" size="sm" className="me-2" />}
            Test Facebook Credentials
          </Button>
        </Form>

        {result && (
          <div className="mt-4">
            <h6>Test Results:</h6>
            
            <div className="border rounded p-3 mb-3 bg-light">
              <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
            
            {result.results?.longLivedToken?.success && (
              <Alert variant="success">
                <Alert.Heading>Long-lived token generated!</Alert.Heading>
                <p>
                  A new long-lived token has been generated. You should copy this token and update your appsettings.json file 
                  with it to use it for future requests.
                </p>
                <hr />
                <div className="d-flex">
                  <input 
                    type="text" 
                    className="form-control" 
                    value={result.results.longLivedToken.token} 
                    readOnly 
                  />
                  <Button 
                    variant="outline-success"
                    className="ms-2"
                    onClick={() => {
                      navigator.clipboard.writeText(result.results.longLivedToken.token);
                      alert('Token copied to clipboard!');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </Alert>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default FacebookCredentialsTest; 