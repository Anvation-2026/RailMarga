import * as Speech from 'expo-speech';

class VoiceService {
  private isEnabled: boolean = true;
  private currentLanguage: string = 'en-US';

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      Speech.stop();
    }
  }

  public get enabled(): boolean {
    return this.isEnabled;
  }

  public setLanguage(lang: string) {
    this.currentLanguage = lang;
  }

  public async speak(text: string, options?: { pitch?: number; rate?: number; onDone?: () => void }) {
    if (!this.isEnabled || !text) return;
    try {
      await Speech.stop();
      Speech.speak(text, {
        language: this.currentLanguage,
        pitch: options?.pitch ?? 1.0,
        rate: options?.rate ?? 0.92,
        onDone: options?.onDone
      });
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }

  public async stop() {
    try {
      await Speech.stop();
    } catch {}
  }
}

export const voiceService = new VoiceService();
