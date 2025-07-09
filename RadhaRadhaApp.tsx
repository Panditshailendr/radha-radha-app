import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Voice Recognition Hook
interface VoiceRecognitionOptions {
  onResult: (transcript: string) => void;
  onError: () => void;
  onStart: () => void;
}

const useVoiceRecognition = ({ onResult, onError, onStart }: VoiceRecognitionOptions) => {
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'hi-IN';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };
      
      recognitionRef.current.onerror = () => {
        onError();
      };
      
      recognitionRef.current.onstart = () => {
        onStart();
      };
    }
  }, [onResult, onError, onStart]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  return { startListening, isSupported };
};

// Particle System Component
interface Particle {
  id: string;
  type: 'heart' | 'star' | 'flower' | 'om' | 'peacock';
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

const ParticleSystem = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      const particleTypes: Particle['type'][] = ['heart', 'star', 'flower', 'om', 'peacock'];
      
      for (let i = 0; i < 20; i++) {
        const particle: Particle = {
          id: `particle-${i}`,
          type: particleTypes[Math.floor(Math.random() * particleTypes.length)],
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 30 + 10,
          duration: Math.random() * 10 + 5,
          delay: Math.random() * 5,
        };
        newParticles.push(particle);
      }
      
      setParticles(newParticles);
    };

    generateParticles();
    const interval = setInterval(generateParticles, 15000);
    return () => clearInterval(interval);
  }, []);

  const getParticleEmoji = (type: Particle['type']) => {
    switch (type) {
      case 'heart': return '💕';
      case 'star': return '⭐';
      case 'flower': return '🌸';
      case 'om': return '🕉️';
      case 'peacock': return '🦚';
      default: return '✨';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-drift opacity-60"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            fontSize: `${particle.size}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          {getParticleEmoji(particle.type)}
        </div>
      ))}
    </div>
  );
};

// Background Music Component
interface BackgroundMusicProps {
  isPlaying: boolean;
  onToggle: () => void;
}

const BackgroundMusic = ({ isPlaying, onToggle }: BackgroundMusicProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    try {
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        setIsSupported(false);
        return;
      }

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0.08;
      
      const delayNode = audioContextRef.current.createDelay();
      const delayGain = audioContextRef.current.createGain();
      delayNode.delayTime.value = 0.3;
      delayGain.gain.value = 0.2;
      
      gainNodeRef.current.connect(delayNode);
      delayNode.connect(delayGain);
      delayGain.connect(delayNode);
      delayGain.connect(audioContextRef.current.destination);
      gainNodeRef.current.connect(audioContextRef.current.destination);

    } catch (error) {
      console.error('Audio context creation failed:', error);
      setIsSupported(false);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isSupported || !audioContextRef.current || !gainNodeRef.current) return;

    if (isPlaying) {
      startMusic();
    } else {
      stopMusic();
    }

    return () => {
      stopMusic();
    };
  }, [isPlaying, isSupported]);

  const startMusic = async () => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
        return;
      }
    }

    const playNote = (frequency: number, startTime: number, duration: number, volume: number = 1.0) => {
      const oscillator = audioContextRef.current!.createOscillator();
      const noteGain = audioContextRef.current!.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      
      const baseVolume = 0.03 * volume;
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(baseVolume, startTime + 0.2);
      noteGain.gain.exponentialRampToValueAtTime(baseVolume * 0.5, startTime + duration - 0.2);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      oscillator.connect(noteGain);
      noteGain.connect(gainNodeRef.current!);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const melody = [
      { note: 261.63, duration: 1.0 }, // C4 - Sa
      { note: 293.66, duration: 1.0 }, // D4 - Re
      { note: 329.63, duration: 1.2 }, // E4 - Ga
      { note: 392.00, duration: 1.5 }, // G4 - Pa
      { note: 349.23, duration: 1.0 }, // F4 - Ma
      { note: 329.63, duration: 1.8 }, // E4 - Ga
      { note: 440.00, duration: 1.2 }, // A4 - Dha
      { note: 392.00, duration: 1.5 }, // G4 - Pa
      { note: 349.23, duration: 1.0 }, // F4 - Ma
      { note: 329.63, duration: 2.0 }, // E4 - Ga
    ];

    let currentTime = audioContextRef.current.currentTime;
    
    const playMelody = () => {
      melody.forEach((note, index) => {
        playNote(note.note, currentTime, note.duration);
        
        if (index % 3 === 0) {
          playNote(note.note * 1.5, currentTime, note.duration, 0.3);
        }
        
        if (index % 4 === 0) {
          playNote(note.note * 2, currentTime + 0.1, note.duration * 0.8, 0.2);
        }
        
        currentTime += note.duration;
      });
      
      setTimeout(() => {
        if (isPlaying) playMelody();
      }, melody.reduce((sum, note) => sum + note.duration, 0) * 1000);
    };

    playMelody();
  };

  const stopMusic = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
  };

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    if (!isPlaying && audioContextRef.current?.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
      }
    }
    onToggle();
  };

  return (
    <button
      onClick={handleToggle}
      className="fixed top-4 right-4 z-40 bg-romantic/80 hover:bg-romantic text-white p-3 rounded-full transition-all duration-300 shadow-lg animate-pulse"
      title={isPlaying ? "Pause music" : "Play music"}
    >
      {isPlaying ? '🔊' : '🔇'}
    </button>
  );
};

