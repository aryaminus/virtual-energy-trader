import React from 'react';
import { AlertTriangle, RefreshCw, Settings, Wifi } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  errorCode?: number;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  onRetry,
  className = "",
  errorCode,
}) => {
  // Determine appropriate title and icon based on error code
  const getErrorInfo = () => {
    switch (errorCode) {
      case 401:
        return {
          title: title || "Authentication Error",
          icon: Settings,
          color: "red",
          suggestion: "Please check your API key configuration."
        };
      case 404:
        return {
          title: title || "Data Not Found",
          icon: AlertTriangle,
          color: "yellow",
          suggestion: "Try selecting a different date or check if data is available."
        };
      case 429:
        return {
          title: title || "Rate Limit Exceeded",
          icon: AlertTriangle,
          color: "orange",
          suggestion: "Please wait a moment before trying again."
        };
      case 503:
        return {
          title: title || "Service Unavailable",
          icon: Wifi,
          color: "red",
          suggestion: "The backend API is not deployed in production. This is a frontend-only demo."
        };
      default:
        return {
          title: title || "Something went wrong",
          icon: AlertTriangle,
          color: "red",
          suggestion: "Please try again or contact support if the problem persists."
        };
    }
  };

  const errorInfo = getErrorInfo();
  const Icon = errorInfo.icon;

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 border border-${errorInfo.color}-200 ${className}`}>
      <div className="text-center">
        <Icon className={`w-12 h-12 text-${errorInfo.color}-500 mx-auto mb-4`} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{errorInfo.title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        
        {errorInfo.suggestion && (
          <p className="text-sm text-gray-500 mb-6">{errorInfo.suggestion}</p>
        )}
        
        {onRetry && (
          <button
            onClick={onRetry}
            className={`inline-flex items-center space-x-2 bg-${errorInfo.color}-600 text-white px-4 py-2 rounded-lg hover:bg-${errorInfo.color}-700 transition-colors`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}
        
        {errorCode && (
          <div className="mt-4 text-xs text-gray-400">
            Error Code: {errorCode}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;