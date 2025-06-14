import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  Contrast,
  Type,
  Layers,
  Sparkles,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/providers/ThemeProvider";

interface ThemeSettings {
  accentColor: string;
  fontSize: number;
  fontFamily: string;
  borderRadius: number;
  density: 'comfortable' | 'compact' | 'spacious';
  animations: boolean;
  highContrast: boolean;
}

const accentColors = [
  { name: 'Blue', value: 'blue', color: '#3B82F6' },
  { name: 'Purple', value: 'purple', color: '#8B5CF6' },
  { name: 'Green', value: 'green', color: '#10B981' },
  { name: 'Orange', value: 'orange', color: '#F59E0B' },
  { name: 'Pink', value: 'pink', color: '#EC4899' },
  { name: 'Red', value: 'red', color: '#EF4444' },
  { name: 'Teal', value: 'teal', color: '#14B8A6' },
  { name: 'Indigo', value: 'indigo', color: '#6366F1' }
];

const fontFamilies = [
  { name: 'System Default', value: 'system' },
  { name: 'Inter', value: 'inter' },
  { name: 'Roboto', value: 'roboto' },
  { name: 'Open Sans', value: 'open-sans' },
  { name: 'Source Sans Pro', value: 'source-sans-pro' },
  { name: 'Poppins', value: 'poppins' },
  { name: 'Lato', value: 'lato' },
  { name: 'Montserrat', value: 'montserrat' }
];

export function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [settings, setSettings] = useState<ThemeSettings>({
    accentColor: 'blue',
    fontSize: 14,
    fontFamily: 'system',
    borderRadius: 8,
    density: 'comfortable',
    animations: true,
    highContrast: false
  });

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('synthesis-theme-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        applyThemeSettings(parsed);
      } catch (error) {
        console.error('Error loading theme settings:', error);
      }
    }
  }, []);

  const saveSettings = (newSettings: ThemeSettings) => {
    setSettings(newSettings);
    localStorage.setItem('synthesis-theme-settings', JSON.stringify(newSettings));
    applyThemeSettings(newSettings);
    toast.success('Theme settings saved');
  };

  const applyThemeSettings = (settings: ThemeSettings) => {
    const root = document.documentElement;
    
    // Apply font size
    root.style.setProperty('--font-size-base', `${settings.fontSize}px`);
    
    // Apply border radius
    root.style.setProperty('--radius', `${settings.borderRadius}px`);
    
    // Apply font family
    if (settings.fontFamily !== 'system') {
      root.style.setProperty('--font-family', settings.fontFamily);
    }
    
    // Apply density
    const densityValues = {
      compact: '0.75rem',
      comfortable: '1rem',
      spacious: '1.25rem'
    };
    root.style.setProperty('--spacing-unit', densityValues[settings.density]);
    
    // Apply animations
    if (!settings.animations) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.setProperty('--animation-duration', '0.2s');
    }
    
    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: ThemeSettings = {
      accentColor: 'blue',
      fontSize: 14,
      fontFamily: 'system',
      borderRadius: 8,
      density: 'comfortable',
      animations: true,
      highContrast: false
    };
    saveSettings(defaultSettings);
  };

  const handleSettingChange = (key: keyof ThemeSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Palette size={18} />
          <span className="sr-only">Customize Theme</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette size={20} />
            Theme Customization
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Personalize the appearance and feel of the interface
          </p>
        </DialogHeader>
        
        <Tabs defaultValue="appearance" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="overflow-y-auto max-h-[60vh] space-y-6">
            {/* Color Scheme */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Monitor size={16} />
                Color Scheme
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'system', label: 'Auto', icon: Monitor },
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon }
                ].map(option => (
                  <Button
                    key={option.value}
                    variant={theme === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(option.value as any)}
                    className="flex items-center gap-2"
                  >
                    <option.icon size={14} />
                    {option.label}
                    {theme === option.value && <Check size={12} className="ml-auto" />}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Current: {theme === 'system' ? `System (${resolvedTheme})` : theme}
              </p>
            </div>

            {/* Accent Color */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Accent Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {accentColors.map(color => (
                  <Button
                    key={color.value}
                    variant={settings.accentColor === color.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSettingChange('accentColor', color.value)}
                    className="flex items-center gap-2"
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color.color }}
                    />
                    {color.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Border Radius */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Border Radius</Label>
              <div className="px-3">
                <Slider
                  value={[settings.borderRadius]}
                  onValueChange={([value]) => handleSettingChange('borderRadius', value)}
                  max={16}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Sharp (0px)</span>
                  <span>{settings.borderRadius}px</span>
                  <span>Rounded (16px)</span>
                </div>
              </div>
            </div>

            {/* Density */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Layers size={16} />
                Interface Density
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'compact', label: 'Compact' },
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'spacious', label: 'Spacious' }
                ].map(option => (
                  <Button
                    key={option.value}
                    variant={settings.density === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSettingChange('density', option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="typography" className="overflow-y-auto max-h-[60vh] space-y-6">
            {/* Font Family */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Type size={16} />
                Font Family
              </Label>
              <Select 
                value={settings.fontFamily} 
                onValueChange={(value) => handleSettingChange('fontFamily', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map(font => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Font Size</Label>
              <div className="px-3">
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={([value]) => handleSettingChange('fontSize', value)}
                  max={18}
                  min={12}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Small (12px)</span>
                  <span>{settings.fontSize}px</span>
                  <span>Large (18px)</span>
                </div>
              </div>
            </div>

            {/* Preview Text */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Preview</Label>
              <div 
                className="border rounded-lg p-4 bg-muted/50"
                style={{ 
                  fontSize: `${settings.fontSize}px`,
                  fontFamily: settings.fontFamily !== 'system' ? settings.fontFamily : undefined
                }}
              >
                <p className="font-semibold mb-2">The quick brown fox jumps over the lazy dog</p>
                <p className="text-muted-foreground text-sm">
                  This is how your text will appear with the selected typography settings.
                  You can adjust the font family and size to your preference.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="behavior" className="overflow-y-auto max-h-[60vh] space-y-6">
            {/* Animations */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Sparkles size={16} />
                  Animations
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable smooth transitions and animations
                </p>
              </div>
              <Switch
                checked={settings.animations}
                onCheckedChange={(checked) => handleSettingChange('animations', checked)}
              />
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Contrast size={16} />
                  High Contrast
                </Label>
                <p className="text-sm text-muted-foreground">
                  Increase contrast for better accessibility
                </p>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
              />
            </div>

            {/* Reset to Defaults */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={resetToDefaults}
                className="w-full"
              >
                Reset to Defaults
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}