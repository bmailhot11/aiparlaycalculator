import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadArea({ onAnalysis, uploadsToday, maxUploads, isPremium }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    setError(null);
    
    // Check limits
    if (!isPremium && uploadsToday >= maxUploads) {
      setError('Daily upload limit reached. Upgrade to Premium for unlimited uploads.');
      return;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadedFile(file);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const response = await fetch('/api/analyze-slip', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageBase64: e.target.result
            }),
          });

          const result = await response.json();

          if (result.success) {
            onAnalysis(result.analysis);
          } else {
            setError(result.message || 'Failed to analyze bet slip');
          }
        } catch (err) {
          setError('Failed to upload and analyze image');
          console.error(err);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setError(null);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (uploading) {
    return (
      <div className="border-2 border-blue-500 rounded-xl p-16 text-center bg-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div className="text-lg font-semibold text-blue-700 mb-2">
          Analyzing Your Bet Slip...
        </div>
        <div className="text-blue-600 text-sm">
          Our AI is processing your image and calculating optimizations
        </div>
      </div>
    );
  }

  if (uploadedFile && !error) {
    return (
      <div className="border-2 border-green-500 rounded-xl p-16 text-center bg-green-50">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <div className="text-lg font-semibold text-green-700 mb-2">
          Analysis Complete!
        </div>
        <div className="text-green-600 text-sm mb-4">
          Your bet slip has been analyzed with optimization suggestions
        </div>
        <button 
          onClick={resetUpload}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Analyze Another
        </button>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="text-red-700 text-sm">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <div 
        className={`border-2 border-dashed rounded-xl p-16 text-center transition-all cursor-pointer ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <div className="text-lg font-semibold text-gray-700 mb-2">
          Upload Your Bet Slip Screenshot
        </div>
        <div className="text-gray-500 text-sm">
          PNG, JPG up to 10MB • Works with all major sportsbooks
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  );
}