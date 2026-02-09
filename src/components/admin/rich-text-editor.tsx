'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Highlighter,
    Link as LinkIcon,
    Heading2,
    Heading3,
    Undo,
    Redo,
    Palette,
    Code,
    Quote,
    Minus,
} from 'lucide-react';
import { useEffect, useCallback } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const COLORS = [
    '#000000', '#DC2626', '#EA580C', '#CA8A04',
    '#16A34A', '#2563EB', '#7C3AED', '#DB2777',
];

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
            }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Highlight.configure({ multicolor: true }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-blue-500 underline cursor-pointer' },
            }),
            Color,
            TextStyle,
        ],
        content: value || '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm prose-invert max-w-none focus:outline-none min-h-[160px] p-4',
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            // Don't emit empty paragraph as content
            onChange(html === '<p></p>' ? '' : html);
        },
    });

    // Sync external value changes
    useEffect(() => {
        if (editor && value !== editor.getHTML() && value !== undefined) {
            editor.commands.setContent(value || '', { emitUpdate: false });
        }
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('Nhập URL:', previousUrl || 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    const ToolbarButton = ({
        onClick,
        isActive = false,
        children,
        title,
    }: {
        onClick: () => void;
        isActive?: boolean;
        children: React.ReactNode;
        title: string;
    }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded transition-colors ${isActive
                ? 'bg-brand/20 text-brand'
                : 'text-text-muted hover:bg-secondary hover:text-text-primary'
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-card-dark/50">
                {/* Undo/Redo */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    title="Undo"
                >
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    title="Redo"
                >
                    <Redo className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Text formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="In đậm (Ctrl+B)"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="In nghiêng (Ctrl+I)"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Gạch chân (Ctrl+U)"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="Gạch ngang"
                >
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    isActive={editor.isActive('highlight')}
                    title="Highlight"
                >
                    <Highlighter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive('code')}
                    title="Code"
                >
                    <Code className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Text color */}
                <div className="relative group">
                    <ToolbarButton onClick={() => { }} title="Màu chữ">
                        <Palette className="w-4 h-4" />
                    </ToolbarButton>
                    <div className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-lg shadow-xl hidden group-hover:grid grid-cols-4 gap-1 z-50 min-w-[120px]">
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => editor.chain().focus().setColor(color).run()}
                                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().unsetColor().run()}
                            className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform bg-card text-[8px] font-bold"
                            title="Reset color"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Danh sách bullet"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Danh sách số"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Trích dẫn"
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Đường kẻ ngang"
                >
                    <Minus className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Alignment */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                    title="Căn trái"
                >
                    <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                    title="Căn giữa"
                >
                    <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                    title="Căn phải"
                >
                    <AlignRight className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Link */}
                <ToolbarButton
                    onClick={setLink}
                    isActive={editor.isActive('link')}
                    title="Thêm link"
                >
                    <LinkIcon className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />

            {/* Placeholder */}
            <style jsx global>{`
        .tiptap p.is-editor-empty:first-child::before {
          color: var(--text-muted, #6b7280);
          content: '${placeholder || "Mô tả sản phẩm..."}';
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap {
          min-height: 160px;
        }
        .tiptap h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0.75rem 0 0.5rem;
        }
        .tiptap h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0.5rem 0 0.25rem;
        }
        .tiptap ul,
        .tiptap ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .tiptap ul { list-style-type: disc; }
        .tiptap ol { list-style-type: decimal; }
        .tiptap blockquote {
          border-left: 3px solid var(--border, #374151);
          padding-left: 1rem;
          margin: 0.5rem 0;
          opacity: 0.8;
        }
        .tiptap hr {
          border-color: var(--border, #374151);
          margin: 1rem 0;
        }
        .tiptap code {
          background: var(--card-dark, #1a1a2e);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-size: 0.85em;
        }
        .tiptap mark {
          background-color: #fef08a;
          color: #000;
          padding: 0.1rem 0.2rem;
          border-radius: 2px;
        }
        .tiptap a {
          color: #3b82f6;
          text-decoration: underline;
        }
      `}</style>
        </div>
    );
}
