import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  service: string;
}

interface TestStatus {
  status: string;
  message: string;
  database_users?: number;
  environment?: string;
  cors_origins?: string;
  timestamp: string;
}

const ApiHealthCheck: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [test, setTest] = useState<TestStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Checking API health...');

      // Check basic health
      const healthResponse = await apiClient.request<HealthStatus>('/health');
      console.log('Health check response:', healthResponse);
      setHealth(healthResponse);

      // Check detailed test endpoint
      const testResponse = await apiClient.request<TestStatus>('/test');
      console.log('Test endpoint response:', testResponse);
      setTest(testResponse);
    } catch (err) {
      console.error('Health check failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
          <span className="text-yellow-800">Checking API connection...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">❌</div>
            <div>
              <div className="text-red-800 font-medium">API Connection Failed</div>
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          </div>
          <button
            onClick={checkHealth}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (health) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-green-600 mr-2">✅</div>
            <div>
              <div className="text-green-800 font-medium">API Connected</div>
              <div className="text-green-600 text-sm">
                {health.service} v{health.version} - {health.status}
              </div>
              {test && (
                <div className="text-green-600 text-xs mt-1">
                  DB Users: {test.database_users} | Env: {test.environment} | CORS: {test.cors_origins}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={checkHealth}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ApiHealthCheck;
