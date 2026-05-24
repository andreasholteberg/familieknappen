/** Enkel kalender (ingen gjentakelser i MVP). */

import { supabase } from '@/lib/supabase';
import { dateTimeToISO, toCalendarEvent } from '@/services/mappers';
import type { CalendarEvent } from '@/types/models';
import type { UpdateDto } from '@/types/database.types';

export async function listEvents(groupId: string, seniorId: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('family_group_id', groupId)
    .order('start_time', { ascending: true });
  if (error) throw error;
  return data.map((row) => toCalendarEvent(row, seniorId));
}

export interface AddEventInput {
  groupId: string;
  createdBy: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export async function addEvent(input: AddEventInput): Promise<void> {
  const { error } = await supabase.from('calendar_events').insert({
    family_group_id: input.groupId,
    created_by: input.createdBy,
    title: input.title,
    description: input.description ?? null,
    start_time: dateTimeToISO(input.date, input.time),
  });
  if (error) throw error;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
}

export async function updateEvent(id: string, patch: UpdateEventInput): Promise<void> {
  const update: UpdateDto<'calendar_events'> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.date && patch.time) update.start_time = dateTimeToISO(patch.date, patch.time);
  const { error } = await supabase.from('calendar_events').update(update).eq('id', id);
  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id);
  if (error) throw error;
}
