
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Paperclip, MessageSquare } from 'lucide-react';
import { base44 } from '../api/base44Client';
import { Card, CardContent, Button, Input } from '../components/ui/UiComponents';

export const Community: React.FC = () => {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const user = base44.auth.me();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: base44.entities.CommunityMessage.list,
    initialData: []
  });

  const postMutation = useMutation({
    mutationFn: (content: string) => base44.entities.CommunityMessage.create({
      content,
      authorId: user?.id || '0',
      date: new Date().toISOString()
    }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    postMutation.mutate(newMessage);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Espace Communauté</h1>
        <p className="text-gray-500">Discutez avec les autres membres de l'association</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handlePost} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Partagez quelque chose avec la communauté..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full bg-gray-50 border-0 focus:ring-0 px-0 text-base"
              />
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <Button type="button" variant="ghost" size="sm" className="text-gray-500">
                  <Paperclip size={18} className="mr-2" /> Joindre un fichier
                </Button>
                <Button type="submit" disabled={!newMessage.trim() || postMutation.isPending}>
                  <Send size={16} className="mr-2" /> Publier
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-center py-4">Chargement...</p>
        ) : (
          messages.slice().reverse().map((msg) => (
            <Card key={msg.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold shrink-0">
                    {msg.authorName.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-semibold text-gray-900">{msg.authorName}</h3>
                      <span className="text-xs text-gray-500">{new Date(msg.date).toLocaleDateString('fr-FR')} {new Date(msg.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{msg.content}</p>
                    <div className="flex items-center gap-4 pt-2">
                      <button className="text-xs text-gray-500 hover:text-primary flex items-center gap-1">
                        <MessageSquare size={14} /> Répondre
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
