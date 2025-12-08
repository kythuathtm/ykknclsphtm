
import React, { Component, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './src/App';
import './style.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Đã xảy ra lỗi hệ thống</h1>
            <p className="text-slate-500 mb-6 text-sm">Hệ thống gặp sự cố không mong muốn. Vui lòng tải lại trang.</p>
            <div className="bg-slate-100 p-3 rounded-lg text-left mb-6 overflow-auto max-h-32">
                <code className="text-xs text-red-500 font-mono break-all">
                    {this.state.error?.toString() || 'Unknown Error'}
                </code>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-3 bg-[#003DA5] hover:bg-[#002a70] text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
  </React.StrictMode>
);