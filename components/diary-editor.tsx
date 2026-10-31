'use client';
import {useEffect, type ReactNode} from 'react';
import {EditorContent,useEditor,useEditorState} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {Bold,Italic,Heading2,Heading3,List,ListOrdered} from 'lucide-react';
import {diaryDocument,diaryPlainText,type DiaryNode,type DiaryRichText} from '@/lib/diary-rich-text';

export function DiaryEditor({text,richText,onChange,disabled=false,label='Texto do diário',autoFocus=false}:{
  text:string;richText?:DiaryRichText;onChange:(text:string,richText:DiaryRichText)=>void;
  disabled?:boolean;label?:string;autoFocus?:boolean;
}) {
  const editor=useEditor({
    extensions:[StarterKit.configure({heading:{levels:[2,3]},blockquote:false,code:false,codeBlock:false,horizontalRule:false,strike:false,underline:false,link:false,trailingNode:false})],
    immediatelyRender:false,
    content:diaryDocument(text,richText),
    autofocus:autoFocus?'end':false,
    editorProps:{attributes:{class:'diary-prose diary-input',role:'textbox','aria-label':label,'aria-multiline':'true','data-placeholder':'Escreva do seu jeito…'}},
    onUpdate:({editor})=>{const doc=editor.getJSON() as DiaryNode;onChange(diaryPlainText(doc),{version:1,doc});},
  });
  const state=useEditorState({editor,selector:({editor:e})=>e?{
    bold:e.isActive('bold'),italic:e.isActive('italic'),h2:e.isActive('heading',{level:2}),h3:e.isActive('heading',{level:3}),bullet:e.isActive('bulletList'),ordered:e.isActive('orderedList'),empty:e.isEmpty,
  }:null});
  useEffect(()=>{editor?.setEditable(!disabled,false)},[editor,disabled]);
  useEffect(()=>{
    if(!editor)return;
    const next=diaryDocument(text,richText);
    if(JSON.stringify(editor.getJSON())!==JSON.stringify(next))editor.commands.setContent(next,{emitUpdate:false});
  },[editor,text,richText]);
  const actions=[
    {label:'Negrito',icon:Bold,active:state?.bold,run:()=>editor?.chain().focus().toggleBold().run()},
    {label:'Itálico',icon:Italic,active:state?.italic,run:()=>editor?.chain().focus().toggleItalic().run()},
    {label:'Título 2',icon:Heading2,active:state?.h2,run:()=>editor?.chain().focus().toggleHeading({level:2}).run()},
    {label:'Título 3',icon:Heading3,active:state?.h3,run:()=>editor?.chain().focus().toggleHeading({level:3}).run()},
    {label:'Lista com marcadores',icon:List,active:state?.bullet,run:()=>editor?.chain().focus().toggleBulletList().run()},
    {label:'Lista numerada',icon:ListOrdered,active:state?.ordered,run:()=>editor?.chain().focus().toggleOrderedList().run()},
  ];
  return <div className="diary-editor" data-empty={state?.empty ?? !text}>
    <div className="diary-format" role="group" aria-label="Formatação do diário">{actions.map(({label,icon:Icon,active,run})=><button key={label} type="button" title={label} aria-label={label} aria-pressed={!!active} disabled={disabled||!editor} onMouseDown={e=>e.preventDefault()} onClick={run}><Icon size={18}/></button>)}</div>
    <EditorContent editor={editor}/>
    {text.length>20000&&<p className="diary-limit" role="alert">O registro precisa ter até 20.000 caracteres.</p>}
  </div>;
}

// React escapes every text node; no HTML strings, URLs, styles or attributes from records are inserted.
function renderNode(node:DiaryNode,key:number):ReactNode {
  const children=node.content?.map(renderNode);
  switch(node.type){
    case 'text': {let text:ReactNode=node.text;for(const mark of node.marks||[])text=mark.type==='bold'?<strong>{text}</strong>:<em>{text}</em>;return <span key={key}>{text}</span>;}
    case 'hardBreak':return <br key={key}/>;
    case 'paragraph':return <p key={key}>{children?.length?children:<br/>}</p>;
    case 'heading':return node.attrs?.level===2?<h2 key={key}>{children}</h2>:<h3 key={key}>{children}</h3>;
    case 'bulletList':return <ul key={key}>{children}</ul>;
    case 'orderedList':return <ol key={key} start={node.attrs?.start||1}>{children}</ol>;
    case 'listItem':return <li key={key}>{children}</li>;
    case 'doc':return children;
  }
}
export function DiaryContent({text,richText}:{text:string;richText?:DiaryRichText}) {
  return <div className="diary-prose">{renderNode(diaryDocument(text,richText),0)}</div>;
}
