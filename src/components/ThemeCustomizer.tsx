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
  { name: 'Purple', value: 'purple', hsl: '252 56% 57%', color: '#8B5CF6' },
  { name: 'Blue', value: 'blue', hsl: '221 83% 53%', color: '#3B82F6' },
  { name: 'Green', value: 'green', hsl: '142 71% 45%', color: '#10B981' },
  { name: 'Orange', value: 'orange', hsl: '25 95% 53%', color: '#F59E0B' },
  { name: 'Pink', value: 'pink', hsl: '330 81% 60%', color: '#EC4899' },
  { name: 'Red', value: 'red', hsl: '0 72% 51%', color: '#EF4444' },
  { name: 'Teal', value: 'teal', hsl: '173 80% 40%', color: '#14B8A6' },
  { name: 'Indigo', value: 'indigo', hsl: '239 84% 67%', color: '#6366F1' }
];

const fontFamilies = [
  { name: 'System Default', value: 'system', css: 'ui-sans-serif, system-ui, sans-serif' },
  { name: 'Inter', value: 'inter', css: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { name: 'Roboto', value: 'roboto', css: 'Roboto, ui-sans-serif, system-ui, sans-serif' },
  { name: 'Open Sans', value: 'open-sans', css: '"Open Sans", ui-sans-serif, system-ui, sans-serif' },
  { name: 'Source Sans Pro', value: 'source-sans-pro', css: '"Source Sans Pro", ui-sans-serif, system-ui, sans-serif' },
  { name: 'Poppins', value: 'poppins', css: 'Poppins, ui-sans-serif, system-ui, sans-serif' },
  { name: 'JetBrains Mono', value: 'jetbrains-mono', css: '"JetBrains Mono", ui-monospace, monospace' },
  { name: 'Fira Code', value: 'fira-code', css: '"Fira Code", ui-monospace, monospace' }
];

export function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [settings, setSettings] = useState<ThemeSettings>({
    accentColor: 'purple',
    fontSize: 16,
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
    
    // Apply accent color (primary color)
    const accentColor = accentColors.find(c => c.value === settings.accentColor);
    if (accentColor) {
      root.style.setProperty('--primary', accentColor.hsl);
      root.style.setProperty('--ring', accentColor.hsl);
    }
    
    // Apply border radius
    root.style.setProperty('--radius', `${settings.borderRadius / 16}rem`);
    
    // Apply font family
    const fontFamily = fontFamilies.find(f => f.value === settings.fontFamily);
    if (fontFamily && fontFamily.value !== 'system') {
      root.style.fontFamily = fontFamily.css;
    } else {
      root.style.removeProperty('font-family');
    }
    
    // Apply font size
    root.style.fontSize = `${settings.fontSize}px`;
    
    // Apply density through CSS custom properties
    const densityMultipliers = {
      compact: '0.8',
      comfortable: '1',
      spacious: '1.2'
    };
    root.style.setProperty('--density-multiplier', densityMultipliers[settings.density]);
    
    // Apply density classes
    root.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    root.classList.add(`density-${settings.density}`);
    
    // Apply animations
    if (!settings.animations) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
      root.classList.add('no-animations');
    } else {
      root.style.setProperty('--animation-duration', '150ms');
      root.style.setProperty('--transition-duration', '150ms');
      root.classList.remove('no-animations');
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
      accentColor: 'purple',
      fontSize: 16,
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
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full relative group hover:bg-accent transition-colors"
        >
          <Palette size={18} className="group-hover:scale-110 transition-transform" />
          <span className="sr-only">Customize Theme</span>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="theme-header pb-4 border-b">
          <DialogTitle className="flex items-center theme-spacing text-xl">
            <div className="p-1.5 bg-primary/10 rounded-full">
              <Palette size={18} className="text-primary" />
            </div>
            Theme Customization
          </DialogTitle>
          <p className="theme-text text-muted-foreground">
            Personalize your interface appearance and behavior
          </p>
        </DialogHeader>
        
        <Tabs defaultValue="appearance" className="flex-1 overflow-hidden">
          <TabsList className="theme-tabs grid w-full grid-cols-3">
            <TabsTrigger value="appearance" className="theme-button flex items-center theme-spacing theme-text">
              <Monitor size={14} />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="typography" className="theme-button flex items-center theme-spacing theme-text">
              <Type size={14} />
              Typography
            </TabsTrigger>
            <TabsTrigger value="behavior" className="theme-button flex items-center theme-spacing theme-text">
              <Sparkles size={14} />
              Behavior
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="overflow-y-auto max-h-[60vh] theme-spacing flex flex-col mt-4">
            {/* Color Scheme */}
            <div className="theme-section">
              <Label className="theme-text font-medium flex items-center theme-spacing">
                <Monitor size={14} />
                Color Scheme
              </Label>
              <div className="grid grid-cols-3 theme-spacing">
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
                    className="theme-button flex items-center theme-spacing theme-text"
                  >
                    <option.icon size={12} />
                    {option.label}
                    {theme === option.value && <Check size={10} className="ml-auto" />}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Current: {theme === 'system' ? `System (${resolvedTheme})` : theme}
              </p>
            </div>

            {/* Accent Color */}
            <div className="theme-section">
              <Label className="theme-text font-medium flex items-center theme-spacing">
                <Palette size={14} />
                Accent Color
              </Label>
              <div className="grid grid-cols-4 theme-spacing">
                {accentColors.map(color => (
                  <Button
                    key={color.value}
                    variant={settings.accentColor === color.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSettingChange('accentColor', color.value)}
                    className="theme-button flex items-center theme-spacing theme-text"
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: color.color }}
                    />
                    {color.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Border Radius */}
            <div className="theme-section">
              <Label className="theme-text font-medium flex items-center theme-spacing">
                <div className="w-3 h-3 border border-primary rounded" />
                Border Radius
              </Label>
              <div className="px-2">
                <Slider
                  value={[settings.borderRadius]}
                  onValueChange={([value]) => handleSettingChange('borderRadius', value)}
                  max={20}
                  min={0}
                  step={2}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Sharp</span>
                  <span className="font-medium">{settings.borderRadius}px</span>
                  <span>Rounded</span>
                </div>
              </div>
            </div>

            {/* Density */}
            <div className="theme-section">
              <Label className="theme-text font-medium flex items-center theme-spacing">
                <Layers size={14} />
                Interface Density
              </Label>
              <div className="grid grid-cols-3 theme-spacing">
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
                    className="theme-button theme-text"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="typography" className="overflow-y-auto max-h-[60vh] theme-spacing flex flex-col mt-4">
            {/* Font Family */}
            <div className="theme-section">
              <Label className="theme-text font-medium flex items-center theme-spacing">
                <Type size={14} />
                Font Family
              </Label>
              <Select 
                value={settings.fontFamily} 
                onValueChange={(value) => handleSettingChange('fontFamily', value)}
              >
                <SelectTrigger className="theme-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map(font => (
                    <SelectItem key={font.value} value={font.value} className="theme-text">
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="theme-section">
              <Label className="theme-text font-medium">Font Size</Label>
              <div className="px-2">
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={([value]) => handleSettingChange('fontSize', value)}
                  max={20}
                  min={12}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Small</span>
                  <span className="font-medium">{settings.fontSize}px</span>
                  <span>Large</span>
                </div>
              </div>
            </div>

            {/* Preview Text */}
            <div className="theme-section">
              <Label className="theme-text font-medium">Preview</Label>
              <div 
                className="border rounded-lg p-3 bg-muted/30"
                style={{ 
                  fontSize: `${settings.fontSize}px`,
                  fontFamily: settings.fontFamily !== 'system' ? settings.fontFamily : undefined
                }}
              >
                <p className="font-semibold mb-2">The quick brown fox jumps over the lazy dog</p>
                <p className="text-muted-foreground" style={{ fontSize: `${Math.max(12, settings.fontSize - 2)}px` }}>
                  This preview shows how your text will appear with the selected typography settings.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="behavior" className="overflow-y-auto max-h-[60vh] theme-spacing flex flex-col mt-4">
            {/* Animations */}
            <div className="theme-section flex items-center justify-between">
              <div>
                <Label className="theme-text font-medium flex items-center theme-spacing">
                  <Sparkles size={14} />
                  Animations
                </Label>
                <p className="theme-text text-muted-foreground mt-1">
                  Enable smooth transitions and animations
                </p>
              </div>
              <Switch
                checked={settings.animations}
                onCheckedChange={(checked) => handleSettingChange('animations', checked)}
              />
            </div>

            {/* High Contrast */}
            <div className="theme-section flex items-center justify-between">
              <div>
                <Label className="theme-text font-medium flex items-center theme-spacing">
                  <Contrast size={14} />
                  High Contrast
                </Label>
                <p className="theme-text text-muted-foreground mt-1">
                  Increase contrast for better accessibility
                </p>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
              />
            </div>

            {/* Reset to Defaults */}
            <div className="theme-section border-t">
              <Button
                variant="outline"
                onClick={resetToDefaults}
                className="theme-button w-full theme-text"
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