/**
 * Composant Combobox avec autocomplétion
 * Pour la sélection intelligente dans les formulaires
 */

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export interface ComboboxOption {
    value: string;
    label: string;
    category?: string;
    description?: string;
    icon?: React.ReactNode;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    allowCustom?: boolean;
    disabled?: boolean;
    className?: string;
    groupByCategory?: boolean;
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = 'Sélectionner...',
    searchPlaceholder = 'Rechercher...',
    emptyMessage = 'Aucun résultat.',
    allowCustom = true,
    disabled = false,
    className,
    groupByCategory = false,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');

    const selectedOption = options.find(opt => opt.value === value);

    // Grouper les options par catégorie si nécessaire
    const groupedOptions = React.useMemo(() => {
        if (!groupByCategory) return { '': options };

        return options.reduce((acc, option) => {
            const category = option.category || 'Autres';
            if (!acc[category]) acc[category] = [];
            acc[category].push(option);
            return acc;
        }, {} as Record<string, ComboboxOption[]>);
    }, [options, groupByCategory]);

    const handleSelect = (selectedValue: string) => {
        onValueChange(selectedValue === value ? '' : selectedValue);
        setOpen(false);
        setInputValue('');
    };

    const handleInputChange = (val: string) => {
        setInputValue(val);
        if (allowCustom) {
            onValueChange(val);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedOption?.label || value || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={inputValue}
                        onValueChange={handleInputChange}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {allowCustom && inputValue ? (
                                <div className="py-3 text-center">
                                    <p className="text-sm text-muted-foreground mb-2">{emptyMessage}</p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            onValueChange(inputValue);
                                            setOpen(false);
                                        }}
                                    >
                                        Utiliser "{inputValue}"
                                    </Button>
                                </div>
                            ) : (
                                <p className="py-6 text-center text-sm">{emptyMessage}</p>
                            )}
                        </CommandEmpty>

                        {Object.entries(groupedOptions).map(([category, categoryOptions]) => (
                            <CommandGroup key={category} heading={category || undefined}>
                                {categoryOptions.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => handleSelect(option.value)}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {option.icon}
                                                <span className="truncate">{option.label}</span>
                                            </div>
                                            {option.description && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {option.description}
                                                </p>
                                            )}
                                        </div>
                                        {option.category && !groupByCategory && (
                                            <Badge variant="secondary" className="ml-2 text-[10px]">
                                                {option.category}
                                            </Badge>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// Version avec sélection en cascade (organisation → contacts)
interface CascadeComboboxProps {
    organizations: ComboboxOption[];
    getContacts: (orgId: string) => ComboboxOption[];
    selectedOrg?: string;
    selectedContact?: string;
    onOrgChange: (value: string) => void;
    onContactChange: (value: string) => void;
    orgPlaceholder?: string;
    contactPlaceholder?: string;
    disabled?: boolean;
    className?: string;
}

export function CascadeCombobox({
    organizations,
    getContacts,
    selectedOrg,
    selectedContact,
    onOrgChange,
    onContactChange,
    orgPlaceholder = 'Organisation...',
    contactPlaceholder = 'Contact...',
    disabled = false,
    className,
}: CascadeComboboxProps) {
    const contacts = React.useMemo(() => {
        if (!selectedOrg) return [];
        return getContacts(selectedOrg);
    }, [selectedOrg, getContacts]);

    const handleOrgChange = (value: string) => {
        onOrgChange(value);
        // Reset contact when org changes
        onContactChange('');
    };

    return (
        <div className={cn("grid grid-cols-2 gap-4", className)}>
            <div>
                <Combobox
                    options={organizations}
                    value={selectedOrg}
                    onValueChange={handleOrgChange}
                    placeholder={orgPlaceholder}
                    searchPlaceholder="Rechercher une organisation..."
                    groupByCategory
                    disabled={disabled}
                />
            </div>
            <div>
                <Combobox
                    options={contacts}
                    value={selectedContact}
                    onValueChange={onContactChange}
                    placeholder={contacts.length > 0 ? contactPlaceholder : 'Sélectionner d\'abord une organisation'}
                    searchPlaceholder="Rechercher un contact..."
                    disabled={disabled || contacts.length === 0}
                    allowCustom
                />
            </div>
        </div>
    );
}
