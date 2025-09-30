// src/hooks/useContacts.ts
"use client";
import { useLocalStorage } from './useLocalStorage';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  createdAt: number;
}

export function useContacts() {
  const [contacts, setContacts] = useLocalStorage<Contact[]>('whatsapp-contacts', []);

  const addContact = (phone: string, name?: string) => {
    const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    const contactId = `contact-${Date.now()}`;
    
    const newContact: Contact = {
      id: contactId,
      name: name || normalizedPhone,
      phone: normalizedPhone,
      avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || normalizedPhone)}`,
      createdAt: Date.now(),
    };

    setContacts(prev => {
      // Проверяем, нет ли уже такого контакта
      const exists = prev.find(c => c.phone === normalizedPhone);
      if (exists) return prev;
      return [...prev, newContact];
    });

    return newContact;
  };

  const removeContact = (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
  };

  const updateContact = (contactId: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => 
      c.id === contactId ? { ...c, ...updates } : c
    ));
  };

  return {
    contacts,
    addContact,
    removeContact,
    updateContact,
  };
}