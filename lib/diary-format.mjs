export function formatDiarySelection(text,start,end,style){
 const selected=text.slice(start,end);
 let replacement,selectionStart,selectionEnd;
 if(style==='bold'||style==='italic'){
  const mark=style==='bold'?'**':'*',body=selected||'texto';
  replacement=mark+body+mark;selectionStart=start+mark.length;selectionEnd=selectionStart+body.length;
 }else{
  const lineStart=start===0?0:text.lastIndexOf('\n',start-1)+1;
  const next=text.indexOf('\n',end);const lineEnd=next===-1?text.length:next;
  const lines=text.slice(lineStart,lineEnd).split('\n');
  replacement=lines.map((line,i)=>{
   const clean=line.replace(/^(?:#{1,6}\s+|[-*]\s+|\d+\.\s+|>\s?)/,'');
   return (style==='heading'?'## ':style==='bullet'?'- ':style==='numbered'?`${i+1}. `:'> ')+(clean||'texto');
  }).join('\n');start=lineStart;end=lineEnd;selectionStart=start;selectionEnd=start+replacement.length;
 }
 return {text:text.slice(0,start)+replacement+text.slice(end),selectionStart,selectionEnd};
}
