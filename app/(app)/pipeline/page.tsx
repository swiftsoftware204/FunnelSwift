'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLeadsStore } from '@/stores/leads.store';
import { Contact, Pipeline, PipelineStage, PipelineContact } from '@/types';
import { cn } from '@/lib/utils';
import { getLeadTier, getTierColor } from '@/lib/scoring/lead-score';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Plus, MoreHorizontal } from 'lucide-react';

interface KanbanCard {
  contact: Contact;
  pipelineContact: PipelineContact;
}

interface KanbanColumn {
  stage: PipelineStage;
  cards: KanbanCard[];
}

export default function PipelinePage() {
  const { pipelines, pipelineStages, leads } = useLeadsStore();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines]);

  useEffect(() => {
    async function fetchPipelineData() {
      if (!selectedPipelineId) return;

      // Get stages for this pipeline
      const stages = pipelineStages.filter(
        (stage) => stage.pipeline_id === selectedPipelineId
      );

      // Get pipeline_contacts with their contacts
      const { data: pipelineContacts } = await supabase
        .from('pipeline_contacts')
        .select('*, contacts(*)')
        .eq('pipeline_id', selectedPipelineId);

      // Group cards by stage
      const columnsData: KanbanColumn[] = stages.map((stage) => ({
        stage,
        cards: (pipelineContacts || [])
          .filter((pc: any) => pc.stage_id === stage.id)
          .map((pc: any) => ({
            contact: pc.contacts,
            pipelineContact: pc,
          })),
      }));

      setColumns(columnsData);
    }

    fetchPipelineData();
  }, [selectedPipelineId, pipelineStages, supabase]);

  const handleDragStart = (card: KanbanCard) => {
    setDraggedCard(card);
  };

  const handleDrop = async (targetStageId: string) => {
    if (!draggedCard) return;

    // Update stage in database
    await supabase
      .from('pipeline_contacts')
      .update({ stage_id: targetStageId, moved_at: new Date().toISOString() })
      .eq('id', draggedCard.pipelineContact.id);

    // Refresh columns
    setDraggedCard(null);
    setColumns((prev) => {
      const newColumns = prev.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.contact.id !== draggedCard.contact.id),
      }));

      const targetCol = newColumns.find((col) => col.stage.id === targetStageId);
      if (targetCol) {
        targetCol.cards.push(draggedCard);
      }

      return newColumns;
    });
  };

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">Pipeline</h1>
          <p className="text-[#64748B] mt-1">Drag and drop to move leads between stages</p>
        </div>

        <Select
          value={selectedPipelineId || undefined}
          onValueChange={setSelectedPipelineId}
        >
          <SelectTrigger className="w-64 bg-[#16181D] border-[#2A2D38] text-[#F1F5F9]">
            <SelectValue placeholder="Select Pipeline" />
          </SelectTrigger>
          <SelectContent className="bg-[#16181D] border-[#2A2D38]">
            {pipelines.map((pipeline) => (
              <SelectItem key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {selectedPipeline && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div
              key={column.stage.id}
              className="flex-shrink-0 w-80"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(column.stage.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#16181D] border border-[#2A2D38] rounded-t-xl">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.stage.color }}
                  />
                  <h3 className="font-medium text-[#F1F5F9]">{column.stage.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#2A2D38] text-[#94A3B8]">
                    {column.cards.length}
                  </span>
                </div>
                <button className="text-[#64748B] hover:text-[#F1F5F9]">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Column Cards */}
              <div
                className={cn(
                  'px-2 py-3 bg-[#16181D]/50 border-x border-b border-[#2A2D38] rounded-b-xl min-h-[200px]',
                  draggedCard && 'bg-[#5B4FFF]/5'
                )}
              >
                {column.cards.map((card) => (
                  <div
                    key={card.contact.id}
                    draggable
                    onDragStart={() => handleDragStart(card)}
                    className="p-3 mb-2 bg-[#2A2D38]/50 border border-[#2A2D38] rounded-lg hover:border-[#5B4FFF]/50 transition-colors cursor-move"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5B4FFF] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-medium shrink-0">
                          {card.contact.first_name?.[0] || card.contact.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#F1F5F9] truncate">
                            {card.contact.first_name} {card.contact.last_name}
                          </p>
                          <p className="text-xs text-[#64748B] truncate">
                            {card.contact.email || card.contact.phone}
                          </p>
                        </div>
                      </div>
                      <GripVertical className="h-4 w-4 text-[#64748B] shrink-0" />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: getTierColor(getLeadTier(card.contact.lead_score)),
                          color: getTierColor(getLeadTier(card.contact.lead_score)),
                        }}
                      >
                        {getLeadTier(card.contact.lead_score)}
                      </Badge>
                      {card.pipelineContact.deal_value && (
                        <span className="text-sm font-medium text-[#22C55E]">
                          ${card.pipelineContact.deal_value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {column.cards.length === 0 && (
                  <div className="text-center py-8 text-[#64748B]">
                    <p className="text-sm">No leads</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
