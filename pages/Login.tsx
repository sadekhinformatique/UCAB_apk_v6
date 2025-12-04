
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '../api/base44Client';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '../components/ui/UiComponents';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { user, error } = await base44.auth.login(email, password);
      if (error) {
        setError(error);
      } else if (user) {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              SAS
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Connexion</CardTitle>
          <p className="text-center text-sm text-gray-500">
            Accédez à l'espace de gestion financière
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nom@exemple.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Se connecter
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
             <p>
                Pas encore de compte ? {' '}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                    S'inscrire
                </Link>
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
