'use client';

import { useEffect } from 'react';
import { initAudio } from '@/lib/tts';

// Loads the pre-generated Thai TTS manifest once on app start so speak()
// plays real ElevenLabs audio (falling back to the device voice if missing).
export default function AudioInit() {
  useEffect(() => { initAudio(); }, []);
  return null;
}
