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
    if (autoPlay && isSupported && text.trim()) {
      handlePlay();
    }
  }, [autoPlay, isSupported, text]);

  const cleanText = (text: string): string => {
    // Remove markdown formatting and other artifacts for better speech
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '[Code block]') // Replace code blocks
      .replace(/\[(\d+)\]\(.*?\)/g, 'Reference $1') // Replace citation links
      .replace(/\n+/g, '. ') // Replace line breaks with pauses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  const handlePlay = () => {
    if (!isSupported) {
      toast.error("Text-to-speech is not supported in this browser");
      return;
    }

    if (!text.trim()) {
      toast.error("No text to read");
      return;
    }

    // Stop any current speech
    speechSynthesis.cancel();

    const cleanedText = cleanText(text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Apply settings
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    
    // Set voice
    if (settings.voice !== 'default') {
      const selectedVoice = availableVoices.find(voice => voice.name === settings.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    // Event handlers
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      toast.error("Speech synthesis failed");
    };

    utterance.onboundary = (event) => {
      // Update progress based on character position
      const progressPercent = (event.charIndex / cleanedText.length) * 100;
      setProgress(Math.min(progressPercent, 100));
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
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