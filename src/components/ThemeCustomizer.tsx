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
  Sparkles,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/providers/ThemeProvider";

interface ThemeSettings {
  accentColor: string;
  fontSize: number;
  fontFamily: string;
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
    // Removed toast - settings apply immediately, no need for notification
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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-6 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Palette size={24} className="text-primary" />
            </div>
            Theme Customization
          </DialogTitle>
          <p className="text-muted-foreground text-base mt-2">
            Personalize your interface appearance and behavior to match your preferences
          </p>
        </DialogHeader>
        
        <Tabs defaultValue="appearance" className="flex-1 overflow-hidden mt-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="appearance" className="flex items-center gap-2 text-sm">
              <Monitor size={16} />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2 text-sm">
              <Type size={16} />
              Typography
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2 text-sm">
              <Sparkles size={16} />
              Behavior
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="overflow-y-auto max-h-[50vh] space-y-8 mt-6">
            {/* Color Scheme */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Monitor size={18} />
                Color Scheme
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'system', label: 'Auto', icon: Monitor },
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon }
                ].map(option => (
                  <Button
                    key={option.value}
                    variant={theme === option.value ? "default" : "outline"}
                    size="lg"
                    onClick={() => setTheme(option.value as any)}
                    className="flex flex-col items-center gap-2 h-20 relative"
                  >
                    <option.icon size={20} />
                    <span className="text-sm">{option.label}</span>
                    {theme === option.value && (
                      <div className="absolute top-2 right-2">
                        <Check size={14} className="text-primary" />
                      </div>
                    )}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Current: {theme === 'system' ? `System (${resolvedTheme})` : theme}
              </p>
            </div>

            {/* Accent Color */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Palette size={18} />
                Accent Color
              </Label>
              <div className="grid grid-cols-4 gap-3">
                {accentColors.map(color => (
                  <Button
                    key={color.value}
                    variant={settings.accentColor === color.value ? "default" : "outline"}
                    size="lg"
                    onClick={() => handleSettingChange('accentColor', color.value)}
                    className="flex flex-col items-center gap-2 h-16 relative"
                  >
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: color.color }}
                    />
                    <span className="text-xs">{color.name}</span>
                    {settings.accentColor === color.value && (
                      <div className="absolute top-1 right-1">
                        <Check size={12} className="text-primary" />
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </div>

          </TabsContent>
          
          <TabsContent value="typography" className="overflow-y-auto max-h-[50vh] space-y-8 mt-6">
            {/* Font Family */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Type size={18} />
                Font Family
              </Label>
              <Select 
                value={settings.fontFamily} 
                onValueChange={(value) => handleSettingChange('fontFamily', value)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map(font => (
                    <SelectItem key={font.value} value={font.value} className="text-sm">
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose a font that's comfortable for reading
              </p>
            </div>

            {/* Font Size */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Font Size</Label>
              <div className="space-y-3">
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
            <div className="space-y-4">
              <Label className="text-base font-semibold">Typography Preview</Label>
              <div 
                className="border rounded-xl p-6 bg-muted/30"
                style={{ 
                  fontSize: `${settings.fontSize}px`,
                  fontFamily: settings.fontFamily !== 'system' ? settings.fontFamily : undefined
                }}
              >
                <h3 className="font-bold mb-3">The quick brown fox jumps over the lazy dog</h3>
                <p className="text-muted-foreground leading-relaxed" style={{ fontSize: `${Math.max(12, settings.fontSize - 2)}px` }}>
                  This preview shows how your text will appear with the selected typography settings. 
                  You can see how different font sizes and families affect readability.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="behavior" className="overflow-y-auto max-h-[50vh] space-y-6 mt-6">
            {/* Animations */}
            <div className="flex items-center justify-between p-4 border rounded-xl">
              <div className="space-y-1">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Sparkles size={18} />
                  Animations
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable smooth transitions and animations throughout the interface
                </p>
              </div>
              <Switch
                checked={settings.animations}
                onCheckedChange={(checked) => handleSettingChange('animations', checked)}
                className="ml-4"
              />
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between p-4 border rounded-xl">
              <div className="space-y-1">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Contrast size={18} />
                  High Contrast
                </Label>
                <p className="text-sm text-muted-foreground">
                  Increase contrast for better accessibility and readability
                </p>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
                className="ml-4"
              />
            </div>

            {/* Reset to Defaults */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={resetToDefaults}
                className="w-full h-12 text-base"
              >
                Reset to Defaults
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                This will restore all theme settings to their default values
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}