'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLeadsStore } from '@/stores/leads.store';
import { Contact, Tag, Pipeline, PipelineStage } from '@/types';

export function useLeads() {
  const supabase = createClient();
  const { leads, setLeads, setTags, setPipelines, setPipelineStages, setIsLoading } = useLeadsStore();

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, contact_tags(tags(id, name, color))')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchPipelines = async () => {
    try {
      const { data: pipelines, error: pipeError } = await supabase
        .from('pipelines')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (pipeError) throw pipeError;
      setPipelines(pipelines || []);

      const { data: stages, error: stageError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('sort_order');
      if (stageError) throw stageError;
      setPipelineStages(stages || []);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    }
  };

  const createLead = async (lead: Partial<Contact>) => {
    const { data, error } = await supabase
      .from('contacts')
      .insert(lead)
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const updateLead = async (id: string, updates: Partial<Contact>) => {
    const { data, error } = await supabase
      .from('contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) throw error;
  };

  useEffect(() => {
    fetchLeads();
    fetchTags();
    fetchPipelines();
  }, []);

  return {
    leads,
    fetchLeads,
    fetchTags,
    fetchPipelines,
    createLead,
    updateLead,
    deleteLead,
  };
}
