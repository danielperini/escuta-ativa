import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export default function GrafoRedeAtores({ atores, conexoes, onNodeClick }) {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!atores || atores.length === 0) return;

    const canvas = canvasRef.current;
    const width = canvas?.offsetWidth || 1200;
    const height = canvas?.offsetHeight || 800;

    // Criar nós com posicionamento circular inicial
    const nodesData = atores.map((ator, i) => {
      const angle = (i / atores.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.35;
      return {
        id: ator.id,
        label: ator.nome,
        tipo: ator.tipo,
        subtipo: ator.subtipo,
        influencia: ator.nivel_influencia || 'medio',
        comunidade: ator.comunidade,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: getNodeRadius(ator),
        ator: ator
      };
    });

    // Criar links baseados em registros compartilhados
    const linksData = [];
    const conexoesMap = new Map();

    // Detectar conexões através de registros
    atores.forEach((ator1, i) => {
      atores.forEach((ator2, j) => {
        if (i >= j) return;
        
        const registrosComum = (ator1.registros_vinculados || []).filter(r => 
          (ator2.registros_vinculados || []).includes(r)
        );
        
        const comunidadeComum = ator1.comunidade === ator2.comunidade;
        const casosComum = (ator1.casos_vinculados || []).filter(c =>
          (ator2.casos_vinculados || []).includes(c)
        );

        if (registrosComum.length > 0 || casosComum.length > 0) {
          const strength = Math.min(1, (registrosComum.length + casosComum.length * 2) / 10);
          const sourceNode = nodesData.find(n => n.id === ator1.id);
          const targetNode = nodesData.find(n => n.id === ator2.id);
          
          if (sourceNode && targetNode) {
            linksData.push({
              source: sourceNode,
              target: targetNode,
              strength: strength,
              tipo: casosComum.length > 0 ? 'caso' : comunidadeComum ? 'comunidade' : 'registro',
              count: registrosComum.length + casosComum.length
            });
          }
        }
      });
    });

    setNodes(nodesData);
    setLinks(linksData);
  }, [atores, conexoes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const simulate = () => {
      // Força de atração suave para centro
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      nodes.forEach(node => {
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          node.vx += (dx / distance) * 0.005;
          node.vy += (dy / distance) * 0.005;
        }
      });

      // Força de repulsão forte entre nós (mais espaçamento)
      const minDistance = 180;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minDistance) {
            const force = ((minDistance - distance) / distance) * 0.8;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }
      }

      // Força de atração dos links (mais suave)
      links.forEach(link => {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const targetDistance = 220;
        const force = (distance - targetDistance) * link.strength * 0.015;
        
        if (distance > 0) {
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          link.source.vx += fx;
          link.source.vy += fy;
          link.target.vx -= fx;
          link.target.vy -= fy;
        }
      });

      // Atualizar posições
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.85; // Damping suave
        node.vy *= 0.85;

        // Manter dentro dos limites com margem
        const margin = 100;
        node.x = Math.max(margin, Math.min(canvas.width - margin, node.x));
        node.y = Math.max(margin, Math.min(canvas.height - margin, node.y));
      });

      // Renderizar
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Desenhar links
      links.forEach(link => {
        ctx.beginPath();
        ctx.moveTo(link.source.x * zoom, link.source.y * zoom);
        ctx.lineTo(link.target.x * zoom, link.target.y * zoom);
        ctx.strokeStyle = getConnectionColor(link.tipo);
        ctx.lineWidth = Math.max(1, link.strength * 4) * zoom;
        ctx.globalAlpha = 0.4 + (link.strength * 0.3);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Desenhar nós
      nodes.forEach(node => {
        // Círculo principal
        ctx.beginPath();
        ctx.arc(node.x * zoom, node.y * zoom, node.radius * zoom, 0, Math.PI * 2);
        ctx.fillStyle = getNodeColor(node.subtipo || node.tipo);
        ctx.fill();
        ctx.strokeStyle = node.id === selectedNode?.id ? '#2D6A4F' : '#fff';
        ctx.lineWidth = (node.id === selectedNode?.id ? 4 : 3) * zoom;
        ctx.stroke();

        // Ícone
        ctx.fillStyle = '#fff';
        ctx.font = `${18 * zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.tipo === 'pessoa' ? '👤' : '🏢', node.x * zoom, node.y * zoom);

        // Label com fundo
        const labelY = (node.y + node.radius + 20) * zoom;
        ctx.font = `bold ${13 * zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Fundo do label
        const textWidth = ctx.measureText(node.label).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(
          (node.x * zoom) - (textWidth / 2) - 6,
          labelY - 3,
          textWidth + 12,
          16 * zoom + 6
        );
        
        // Texto do label
        ctx.fillStyle = '#1e293b';
        ctx.fillText(node.label, node.x * zoom, labelY);
        
        // Subtipo
        if (node.subtipo) {
          ctx.font = `${10 * zoom}px sans-serif`;
          ctx.fillStyle = '#64748b';
          ctx.fillText(
            node.subtipo.charAt(0).toUpperCase() + node.subtipo.slice(1),
            node.x * zoom,
            labelY + (16 * zoom)
          );
        }
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, links, zoom, selectedNode]);

  const getNodeRadius = (ator) => {
    const baseRadius = 20;
    const influenciaMultiplier = 
      ator.nivel_influencia === 'alto' ? 1.5 :
      ator.nivel_influencia === 'medio' ? 1.2 : 1;
    const interacoesMultiplier = 1 + ((ator.historico_interacoes || 0) / 50);
    return baseRadius * influenciaMultiplier * Math.min(interacoesMultiplier, 1.5);
  };

  const getNodeColor = (tipo) => {
    const colors = {
      // Subtipos
      lideranca: '#8B5CF6',
      representante: '#3B82F6',
      morador: '#10B981',
      associacao: '#F59E0B',
      ong: '#EC4899',
      governo: '#EF4444',
      outro: '#64748B',
      // Tipos base
      pessoa: '#3B82F6',
      entidade: '#8B5CF6'
    };
    return colors[tipo] || '#6B7280';
  };

  const getConnectionColor = (tipo) => {
    const colors = {
      caso: '#EF4444',
      comunidade: '#10B981',
      registro: '#3B82F6',
      colaboracao: '#10B981',
      conflito: '#EF4444',
      familia: '#F59E0B',
      profissional: '#3B82F6'
    };
    return colors[tipo] || '#94A3B8';
  };

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      if (onNodeClick) {
        const ator = atores.find(a => a.id === clickedNode.id);
        onNodeClick(ator);
      }
    }
  };

  if (!atores || atores.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Network className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Nenhum ator cadastrado ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Mapa de Rede - {atores.length} Atore(s)
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(1)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-[700px] border rounded-lg cursor-pointer bg-gradient-to-br from-slate-50 to-slate-100"
        />
        
        {/* Legenda */}
        <div className="space-y-3 mt-4">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Tipos de Stakeholders</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-purple-100 text-purple-700">👤 Liderança</Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">👤 Representante</Badge>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700">👤 Morador</Badge>
              <Badge variant="outline" className="bg-amber-100 text-amber-700">🏢 Associação</Badge>
              <Badge variant="outline" className="bg-pink-100 text-pink-700">🏢 ONG</Badge>
              <Badge variant="outline" className="bg-red-100 text-red-700">🏢 Governo</Badge>
              <Badge variant="outline" className="bg-slate-100 text-slate-700">Outro</Badge>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Conexões</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-red-50 text-red-700">━ Caso Comum</Badge>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700">━ Mesma Comunidade</Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">━ Registro Compartilhado</Badge>
            </div>
          </div>
        </div>

        {selectedNode && (
          <div className="mt-4 p-4 bg-[#40916C]/10 border-2 border-[#40916C] rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl">{selectedNode.tipo === 'pessoa' ? '👤' : '🏢'}</div>
              <div>
                <h4 className="font-semibold text-slate-900">{selectedNode.label}</h4>
                <p className="text-xs text-slate-500 capitalize">
                  {selectedNode.subtipo || selectedNode.tipo} • {selectedNode.comunidade}
                </p>
              </div>
            </div>
            {selectedNode.ator && (
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                <span>Interações: {selectedNode.ator.historico_interacoes || 0}</span>
                {selectedNode.ator.casos_vinculados?.length > 0 && (
                  <span>• Casos: {selectedNode.ator.casos_vinculados.length}</span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}