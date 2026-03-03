'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading2, Heading3, List, ListOrdered, Quote,
  Link as LinkIcon, Undo2, Redo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useCallback } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL do link:', previousUrl);
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const tools = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), title: 'Negrito' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), title: 'Italico' },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline'), title: 'Sublinhado' },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), title: 'Tachado' },
    null,
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), title: 'Titulo H2' },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), title: 'Titulo H3' },
    null,
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), title: 'Lista' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), title: 'Lista numerada' },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote'), title: 'Citacao' },
    null,
    { icon: LinkIcon, action: setLink, active: editor.isActive('link'), title: 'Link' },
    null,
    { icon: Undo2, action: () => editor.chain().focus().undo().run(), active: false, title: 'Desfazer' },
    { icon: Redo2, action: () => editor.chain().focus().redo().run(), active: false, title: 'Refazer' },
  ];

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex flex-wrap gap-0.5 p-1.5 border-b bg-muted/40">
        {tools.map((tool, i) =>
          tool === null ? (
            <div key={i} className="w-px h-6 bg-border self-center mx-1" />
          ) : (
            <Button
              key={i}
              type="button"
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${tool.active ? 'bg-accent' : ''}`}
              onClick={tool.action}
              title={tool.title}
            >
              <tool.icon className="h-4 w-4" />
            </Button>
          )
        )}
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none min-h-[300px] p-4 focus-within:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[300px]"
      />
    </div>
  );
}
