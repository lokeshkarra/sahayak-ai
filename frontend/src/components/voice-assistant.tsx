"use client";

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { voiceQuery } from '@/ai/flows/voice-query';
import { getFinancialDataAsString } from '@/lib/mock-data';

// Define the SpeechRecognition interface for browser compatibility
interface CustomWindow extends Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

declare const window: CustomWindow;

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'te-IN'; // Changed for Telugu
        recognition.interimResults = false;

        recognition.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsListening(false);
          setIsProcessing(true);
          try {
            const response = await voiceQuery({ 
              query: transcript,
              financialData: getFinancialDataAsString(),
            });
            if (response.audio) {
              const audio = new Audio(response.audio);
              audioRef.current = audio;
              audio.play();
              audio.onended = () => setIsProcessing(false);
            } else {
               toast({
                title: 'No audio response',
                description: response.insight,
                variant: 'default',
              });
              setIsProcessing(false);
            }
          } catch (error) {
            console.error('Error processing voice query:', error);
            toast({
              title: 'Error',
              description: 'Could not process your request.',
              variant: 'destructive',
            });
            setIsProcessing(false);
          }
        };

        recognition.onerror = (event: any) => {
          // The "no-speech" error is not a critical failure. 
          // It just means the user didn't say anything, so we can ignore it.
          if (event.error === 'no-speech' || event.error === 'audiocapture') {
            setIsListening(false);
            return;
          }

          console.error('Speech recognition error:', event.error);
          toast({
            title: 'Recognition Error',
            description: `An error occurred: ${event.error}`,
            variant: 'destructive',
          });
          setIsListening(false);
          setIsProcessing(false);
        };
        
        recognition.onend = () => {
          if (isListening) {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      } else {
        toast({
          title: 'Unsupported Browser',
          description: 'Speech recognition is not supported in your browser.',
          variant: 'destructive',
        });
      }
    }
  }, [toast, isListening]);

  const handleToggleListening = () => {
    if (isProcessing) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };
  
  const getIcon = () => {
    if (isProcessing) return <Loader className="animate-spin" />;
    if (isListening) return <MicOff />;
    return <Mic />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleListening}
      className="text-chart-5 hover:bg-chart-5 hover:text-primary-foreground disabled:opacity-75"
      aria-label="Toggle voice assistant"
      disabled={!recognitionRef.current}
    >
      {getIcon()}
    </Button>
  );
}
