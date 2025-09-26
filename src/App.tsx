import React, { useState, useRef, useEffect } from 'react';
import { Camera, Play, Square, CheckCircle, XCircle, User, Mail, Timer } from 'lucide-react';

interface User {
  name: string;
  email: string;
}

interface ChallengeResult {
  status: 'PASS' | 'FAIL';
  duration: number;
  timestamp: Date;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User>({ name: '', email: '' });
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [dotPosition, setDotPosition] = useState({ x: 50, y: 50 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const challengeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dotTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        alert('Camera access was denied. Please enable camera permissions in your browser settings and try again.');
      } else {
        alert('Camera access is required for the liveliness check.');
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
    }
  };

  // Handle user registration
  const handleRegister = () => {
    if (user.name.trim() && user.email.trim() && user.email.includes('@')) {
      setIsRegistered(true);
      startCamera();
    } else {
      alert('Please enter valid name and email.');
    }
  };

  // Start challenge
  const startChallenge = () => {
    if (!isCameraActive) return;
    
    setIsChallengeActive(true);
    setChallengeResult(null);
    setTimeLeft(6);
    
    // Start countdown timer
    challengeTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endChallenge();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start dot animation
    moveDotRandomly();
  };

  // Move dot randomly
  const moveDotRandomly = () => {
    const moveInterval = 800; // Move every 800ms
    const totalDuration = 6000; // 6 seconds
    let elapsed = 0;

    const moveDot = () => {
      const x = Math.random() * 80 + 10; // 10% to 90%
      const y = Math.random() * 80 + 10; // 10% to 90%
      setDotPosition({ x, y });
      
      elapsed += moveInterval;
      if (elapsed < totalDuration) {
        dotTimerRef.current = setTimeout(moveDot, moveInterval);
      }
    };

    moveDot();
  };

  // End challenge
  const endChallenge = () => {
    setIsChallengeActive(false);
    
    if (challengeTimerRef.current) {
      clearInterval(challengeTimerRef.current);
      challengeTimerRef.current = null;
    }
    
    if (dotTimerRef.current) {
      clearTimeout(dotTimerRef.current);
      dotTimerRef.current = null;
    }

    // Simulate result (in real app, this would analyze eye tracking data)
    const success = Math.random() > 0.3; // 70% pass rate for demo
    setChallengeResult({
      status: success ? 'PASS' : 'FAIL',
      duration: 6,
      timestamp: new Date()
    });
  };

  // Submit result
  const submitResult = () => {
    if (challengeResult) {
      alert(`Result submitted: ${challengeResult.status}\nUser: ${user.name}\nEmail: ${user.email}`);
      // Reset for new challenge
      setChallengeResult(null);
      setTimeLeft(0);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (challengeTimerRef.current) clearInterval(challengeTimerRef.current);
      if (dotTimerRef.current) clearTimeout(dotTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Biometric Liveliness Check</h1>
          <p className="text-slate-600">Advanced eye-tracking authentication system</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Main Camera Feed */}
          <div className="lg:col-span-2">
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="aspect-video relative">
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">Camera will activate after registration</p>
                    </div>
                  </div>
                )}

                {/* Challenge Overlay */}
                {isChallengeActive && (
                  <>
                    {/* Translucent overlay */}
                    <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-sm"></div>
                    
                    {/* Moving dot */}
                    <div 
                      className="absolute w-6 h-6 bg-cyan-500 rounded-full shadow-lg transition-all duration-700 ease-in-out transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                      style={{ 
                        left: `${dotPosition.x}%`, 
                        top: `${dotPosition.y}%` 
                      }}
                    >
                      <div className="w-full h-full bg-cyan-400 rounded-full animate-ping"></div>
                    </div>

                    {/* Timer display */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <Timer className="w-5 h-5 text-cyan-600" />
                        <span className="text-2xl font-bold text-cyan-600">{timeLeft}</span>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg px-6 py-3 shadow-lg">
                      <p className="text-center text-slate-700 font-medium">Follow the moving dot with your eyes</p>
                    </div>
                  </>
                )}

                {/* Result Display */}
                {challengeResult && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm">
                      {challengeResult.status === 'PASS' ? (
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      ) : (
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      )}
                      <h3 className="text-2xl font-bold mb-2">
                        {challengeResult.status === 'PASS' ? 'Authentication Successful' : 'Authentication Failed'}
                      </h3>
                      <p className="text-slate-600 mb-6">
                        Challenge duration: {challengeResult.duration} seconds
                      </p>
                      <div className={`px-6 py-3 rounded-full font-bold text-lg ${
                        challengeResult.status === 'PASS' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {challengeResult.status}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Registration Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <User className="w-6 h-6 mr-2 text-cyan-600" />
                User Registration
              </h2>

              {!isRegistered ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={user.email}
                      onChange={(e) => setUser(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>
                  <button
                    onClick={handleRegister}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105"
                  >
                    Register & Activate Camera
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Registered Successfully</span>
                    </div>
                    <p className="text-sm text-green-700">{user.name}</p>
                    <p className="text-sm text-green-700">{user.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Challenge Controls */}
            {isRegistered && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Challenge Controls</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={startChallenge}
                    disabled={!isCameraActive || isChallengeActive}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Challenge
                  </button>

                  {challengeResult && (
                    <button
                      onClick={submitResult}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Submit Result
                    </button>
                  )}
                </div>

                {/* Status Indicators */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Camera Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      isCameraActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isCameraActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Challenge Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      isChallengeActive ? 'bg-yellow-100 text-yellow-800' : 
                      challengeResult ? (challengeResult.status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {isChallengeActive ? 'In Progress' : 
                       challengeResult ? challengeResult.status : 'Ready'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-cyan-50 rounded-2xl p-6 border border-cyan-200">
              <h4 className="font-bold text-cyan-800 mb-3">How it works:</h4>
              <ol className="text-sm text-cyan-700 space-y-2">
                <li>1. Register with your name and email</li>
                <li>2. Allow camera access when prompted</li>
                <li>3. Start the challenge and follow the moving dot</li>
                <li>4. View your authentication result</li>
                <li>5. Submit the result to complete verification</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;