import { useState, useRef, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Upload, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Paywall from '../components/Paywall';
import { PremiumContext } from './_app';
import { apiFetch } from '../utils/api';

export default function AnalyzeSlip() {
  const { isPremium } = useContext(PremiumContext);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [usageData, setUsageData] = useState({ uploads: 0 });
  const [showPaywall, setShowPaywall] = useState(false);
  const fileInputRef = useRef(null);

  // Load user data on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('betchekr_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('betchekr_user');
      }
    }
    
    if (!isPremium) {
      checkUsage();
    }
  }, [isPremium]);

  const checkUsage = async () => {
    try {
      const userIdentifier = currentUser?.id || `anon_${Date.now()}`;
      const response = await apiFetch(`/api/check-usage?userIdentifier=${userIdentifier}`);
      const data = await response.json();
      
      if (response.ok) {
        setUsageData(data.usage);
      }
    } catch (error) {
      console.error('Error checking usage:', error);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      setUploadedFile(file);
    } else {
      alert('Please upload an image file (PNG, JPG, WEBP)');
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleAnalyzeBetSlip = async () => {
    if (!uploadedFile) {
      alert('Please upload a bet slip image first');
      return;
    }

    if (!isPremium && usageData.uploads >= 1) {
      setShowPaywall(true);
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const reader = new FileReader();
      const processImage = () => new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedFile);
      });
      
      const base64Result = await processImage();
      const base64String = base64Result.split(',')[1];
      
      const response = await apiFetch('/api/analyze-slip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64String,
          userId: currentUser?.id || '',
          username: currentUser?.username || ''
        }),
      });

      const result = await response.json();
      
      if (result.success && result.analysis) {
        setAnalysisResult(result.analysis);
      } else {
        throw new Error(result.message || 'Failed to analyze bet slip');
      }
    } catch (error) {
      console.error('Error analyzing bet slip:', error);
      alert(error.message || 'Failed to analyze bet slip. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <Head>
        <title>Analyze Bet Slip - Upload & Check Your Bets | BetChekr</title>
        <meta name="description" content="Upload your bet slip image and get AI-powered analysis. Check if your bets have positive expected value and get insights on your picks." />
      </Head>

      <div className="min-h-screen bg-[#0B0F14]">
        <Header />
        
        {/* Paywall Overlay */}
        {showPaywall && (
          <Paywall 
            feature="bet slip analysis" 
            usageLimit="1 bet slip per day"
            onClose={() => setShowPaywall(false)}
          />
        )}

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Link href="/">
            <button className="flex items-center text-[#9CA3AF] hover:text-[#F4C430] mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <Upload className="w-12 h-12 text-[#F4C430] mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-4">
              Analyze Your Bet Slip
            </h1>
            <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto">
              Upload an image of your bet slip and get AI-powered analysis to see if your bets have positive expected value
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#F4C430] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-[#E5E7EB] font-semibold mb-2">How it works</h3>
                <ul className="text-[#9CA3AF] text-sm space-y-1">
                  <li>• Upload a clear image of your bet slip from any sportsbook</li>
                  <li>• Our AI extracts the bet details and odds</li>
                  <li>• We calculate fair odds (vig removed) and expected value</li>
                  <li>• Get recommendations on whether your bets are good value</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
              <h2 className="text-[#E5E7EB] text-xl font-bold mb-6">Upload Bet Slip</h2>

              {!uploadedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-[#374151] rounded-lg p-8 text-center hover:border-[#F4C430] transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
                  <p className="text-[#E5E7EB] font-medium mb-2">
                    Drop your bet slip image here
                  </p>
                  <p className="text-[#9CA3AF] text-sm mb-4">
                    or click to browse files
                  </p>
                  <button className="bg-[#F4C430] text-[#0B0F14] px-4 py-2 rounded-lg font-medium hover:bg-[#e6b829] transition-colors">
                    Select Image
                  </button>
                  <p className="text-[#6B7280] text-xs mt-3">
                    Supports PNG, JPG, WEBP
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#1F2937] p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-[#E5E7EB] font-medium">{uploadedFile.name}</p>
                        <p className="text-[#9CA3AF] text-sm">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="flex-1 border border-[#374151] text-[#9CA3AF] px-4 py-2 rounded-lg hover:bg-[#1F2937] transition-colors"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 border border-[#F4C430] text-[#F4C430] px-4 py-2 rounded-lg hover:bg-[#F4C430]/10 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                  
                  <button
                    onClick={handleAnalyzeBetSlip}
                    disabled={isAnalyzing}
                    className="w-full bg-[#F4C430] text-[#0B0F14] px-6 py-3 rounded-lg font-semibold hover:bg-[#e6b829] transition-colors disabled:opacity-50"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Bet Slip'}
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInput}
                className="hidden"
              />

              {!isPremium && (
                <div className="mt-4 p-3 bg-[#1F2937] rounded-lg">
                  <p className="text-[#6B7280] text-sm text-center">
                    Free: {Math.max(0, 1 - usageData.uploads)} analysis remaining today
                  </p>
                </div>
              )}
            </div>

            {/* Results Section */}
            <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
              <h2 className="text-[#E5E7EB] text-xl font-bold mb-6">Analysis Results</h2>

              {analysisResult ? (
                <div className="space-y-4">
                  {/* Analysis content would go here */}
                  <div className="bg-[#1F2937] p-4 rounded-lg">
                    <pre className="text-[#E5E7EB] text-sm whitespace-pre-wrap">
                      {JSON.stringify(analysisResult, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="w-12 h-12 text-[#374151] mx-auto mb-4" />
                  <p className="text-[#6B7280]">
                    {isAnalyzing ? 'Analyzing your bet slip...' : 'Upload a bet slip to see analysis'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-8 bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
            <h3 className="text-[#E5E7EB] font-semibold mb-4">Tips for Best Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#9CA3AF]">
              <div>
                <h4 className="text-[#F4C430] font-medium mb-2">Image Quality</h4>
                <ul className="space-y-1">
                  <li>• Use good lighting</li>
                  <li>• Keep image sharp and clear</li>
                  <li>• Avoid glare or shadows</li>
                </ul>
              </div>
              <div>
                <h4 className="text-[#F4C430] font-medium mb-2">Bet Slip Content</h4>
                <ul className="space-y-1">
                  <li>• Include all bet details</li>
                  <li>• Show odds clearly</li>
                  <li>• Capture stake amount</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}