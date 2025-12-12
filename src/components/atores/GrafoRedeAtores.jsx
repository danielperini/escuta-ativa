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

    // Criar nós
    const nodesData = atores.map((ator, i) => ({
      id: ator.id,
      label: ator.nome,
      tipo: ator.tipo,
      influencia: ator.nivel_influencia || 'medio',
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: 0,
      vy: 0,
      radius: getNodeRadius(ator)
    }));

    // Criar links
    const linksData = [];
    conexoes?.forEach(conn => {
      const sourceNode = nodesData.find(n => n.id === conn.ator1_id);
      const targetNode = nodesData.find(n => n.id === conn.ator2_id);
      if (sourceNode && targetNode) {
        linksData.push({
          source: sourceNode,
          target: targetNode,
          strength: conn.forca_conexao || 0.5,
          tipo: conn.tipo_relacao
        });
      }
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
      // Força de atração para centro
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      nodes.forEach(node => {
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        node.vx += (dx / distance) * 0.01;
        node.vy += (dy / distance) * 0.01;
      });

      // Força de repulsão entre nós
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const force = (100 - distance) / distance;
            nodes[i].vx -= (dx / distance) * force * 0.5;
            nodes[i].vy -= (dy / distance) * force * 0.5;
            nodes[j].vx += (dx / distance) * force * 0.5;
            nodes[j].vy += (dy / distance) * force * 0.5;
          }
        }
      }

      // Força de atração dos links
      links.forEach(link => {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = (distance - 150) * link.strength * 0.01;
        
        link.source.vx += (dx / distance) * force;
        link.source.vy += (dy / distance) * force;
        link.target.vx -= (dx / distance) * force;
        link.target.vy -= (dy / distance) * force;
      });

      // Atualizar posições
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.9; // Damping
        node.vy *= 0.9;

        // Manter dentro dos limites
        node.x = Math.max(node.radius, Math.min(canvas.width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(canvas.height - node.radius, node.y));
      });

      // Renderizar
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Desenhar links
      links.forEach(link => {
        ctx.beginPath();
        ctx.moveTo(link.source.x * zoom, link.source.y * zoom);
        ctx.lineTo(link.target.x * zoom, link.target.y * zoom);
        ctx.strokeStyle = getConnectionColor(link.tipo);
        ctx.lineWidth = link.strength * 3;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Desenhar nós
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x * zoom, node.y * zoom, node.radius * zoom, 0, Math.PI * 2);
        ctx.fillStyle = getNodeColor(node.tipo);
        ctx.fill();
        ctx.strokeStyle = node.id === selectedNode?.id ? '#2D6A4F' : '#fff';
        ctx.lineWidth = node.id === selectedNode?.id ? 4 : 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#1e293b';
        ctx.font = `${12 * zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x * zoom, (node.y + node.radius + 15) * zoom);
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
      lideranca: '#8B5CF6',
      representante: '#3B82F6',
      morador: '#10B981',
      associacao: '#F59E0B',
      ong: '#EC4899',
      governo: '#EF4444'
    };
    return colors[tipo] || '#6B7280';
  };

  const getConnectionColor = (tipo) => {
    const colors = {
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
          className="w-full h-[600px] border rounded-lg cursor-pointer bg-slate-50"
        />
        
        {/* Legenda */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="outline" className="bg-purple-100 text-purple-700">Liderança</Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-700">Representante</Badge>
          <Badge variant="outline" className="bg-emerald-100 text-emerald-700">Morador</Badge>
          <Badge variant="outline" className="bg-amber-100 text-amber-700">Associação</Badge>
          <Badge variant="outline" className="bg-pink-100 text-pink-700">ONG</Badge>
          <Badge variant="outline" className="bg-red-100 text-red-700">Governo</Badge>
        </div>

        {selectedNode && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <h4 className="font-semibold text-emerald-900">{selectedNode.label}</h4>
            <p className="text-sm text-emerald-700 capitalize">
              {selectedNode.tipo} • Influência: {selectedNode.influencia}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}