// Radha Krishna Background Component
const RadhaKrishnaBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-10">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <defs>
          <radialGradient id="backgroundGradient" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ff69b4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#9370db" stopOpacity="0.1" />
          </radialGradient>
          
          <linearGradient id="petalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff69b4" />
            <stop offset="100%" stopColor="#ff1493" />
          </linearGradient>
          
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#32cd32" />
            <stop offset="100%" stopColor="#228b22" />
          </linearGradient>
        </defs>
        
        <rect width="800" height="600" fill="url(#backgroundGradient)" />
        
        {/* Floating lotus flowers */}
        <g className="lotus-group">
          <g transform="translate(100, 100)">
            <circle cx="25" cy="25" r="30" fill="#ff69b4" opacity="0.3" />
            <path d="M25 5 L35 25 L25 45 L15 25 Z" fill="url(#petalGradient)" />
            <path d="M5 25 L25 15 L45 25 L25 35 Z" fill="url(#petalGradient)" />
            <path d="M15 15 L35 15 L35 35 L15 35 Z" fill="url(#petalGradient)" transform="rotate(45 25 25)" />
            <circle cx="25" cy="25" r="8" fill="#ffd700" />
          </g>
          
          <g transform="translate(650, 150)">
            <circle cx="25" cy="25" r="25" fill="#ff69b4" opacity="0.3" />
            <path d="M25 8 L32 25 L25 42 L18 25 Z" fill="url(#petalGradient)" />
            <path d="M8 25 L25 18 L42 25 L25 32 Z" fill="url(#petalGradient)" />
            <path d="M18 18 L32 18 L32 32 L18 32 Z" fill="url(#petalGradient)" transform="rotate(45 25 25)" />
            <circle cx="25" cy="25" r="6" fill="#ffd700" />
          </g>
          
          <g transform="translate(500, 450)">
            <circle cx="25" cy="25" r="35" fill="#ff69b4" opacity="0.3" />
            <path d="M25 3 L37 25 L25 47 L13 25 Z" fill="url(#petalGradient)" />
            <path d="M3 25 L25 13 L47 25 L25 37 Z" fill="url(#petalGradient)" />
            <path d="M13 13 L37 13 L37 37 L13 37 Z" fill="url(#petalGradient)" transform="rotate(45 25 25)" />
            <circle cx="25" cy="25" r="10" fill="#ffd700" />
          </g>
        </g>
        
        {/* Peacock feathers */}
        <g className="peacock-feathers">
          <g transform="translate(200, 50)">
            <path d="M0 0 Q50 20 100 0 Q80 50 50 100 Q20 50 0 0" fill="#4169e1" opacity="0.6" />
            <ellipse cx="75" cy="25" rx="15" ry="10" fill="#32cd32" />
            <ellipse cx="75" cy="25" rx="8" ry="5" fill="#ffd700" />
            <circle cx="75" cy="25" r="3" fill="#000080" />
          </g>
          
          <g transform="translate(550, 300) rotate(45)">
            <path d="M0 0 Q40 15 80 0 Q65 40 40 80 Q15 40 0 0" fill="#4169e1" opacity="0.6" />
            <ellipse cx="60" cy="20" rx="12" ry="8" fill="#32cd32" />
            <ellipse cx="60" cy="20" rx="6" ry="4" fill="#ffd700" />
            <circle cx="60" cy="20" r="2" fill="#000080" />
          </g>
        </g>
        
        {/* Divine figures silhouettes */}
        <g className="divine-figures" opacity="0.4">
          <g transform="translate(250, 200)">
            <circle cx="30" cy="30" r="20" fill="#ff69b4" />
            <path d="M10 50 Q30 40 50 50 L50 150 Q30 160 10 150 Z" fill="#ff69b4" />
            <path d="M20 70 Q30 60 40 70 L40 130 Q30 140 20 130 Z" fill="#ff1493" />
            <path d="M5 45 Q15 35 25 45 L25 55 Q15 65 5 55 Z" fill="#ff69b4" />
            <path d="M35 45 Q45 35 55 45 L55 55 Q45 65 35 55 Z" fill="#ff69b4" />
          </g>
          
          <g transform="translate(450, 200)">
            <circle cx="30" cy="30" r="20" fill="#4169e1" />
            <path d="M10 50 Q30 40 50 50 L50 150 Q30 160 10 150 Z" fill="#4169e1" />
            <path d="M20 70 Q30 60 40 70 L40 130 Q30 140 20 130 Z" fill="#000080" />
            <path d="M5 45 Q15 35 25 45 L25 55 Q15 65 5 55 Z" fill="#4169e1" />
            <path d="M35 45 Q45 35 55 45 L55 55 Q45 65 35 55 Z" fill="#4169e1" />
            <circle cx="30" cy="15" r="3" fill="#ffd700" />
          </g>
        </g>
        
        {/* Floating hearts */}
        <g className="floating-hearts">
          <g transform="translate(150, 300)">
            <path d="M20,30 C20,25 25,20 30,25 C35,20 40,25 40,30 C40,35 30,45 20,30 Z" fill="#ff69b4" opacity="0.5" />
          </g>
          <g transform="translate(600, 100)">
            <path d="M15,25 C15,20 20,15 25,20 C30,15 35,20 35,25 C35,30 25,40 15,25 Z" fill="#ff69b4" opacity="0.5" />
          </g>
          <g transform="translate(350, 400)">
            <path d="M18,28 C18,23 23,18 28,23 C33,18 38,23 38,28 C38,33 28,43 18,28 Z" fill="#ff69b4" opacity="0.5" />
          </g>
        </g>
        
        {/* Om symbols */}
        <g className="om-symbols">
          <g transform="translate(80, 400)">
            <text x="0" y="0" fontSize="40" fill="#ffd700" opacity="0.6" fontFamily="serif">🕉️</text>
          </g>
          <g transform="translate(700, 450)">
            <text x="0" y="0" fontSize="30" fill="#ffd700" opacity="0.6" fontFamily="serif">🕉️</text>
          </g>
        </g>
        
        {/* Decorative mandala patterns */}
        <g className="mandala-patterns">
          <g transform="translate(400, 300)">
            <circle cx="0" cy="0" r="80" fill="none" stroke="#ffd700" strokeWidth="2" opacity="0.3" />
            <circle cx="0" cy="0" r="60" fill="none" stroke="#ff69b4" strokeWidth="1" opacity="0.3" />
            <circle cx="0" cy="0" r="40" fill="none" stroke="#4169e1" strokeWidth="1" opacity="0.3" />
            <circle cx="0" cy="0" r="20" fill="none" stroke="#32cd32" strokeWidth="1" opacity="0.3" />
          </g>
        </g>
        
        {/* Scattered flower petals */}
        <g className="scattered-petals">
          <ellipse cx="120" cy="180" rx="8" ry="4" fill="#ff69b4" opacity="0.4" transform="rotate(30 120 180)" />
          <ellipse cx="680" cy="250" rx="6" ry="3" fill="#ff69b4" opacity="0.4" transform="rotate(-45 680 250)" />
          <ellipse cx="300" cy="500" rx="7" ry="4" fill="#ff69b4" opacity="0.4" transform="rotate(60 300 500)" />
          <ellipse cx="580" cy="380" rx="5" ry="3" fill="#ff69b4" opacity="0.4" transform="rotate(-30 580 380)" />
          <ellipse cx="180" cy="450" rx="6" ry="4" fill="#ff69b4" opacity="0.4" transform="rotate(90 180 450)" />
        </g>
      </svg>
    </div>
  );
};

