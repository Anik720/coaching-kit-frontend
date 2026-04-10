/**
 * Normalize subjects from a batch record returned by GET /batches or /batches/class/:id.
 * Supports legacy single `subject` and new `subjects` array (ids or populated docs).
 */
export function subjectsFromBatchEntry(entry: {
  subject?: string | { _id?: string; subjectName?: string } | null;
  subjects?: Array<string | { _id?: string; subjectName?: string }> | null;
}): Array<{ _id: string; subjectName: string }> {
  const out: Array<{ _id: string; subjectName: string }> = [];
  const seen = new Set<string>();

  const add = (id: string, name: string) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push({ _id: id, subjectName: name || 'Subject' });
  };

  const raw = entry?.subject;
  if (raw) {
    if (typeof raw === 'object' && raw._id) add(String(raw._id), raw.subjectName || 'Subject');
    else if (typeof raw === 'string') add(raw, 'Subject');
  }

  const arr = entry?.subjects;
  if (Array.isArray(arr)) {
    for (const s of arr) {
      if (typeof s === 'object' && s && s._id) add(String(s._id), s.subjectName || 'Subject');
      else if (typeof s === 'string') add(s, 'Subject');
    }
  }

  return out;
}
