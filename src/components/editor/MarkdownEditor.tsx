import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Link,
    Heading1,
    Heading2,
    Quote,
    Code,
    Eye,
    Edit3
} from "lucide-react";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
    className?: string;
}

// Simple markdown to HTML converter
const parseMarkdown = (markdown: string): string => {
    let html = markdown
        // Escape HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Headers
        .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
        // Bold and Italic
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-md my-2 overflow-x-auto"><code>$2</code></pre>')
        // Inline code
        .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
        // Blockquotes
        .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 my-2 italic text-muted-foreground">$1</blockquote>')
        // Unordered lists
        .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
        .replace(/^\* (.+)$/gm, '<li class="ml-4">$1</li>')
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
        // Links
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline hover:no-underline" target="_blank">$1</a>')
        // Horizontal rule
        .replace(/^---$/gm, '<hr class="my-4 border-border"/>')
        // Line breaks
        .replace(/\n\n/g, '</p><p class="my-2">')
        .replace(/\n/g, '<br/>');
    
    return `<div class="prose prose-sm dark:prose-invert max-w-none"><p class="my-2">${html}</p></div>`;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChange,
    placeholder = "Rédigez votre contenu en Markdown...",
    minHeight = "300px",
    className = ""
}) => {
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

    const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
        const textarea = document.querySelector('textarea[data-markdown-editor]') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end) || placeholder;
        const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);
        
        onChange(newValue);
        
        // Set cursor position after insertion
        setTimeout(() => {
            textarea.focus();
            const newPosition = start + before.length + selectedText.length + after.length;
            textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
    };

    const toolbarButtons = [
        { icon: Heading1, action: () => insertMarkdown('# ', '', 'Titre'), title: 'Titre 1' },
        { icon: Heading2, action: () => insertMarkdown('## ', '', 'Sous-titre'), title: 'Titre 2' },
        { icon: Bold, action: () => insertMarkdown('**', '**', 'texte en gras'), title: 'Gras' },
        { icon: Italic, action: () => insertMarkdown('*', '*', 'texte en italique'), title: 'Italique' },
        { icon: Quote, action: () => insertMarkdown('> ', '', 'citation'), title: 'Citation' },
        { icon: Code, action: () => insertMarkdown('`', '`', 'code'), title: 'Code' },
        { icon: List, action: () => insertMarkdown('- ', '', 'élément'), title: 'Liste' },
        { icon: ListOrdered, action: () => insertMarkdown('1. ', '', 'élément'), title: 'Liste numérotée' },
        { icon: Link, action: () => insertMarkdown('[', '](url)', 'lien'), title: 'Lien' },
    ];

    return (
        <div className={`border rounded-lg overflow-hidden ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
                <div className="flex items-center gap-1 flex-1">
                    {toolbarButtons.map((btn, idx) => (
                        <Button
                            key={idx}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={btn.action}
                            title={btn.title}
                        >
                            <btn.icon className="h-4 w-4" />
                        </Button>
                    ))}
                </div>
                <div className="flex items-center gap-1 border-l pl-2">
                    <Button
                        type="button"
                        variant={activeTab === 'edit' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => setActiveTab('edit')}
                    >
                        <Edit3 className="h-3 w-3" />
                        Éditer
                    </Button>
                    <Button
                        type="button"
                        variant={activeTab === 'preview' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => setActiveTab('preview')}
                    >
                        <Eye className="h-3 w-3" />
                        Aperçu
                    </Button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'edit' ? (
                <Textarea
                    data-markdown-editor
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="border-0 rounded-none resize-none font-mono text-sm focus-visible:ring-0"
                    style={{ minHeight }}
                />
            ) : (
                <ScrollArea style={{ height: minHeight }} className="p-4">
                    {value ? (
                        <div 
                            className="text-sm"
                            dangerouslySetInnerHTML={{ __html: parseMarkdown(value) }}
                        />
                    ) : (
                        <p className="text-muted-foreground italic">Aucun contenu à prévisualiser</p>
                    )}
                </ScrollArea>
            )}
        </div>
    );
};

export default MarkdownEditor;
