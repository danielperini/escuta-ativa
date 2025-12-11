import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GravadorAudio({ onAudioFinalizado }) {
    const [gravando, setGravando] = useState(false);
    const [pausado, setPausado] = useState(false);
    const [tempoGravacao, setTempoGravacao] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const intervaloRef = useRef(null);

    useEffect(() => {
        return () => {
            if (intervaloRef.current) clearInterval(intervaloRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const iniciarGravacao = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setGravando(true);
            setPausado(false);

            intervaloRef.current = setInterval(() => {
                setTempoGravacao(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Erro ao acessar microfone:", error);
            alert("Erro ao acessar microfone. Verifique as permissões.");
        }
    };

    const pausarGravacao = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.pause();
            setPausado(true);
            clearInterval(intervaloRef.current);
        }
    };

    const retomarGravacao = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            mediaRecorderRef.current.resume();
            setPausado(false);
            
            intervaloRef.current = setInterval(() => {
                setTempoGravacao(prev => prev + 1);
            }, 1000);
        }
    };

    const finalizarGravacao = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            setGravando(false);
            setPausado(false);
            clearInterval(intervaloRef.current);
        }
    };

    const descartarGravacao = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioBlob(null);
        setAudioUrl(null);
        setTempoGravacao(0);
        chunksRef.current = [];
    };

    const confirmarAudio = () => {
        if (audioBlob) {
            // Converter para arquivo
            const agora = new Date();
            const nomeArquivo = `audio_${agora.getFullYear()}${(agora.getMonth()+1).toString().padStart(2,'0')}${agora.getDate().toString().padStart(2,'0')}_${agora.getHours().toString().padStart(2,'0')}${agora.getMinutes().toString().padStart(2,'0')}.webm`;
            
            const file = new File([audioBlob], nomeArquivo, { 
                type: 'audio/webm',
                lastModified: Date.now()
            });

            onAudioFinalizado(file);
        }
    };

    const formatarTempo = (segundos) => {
        const mins = Math.floor(segundos / 60);
        const secs = segundos % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Gravação de Áudio
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!gravando && !audioBlob && (
                    <div className="text-center space-y-4">
                        <p className="text-sm text-gray-600">
                            Grave um áudio para documentar a conversa. A IA fará transcrição completa automaticamente.
                        </p>
                        <Button
                            onClick={iniciarGravacao}
                            size="lg"
                            className="w-full"
                            style={{ backgroundColor: '#C0392B', color: 'white' }}
                        >
                            <Mic className="w-5 h-5 mr-2" />
                            Iniciar Gravação
                        </Button>
                    </div>
                )}

                {gravando && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                                    <Mic className="w-12 h-12 text-red-600" />
                                </div>
                            </div>
                            <div className="text-center">
                                <Badge variant="destructive" className="text-lg px-4 py-2">
                                    {pausado ? "PAUSADO" : "GRAVANDO"}
                                </Badge>
                                <p className="text-3xl font-mono font-bold mt-2">
                                    {formatarTempo(tempoGravacao)}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {!pausado ? (
                                <Button
                                    onClick={pausarGravacao}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pausar
                                </Button>
                            ) : (
                                <Button
                                    onClick={retomarGravacao}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Retomar
                                </Button>
                            )}
                            <Button
                                onClick={finalizarGravacao}
                                className="flex-1"
                                style={{ backgroundColor: '#0B1E33' }}
                            >
                                <Square className="w-4 h-4 mr-2" />
                                Finalizar
                            </Button>
                        </div>
                    </div>
                )}

                {audioBlob && !gravando && (
                    <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-800 mb-2 font-semibold">
                                ✓ Gravação concluída
                            </p>
                            <p className="text-xs text-gray-600">
                                Duração: {formatarTempo(tempoGravacao)}
                            </p>
                        </div>

                        <audio controls src={audioUrl} className="w-full" />

                        <div className="flex gap-2">
                            <Button
                                onClick={descartarGravacao}
                                variant="outline"
                                className="flex-1"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Descartar
                            </Button>
                            <Button
                                onClick={confirmarAudio}
                                className="flex-1"
                                style={{ backgroundColor: '#22c55e' }}
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Usar este áudio
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}