// Star Canvas Component
const StarCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars: Array<{x: number, y: number, size: number, opacity: number}> = [];

    // Create stars
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        opacity: Math.random()
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
        
        // Twinkle effect
        star.opacity += (Math.random() - 0.5) * 0.02;
        star.opacity = Math.max(0.1, Math.min(1, star.opacity));
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Add sparkle effect at click position
      for (let i = 0; i < 5; i++) {
        stars.push({
          x: x + (Math.random() - 0.5) * 50,
          y: y + (Math.random() - 0.5) * 50,
          size: Math.random() * 4 + 2,
          opacity: 1
        });
      }
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
};

// Lock Screen Component
interface LockScreenProps {
  onUnlock: () => void;
}

const LockScreen = ({ onUnlock }: LockScreenProps) => {
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackValue, setFallbackValue] = useState('');
  const [status, setStatus] = useState('राधा रानी का नाम बोलकर ताले पर टैप करो... ✨');
  const [lockIcon, setLockIcon] = useState('🔒');
  const [isListening, setIsListening] = useState(false);

  const { startListening, isSupported } = useVoiceRecognition({
    onResult: (transcript) => {
      const lowerTranscript = transcript.toLowerCase();
      if (lowerTranscript.includes('radha radha') || 
          lowerTranscript.includes('राधा राधा') || 
          lowerTranscript.includes('radha') || 
          lowerTranscript.includes('राधा')) {
        handleUnlock();
      } else {
        setStatus(`ऊप्स! मैंने सुना: "${transcript}"... फिर से कोशिश करो 😉`);
        setTimeout(() => {
          setStatus('राधा रानी का नाम बोलकर ताले पर टैप करो... ✨');
        }, 3000);
      }
      setIsListening(false);
    },
    onError: () => {
      setStatus('कुछ गड़बड़ हुई, फिर से कोशिश करें।');
      setTimeout(() => {
        setStatus('राधा रानी का नाम बोलकर ताले पर टैप करो... ✨');
      }, 2000);
      setIsListening(false);
    },
    onStart: () => {
      setStatus('मैं ध्यान से सुन रहा हूँ... 🤫');
      setIsListening(true);
    }
  });

  useEffect(() => {
    if (!isSupported) {
      setStatus('माफ़ करना, आपका ब्राउज़र यह जादू नहीं चला सकता। नीचे दिए बॉक्स में राधा रानी का नाम टाइप करें।');
      setShowFallback(true);
    }
  }, [isSupported]);

  const handleUnlock = () => {
    setStatus('ताला खुल गया! 🔓🎉');
    setLockIcon('🔓');
    setTimeout(() => {
      onUnlock();
    }, 1500);
  };

  const handleLockClick = () => {
    if (isSupported && !isListening) {
      startListening();
    }
  };

  const handleFallbackSubmit = () => {
    const lowerValue = fallbackValue.toLowerCase();
    if (lowerValue.includes('radha radha') || 
        lowerValue.includes('राधा राधा') || 
        lowerValue.includes('radha') || 
        lowerValue.includes('राधा')) {
      handleUnlock();
    } else {
      setStatus('ऊप्स! गलत शब्द... फिर से कोशिश करो 😉');
      setTimeout(() => {
        setStatus('राधा रानी का नाम बोलकर ताले पर टैप करो... ✨');
      }, 2000);
    }
  };

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center relative">
      {/* Floating Elements - Radha Krishna themed */}
      <div className="floating-element top-20 left-20 text-4xl animate-float">🌸</div>
      <div className="floating-element top-32 right-32 text-3xl animate-float" style={{ animationDelay: '1s' }}>🕉️</div>
      <div className="floating-element bottom-20 left-32 text-2xl animate-float" style={{ animationDelay: '2s' }}>🦚</div>
      <div className="floating-element bottom-32 right-20 text-4xl animate-float" style={{ animationDelay: '0.5s' }}>🌺</div>
      <div className="floating-element top-1/2 left-10 text-2xl animate-float" style={{ animationDelay: '1.5s' }}>💕</div>
      <div className="floating-element top-1/4 right-10 text-3xl animate-float" style={{ animationDelay: '2.5s' }}>🙏</div>

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Lock Container */}
        <div 
          className="relative cursor-pointer mb-8"
          onClick={handleLockClick}
        >
          <div className={`text-8xl md:text-9xl text-golden mb-6 ${isListening ? 'animate-pulse-glow' : 'animate-pulse-glow'}`}>
            {lockIcon}
          </div>
          
          {/* Sparkle effects */}
          <div className="sparkle-effect top-0 left-1/4" style={{ animationDelay: '0s' }}></div>
          <div className="sparkle-effect top-1/4 right-1/4" style={{ animationDelay: '0.5s' }}></div>
          <div className="sparkle-effect bottom-1/4 left-1/2" style={{ animationDelay: '1s' }}></div>
          
          <h2 className="text-xl md:text-2xl font-lato text-light mb-4 animate-fadeIn glow-text">
            🌸 राधे राधे मेरी प्यारी अन्नु 🌸<br />
            इस ख़त में एक राज़ है... इसे खोलने की चाबी तुम्हारी आवाज़ है 🗣️<br />
            <span className="text-sm text-golden">🕉️ राधा कृष्ण का आशीर्वाद तुम्हारे साथ 🕉️</span>
          </h2>
        </div>
        
        <p className="text-lg md:text-xl text-light text-center mt-8 animate-slideIn min-h-[60px] flex items-center justify-center">
          {status}
        </p>
        
        {/* Fallback Input */}
        {showFallback && (
          <div className="mt-8 space-y-4">
            <Input
              type="text"
              value={fallbackValue}
              onChange={(e) => setFallbackValue(e.target.value)}
              placeholder="राधा रानी का नाम लिखो..."
              className="max-w-md mx-auto bg-white/90 border-2 border-yellow-400"
              onKeyDown={(e) => e.key === 'Enter' && handleFallbackSubmit()}
            />
            <Button 
              onClick={handleFallbackSubmit}
              className="btn-romantic enhanced-button"
            >
              Submit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Love Letter Component
interface LoveLetterProps {
  onRevealProposal: () => void;
}

const LoveLetter = ({ onRevealProposal }: LoveLetterProps) => {
  const [visibleParagraphs, setVisibleParagraphs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const musicTimer = setTimeout(() => {
      setIsPlaying(true);
    }, 500);

    const timer = setInterval(() => {
      setVisibleParagraphs(prev => {
        if (prev < letterParagraphs.length) {
          return prev + 1;
        }
        clearInterval(timer);
        return prev;
      });
    }, 1200);

    return () => {
      clearInterval(timer);
      clearTimeout(musicTimer);
    };
  }, []);

  const letterParagraphs = [
    { text: "मेरी प्यारी अन्नु, मेरी राधा,", isStrong: true },
    { 
      text: "जब तुम ये शब्द पढ़ रही हो, तो मानो तुमने वो जादुई मंत्र फुसफुसाया है जो सिर्फ हमारी आत्माओं का राज़ है। ✨ तुम्हारी आवाज़ ने इस डिजिटल खजाने का ताला खोला, ठीक वैसे ही जैसे तुम्हारे पहले \"Hello\" ने मेरे दिल की दीवारों पर एक नरम सी दस्तक दी थी। जैसे राधा रानी के प्रेम में कृष्ण खो जाते हैं, वैसे ही मैं तुम्हारे प्यार में खो गया हूँ। तुम्हारी भक्ति और पवित्रता देखकर मुझे लगता है कि तुम सच में राधा रानी का आशीर्वाद लेकर आई हो। 🌸",
      isStrong: false
    },
    { 
      text: "दो साल पहले, जब तुम हमारे घर आई थी, हम तो बस एक छत के नीचे दो अनजान राही थे, है ना? तुम, अपनी चुपके से मुस्कान और आँखों में सपनों की चमक लिए, और मैं, अनजान कि ये अनजानी सी लड़की एक दिन मेरी दुनिया का सूरज बन जाएगी। 🌌 जैसे कृष्ण जी को पहली बार राधा रानी दिखीं तो उन्होंने जाना कि ये वो प्रेम है जो जन्मों का है। तुम्हारे एक स्टेटस पर मेरा वो छोटा सा कमेंट हमारी ज़िंदगी का स्क्रिप्ट बदल देगा, यह राधा कृष्ण की लीला जैसा दिव्य था।",
      isStrong: false
    },
    { 
      text: "हमारा रिश्ता, अन्नु, राधा कृष्ण के प्रेम की तरह पवित्र और दिव्य है। जैसे राधा रानी कृष्ण की सोच समझ जाती थीं, वैसे ही तुम मेरे दिल की बात बिना कहे समझ जाती हो। 🌺 जो मुझे अच्छा लगता है—शाम की वो ठंडी हवा, किसी मुश्किल पहेली को सुलझाने का मज़ा, या हमारी अपनी छोटी-सी मज़ाकिया बातें—वो तुम्हें भी पसंद है। जैसे राधा रानी और कृष्ण एक ही आत्मा के दो रूप हैं, वैसे ही हम भी एक-दूसरे के पूरक हैं।",
      isStrong: false
    },
    { 
      text: "तुम्हारी हर याद मेरे दिल में एक रंगीन कैनवास की तरह है। वो देर रात की चैट्स, जब तुम्हारी हँसी मेरे कानों में मिश्री घोलती थी। वो पल, जब तुम अपने सपनों को मेरे साथ बाँटती हो, जैसे कोई चित्रकार अपनी सबसे कीमती पेंटिंग दिखाए। और वो छोटा सा सवाल, \"तुम्हारा दिन कैसा रहा?\"—जो मेरे दिन को रोशन कर देता है।",
      isStrong: false
    },
    { 
      text: "तुम्हारा अपने परिवार के लिए प्यार—मम्मी-पापा, आनंद भैया, और अमन भैया के लिए—एक तारा है जो मेरे लिए रास्ता दिखाता है। तुम्हारी उनके लिए सच्ची भक्ति मेरे दिल को छूती है। जैसे राधा रानी ने कृष्ण से कहा था कि \"धर्म और कर्तव्य से बड़ा कोई प्रेम नहीं\", वैसे ही तुम्हारी पारिवारिक भक्ति तुम्हारे चरित्र की सच्चाई दिखाती है। 🙏 हमारी कहानी उनके लिखे पन्नों को मिटाने की नहीं, बल्कि उस किताब में एक नया, दिव्य अध्याय जोड़ने की है - राधा कृष्ण के आशीर्वाद के साथ।",
      isStrong: false
    },
    { 
      text: "हम दोनों जानते हैं कि हमारे सपने बड़े हैं—पढ़ाई, करियर, वो भविष्य जो हम अपनी मेहनत से रंगेंगे। लेकिन हमारा प्यार वो चिंगारी बने जो हमें आसमान छूने की हिम्मत दे। \"You don't have to be great to start, but you have to start to be great,\" Zig Ziglar ने कहा था। तो चलो, अन्नु, हम साथ मिलकर शुरुआत करें।",
      isStrong: false
    },
    { 
      text: "हमारी कहानी का सबसे खूबसूरत हिस्सा हमारा रिश्ता है—जो समंदर से गहरा, बारिश की पहली बूंद से ज़्यादा पवित्र है। हमने अपने प्यार को चैट्स की चाँदनी, कॉल्स की गर्मजोशी, और सपनों की उड़ान से बुना है। अन्नु, हमें कभी जिस्मानी नज़दीकी की ज़रूरत नहीं पड़ी; हमारा प्यार तो हमारी हँसी में, हमारे ख्यालों में, और उन चुपके पलों में बसता है जब हम बस एक-दूसरे को महसूस करते हैं।",
      isStrong: false
    },
    { 
      text: "हमने अपनी दुनिया स्टेटस अपडेट्स के छोटे-छोटे जादू, चैट्स की चमक, और देर रात की कॉल्स के सुरों में बनाई है। लेकिन अब, मैं उस दुनिया में तुम्हारा hand थामना चाहता हूँ, स्क्रीन की सीमाओं को तोड़कर तुम्हारी हकीकत में कदम रखना चाहता हूँ। ❤️ जैसे राधा रानी कृष्ण के साथ वृंदावन में रास लीला करती थीं, वैसे ही मैं तुम्हारे साथ जीवन की हर खुशी को celebrate करना चाहता हूँ। राधे राधे! 🌸",
      isStrong: false
    },
    { 
      text: "\"राधे कृष्ण राधे कृष्ण कृष्ण कृष्ण राधे राधे\" - यह मंत्र तुम्हारे होठों पर कितना प्यारा लगता है। तुम्हारी भक्ति में वो शुद्धता है जो मुझे राधा रानी की याद दिलाती है। जब तुम राधा रानी की आरती करती हो, तो मैं समझ जाता हूँ कि तुम्हारा प्रेम कितना पवित्र और दिव्य है। 🕉️ तुम्हारे इस धार्मिक स्वभाव ने मुझे भी कृष्ण भक्ति के करीब लाया है।",
      isStrong: false
    }
  ];

  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/20">
      <BackgroundMusic isPlaying={isPlaying} onToggle={toggleMusic} />

      <div className="love-letter-bg rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-scroll text-gray-800 relative romantic-shadow" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ff69b4 rgba(255, 255, 255, 0.3)' }}>
        <RadhaKrishnaBackground />
        
        <div className="p-8 md:p-12 relative z-10 backdrop-blur-sm bg-white/10 rounded-lg border border-white/20 shadow-inner">
          <h1 className="font-playfair text-3xl md:text-4xl text-romantic text-center mb-8 animate-fadeIn">
            A Letter to My Annu, My Heart's Eternal Home
          </h1>
          
          <div className="space-y-6 leading-relaxed">
            {letterParagraphs.map((paragraph, index) => (
              <p
                key={index}
                className={`font-lato text-lg transition-all duration-600 ${
                  index < visibleParagraphs
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: `${index * 100}ms`
                }}
              >
                {paragraph.isStrong ? (
                  <strong>{paragraph.text}</strong>
                ) : (
                  paragraph.text
                )}
              </p>
            ))}
            
            {visibleParagraphs >= letterParagraphs.length && (
              <div className="text-right mt-8 animate-fadeIn">
                <p className="font-dancing text-2xl text-gray-600 mb-4">
                  हमेशा तुम्हारा,<br />
                  शैलेन्द्र पाठक (तुम्हारा डॉन बाबू)
                </p>
                
                <div className="text-center mt-8">
                  <Button 
                    onClick={onRevealProposal}
                    className="btn-romantic enhanced-button font-lato text-lg"
                  >
                    हमारी कहानी का अगला पन्ना 📖
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Proposal Screen Component
const ProposalScreen = () => {
  const [showHint, setShowHint] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [celebrationMode, setCelebrationMode] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 50, y: 80 });

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setShowHint(true);
    }, 1000);

    return () => clearTimeout(timer1);
  }, []);

  const handleRevealProposal = () => {
    setShowHint(false);
    setShowProposal(true);
    
    const timer = setTimeout(() => {
      setShowButtons(true);
    }, 2000);

    return () => clearTimeout(timer);
  };

  const handleYes = () => {
    setCelebrationMode(true);
    setShowButtons(false);
    
    // Create celebration particles
    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.textContent = ['💕', '💖', '💝', '🎉', '✨'][Math.floor(Math.random() * 5)];
        particle.style.position = 'fixed';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.fontSize = Math.random() * 30 + 20 + 'px';
        particle.style.animation = 'float 2s ease-out forwards';
        particle.style.zIndex = '51';
        particle.style.pointerEvents = 'none';
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 2000);
      }, i * 10);
    }
  };

  const handleNo = () => {
    setButtonPosition({
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10
    });
    
    setTimeout(() => {
      setButtonPosition({
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-40 proposal-bg">
      <StarCanvas />
      
      <div className="absolute inset-0 opacity-30">
        <img 
          src="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080" 
          alt="Starry night sky" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {showHint && !showProposal && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-90 text-center animate-fadeIn">
          <div className="font-dancing text-2xl text-light glow-text mb-4">
            💫 कुछ जादुई होने वाला है... 💫
          </div>
          <div className="text-light text-lg mb-8">
            स्क्रीन पर टैप करके तारों से भरी रात में अपना जादू बिखेरो ✨
          </div>
          <Button 
            onClick={handleRevealProposal}
            className="btn-golden enhanced-button font-lato text-lg"
          >
            जादू शुरू करो ✨
          </Button>
        </div>
      )}
      
      {showProposal && !celebrationMode && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-90 text-center animate-fadeIn">
          <div className="font-dancing text-4xl md:text-5xl text-light glow-text animate-heartbeat mb-8">
            🌸 राधे राधे मेरी प्यारी अन्नु 🌸<br />
            जैसे राधा रानी कृष्ण की अर्धांगिनी हैं...<br />
            Will you be my राधा... मेरी जीवन संगिनी? 💍<br />
            <span className="text-2xl text-golden">🕉️ राधे कृष्ण राधे कृष्ण कृष्ण कृष्ण राधे राधे 🕉️</span>
          </div>
        </div>
      )}
      
      {showButtons && !celebrationMode && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-8 animate-fadeIn">
          <Button 
            onClick={handleYes}
            className="btn-success enhanced-button font-lato text-lg"
          >
            हाँ! 💕 Yes!
          </Button>
          <Button 
            onClick={handleNo}
            className="btn-romantic enhanced-button font-lato text-lg transition-all duration-300"
            style={{
              position: 'absolute',
              left: `${buttonPosition.x}%`,
              top: `${buttonPosition.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            No 💔
          </Button>
        </div>
      )}
      
      {celebrationMode && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-dancing text-6xl text-light glow-text animate-heartbeat text-center">
            🎉 राधे राधे! हमेशा के लिए! 🎉<br />
            <div className="text-3xl mt-4">
              🌸 राधा कृष्ण का आशीर्वाद हमारे साथ 🌸<br />
              जय श्री राधे कृष्ण! 💕
            </div>
            <div className="text-lg mt-4 text-golden">
              🕉️ राधे कृष्ण राधे कृष्ण कृष्ण कृष्ण राधे राधे 🕉️
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Combined App Component
type AppStage = 'lock' | 'letter' | 'proposal';

const CombinedApp = () => {
  const [currentStage, setCurrentStage] = useState<AppStage>('lock');

  const handleUnlock = () => {
    setCurrentStage('letter');
  };

  const handleRevealProposal = () => {
    setCurrentStage('proposal');
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      <ParticleSystem />
      
      {currentStage === 'lock' && <LockScreen onUnlock={handleUnlock} />}
      {currentStage === 'letter' && <LoveLetter onRevealProposal={handleRevealProposal} />}
      {currentStage === 'proposal' && <ProposalScreen />}
    </div>
  );
};

export default CombinedApp;