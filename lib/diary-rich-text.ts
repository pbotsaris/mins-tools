import {z} from 'zod';

export type DiaryNode = {
  type: 'doc'|'paragraph'|'heading'|'text'|'hardBreak'|'bulletList'|'orderedList'|'listItem';
  content?: DiaryNode[];
  text?: string;
  attrs?: {level?: 2|3; start?: number; type?: null};
  marks?: {type: 'bold'|'italic'}[];
};
export type DiaryRichText = {version: 1; doc: DiaryNode};

// Bound size/depth before traversing and allow only the editor's inert vocabulary.
export function isDiaryDocument(value: unknown): value is DiaryNode {
  let nodes = 0, characters = 0;
  function valid(node: any, parent: string, depth: number): boolean {
    if (!node || typeof node !== 'object' || Array.isArray(node) || depth > 16 || ++nodes > 6000) return false;
    if (Object.keys(node).some(k => !['type','content','text','attrs','marks'].includes(k))) return false;
    const allowed: Record<string,string[]> = {
      root:['doc'], doc:['paragraph','heading','bulletList','orderedList'],
      paragraph:['text','hardBreak'], heading:['text','hardBreak'],
      bulletList:['listItem'], orderedList:['listItem'],
      listItem:['paragraph','heading','bulletList','orderedList'],
    };
    if (!allowed[parent]?.includes(node.type)) return false;
    if (node.attrs !== undefined) {
      if (!node.attrs || typeof node.attrs !== 'object' || Array.isArray(node.attrs)) return false;
      const keys = Object.keys(node.attrs);
      if (node.type === 'heading') { if (keys.some(k=>k!=='level') || ![2,3].includes(node.attrs.level)) return false; }
      else if (node.type === 'orderedList') {
        if (keys.some(k=>!['start','type'].includes(k)) || (node.attrs.type !== undefined && node.attrs.type !== null) || !Number.isInteger(node.attrs.start) || node.attrs.start < 1 || node.attrs.start > 1000000) return false;
      } else return false;
    } else if (node.type === 'heading') return false;
    if (node.type === 'text') {
      if (typeof node.text !== 'string' || !node.text.length || node.content !== undefined) return false;
      characters += node.text.length;
      if (characters > 20000) return false;
    } else if (node.text !== undefined) return false;
    if (node.marks !== undefined && (node.type !== 'text' || !Array.isArray(node.marks) || node.marks.length > 2 || node.marks.some((m:any)=>!m || Object.keys(m).length!==1 || !['bold','italic'].includes(m.type)))) return false;
    if (['text','hardBreak'].includes(node.type)) return node.content === undefined;
    if (node.content !== undefined && (!Array.isArray(node.content) || !node.content.every((child:any)=>valid(child,node.type,depth+1)))) return false;
    if (['doc','bulletList','orderedList','listItem'].includes(node.type) && !node.content?.length) return false;
    if (node.type==='listItem' && node.content[0].type!=='paragraph') return false;
    return true;
  }
  return valid(value,'root',0);
}

export const diaryRichTextSchema = z.object({
  version:z.literal(1), doc:z.custom<DiaryNode>(isDiaryDocument,'Formatação inválida ou registro muito longo.'),
}).strict().refine(value=>JSON.stringify(value).length<=200000,'A formatação excede o limite do registro.');

export function diaryPlainText(node: DiaryNode): string {
  if (node.type==='text') return node.text || '';
  if (node.type==='hardBreak') return '\n';
  return (node.content || []).map(diaryPlainText).join(['paragraph','heading'].includes(node.type)?'':'\n');
}

export function plainDiaryDocument(text: string): DiaryNode {
  return {type:'doc',content:text.split('\n').map(line=>({type:'paragraph',...(line?{content:[{type:'text' as const,text:line}]}:{})}))};
}

export function diaryDocument(text: string, richText?: DiaryRichText): DiaryNode {
  const parsed=diaryRichTextSchema.safeParse(richText);
  return parsed.success ? parsed.data.doc : plainDiaryDocument(text);
}
