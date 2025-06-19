import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square,
  Settings
} from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceOutputProps {
  text: string;
  autoPlay?: boolean;
  className?: string;
}

interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: string;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  rate: 1,
  pitch: 1,
  volume: 0.8,
  voice: 'default'
};

export function VoiceOutput({ text, autoPlay = false, className }: VoiceOutputProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [progress, setProgress] = useState(0);

  // Check for speech synthesis support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      
      // Load voices
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };

      loadVoices();
      speechSynthesis.addEventListener('voiceschanged', loadVoices);

      // Load saved settings
      const savedSettings = localStorage.getItem('voice-output-settings');
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (error) {
          console.error('Failed to load voice settings:', error);
        }
      }

      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    localStorage.setItem('voice-output-settings', JSON.stringify(settings));
  }, [settings]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && isSupported && text && text.trim()) {
      handlePlay();
    }
  }, [autoPlay, isSupported, text]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (speechSynthesis.speaking) {
          speechSynthesis.cancel();
        }
      } catch (error) {
        console.warn('Error during voice cleanup:', error);
      }
    };
  }, []);

  const cleanText = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    
    // Remove markdown formatting and other artifacts for better speech
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '[Code block]') // Replace code blocks
      .replace(/\[(\d+)\]\(.*?\)/g, 'Reference $1') // Replace citation links
      .replace(/#{1,6}\s*/g, '') // Remove markdown headers
      .replace(/\n+/g, '. ') // Replace line breaks with pauses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes
      .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
      .trim();
  };

  const handlePlay = () => {
    if (!isSupported) {
      toast.error("Text-to-speech is not supported in this browser");
      return;
    }

    if (!text || !text.trim()) {
      toast.error("No text to read");
      return;
    }

    // Stop any current speech
    try {
      speechSynthesis.cancel();
      // Small delay to ensure cancellation is processed
      setTimeout(() => {
        startSpeech();
      }, 100);
    } catch (error) {
      console.warn('Error cancelling speech:', error);
      startSpeech();
    }
  };
  
  const startSpeech = () => {
    const cleanedText = cleanText(text);
    
    if (!cleanedText) {
      toast.error("No valid text to read");
      return;
    }
    
    // Split long text into chunks for better reliability
    const maxLength = 200;
    const chunks = [];
    for (let i = 0; i < cleanedText.length; i += maxLength) {
      chunks.push(cleanedText.slice(i, i + maxLength));
    }
    
    let currentChunk = 0;
    
    const speakChunk = () => {
      if (currentChunk >= chunks.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        setTimeout(() => setProgress(0), 1000);
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(chunks[currentChunk]);
      
      // Apply settings
      utterance.rate = Math.max(0.1, Math.min(2.0, settings.rate));
      utterance.pitch = Math.max(0.1, Math.min(2.0, settings.pitch));
      utterance.volume = Math.max(0, Math.min(1, settings.volume));
      
      // Set voice
      if (settings.voice !== 'default' && availableVoices.length > 0) {
        const selectedVoice = availableVoices.find(voice => voice.name === settings.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      // Event handlers
      utterance.onstart = () => {
        if (currentChunk === 0) {
          setIsPlaying(true);
          setIsPaused(false);
        }
      };

      utterance.onend = () => {
        currentChunk++;
        const progressPercent = (currentChunk / chunks.length) * 100;
        setProgress(progressPercent);
        
        if (currentChunk < chunks.length && !isPaused) {
          // Continue with next chunk
          setTimeout(speakChunk, 50);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
          setTimeout(() => setProgress(0), 1000);
        }
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        if (event.error !== 'interrupted' && event.error !== 'cancelled') {
          toast.error(`Speech error: ${event.error}`);
        }
      };

      utteranceRef.current = utterance;
      
      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error starting speech:', error);
        toast.error("Failed to start speech");
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
      }
    };
    
    speakChunk();
  };

  const handlePause = () => {
    try {
      if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause();
        setIsPaused(true);
      }
    } catch (error) {
      console.error('Error pausing speech:', error);
    }
  };

  const handleResume = () => {
    try {
      if (speechSynthesis.paused) {
        speechSynthesis.resume();
        setIsPaused(false);
      }
    } catch (error) {
      console.error('Error resuming speech:', error);
      // If resume fails, try to restart
      handlePlay();
    }
  };

  const handleStop = () => {
    try {
      speechSynthesis.cancel();
    } catch (error) {
      console.error('Error stopping speech:', error);
    } finally {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
    }
  };

  const handleSettingChange = (key: keyof VoiceSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Main Control Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={isPlaying ? (isPaused ? handleResume : handlePause) : handlePlay}
        disabled={!text.trim()}
        className="h-8 w-8 hover:bg-accent"
        title={isPlaying ? (isPaused ? "Resume reading" : "Pause reading") : "Read aloud"}
      >
        {isPlaying ? (
          isPaused ? <Play size={14} /> : <Pause size={14} />
        ) : (
          <Volume2 size={14} />
        )}
      </Button>

      {/* Stop Button (only when playing) */}
      {isPlaying && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStop}
          className="h-8 w-8 hover:bg-accent"
          title="Stop reading"
        >
          <Square size={14} />
        </Button>
      )}

      {/* Progress Indicator */}
      {isPlaying && (
        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Settings Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-accent"
            title="Voice settings"
          >
            <Settings size={14} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <h4 className="font-medium">Voice Settings</h4>
            
            {/* Voice Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Voice</Label>
              <Select
                value={settings.voice}
                onValueChange={(value) => handleSettingChange('voice', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-40">
                  <SelectItem value="default">Default</SelectItem>
                  {availableVoices.map(voice => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speed */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs font-medium">Speed</Label>
                <span className="text-xs text-muted-foreground">{settings.rate.toFixed(1)}x</span>
              </div>
              <Slider
                value={[settings.rate]}
                onValueChange={(value) => handleSettingChange('rate', value[0])}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs font-medium">Pitch</Label>
                <span className="text-xs text-muted-foreground">{settings.pitch.toFixed(1)}</span>
              </div>
              <Slider
                value={[settings.pitch]}
                onValueChange={(value) => handleSettingChange('pitch', value[0])}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs font-medium">Volume</Label>
                <span className="text-xs text-muted-foreground">{Math.round(settings.volume * 100)}%</span>
              </div>
              <Slider
                value={[settings.volume]}
                onValueChange={(value) => handleSettingChange('volume', value[0])}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Test Button */}
            <Button 
              onClick={() => handlePlay()}
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              Test Voice
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}