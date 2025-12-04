
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '../api/base44Client';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '../components/ui/UiComponents';

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        return;
    }

    setIsLoading(true);
    
    try {
      const { user, error } = await base44.auth.signup(
          formData.email, 
          formData.password,
          formData.firstName,
          formData.lastName
      );

      if (error) {
        setError(error);
      } else {
        setSuccess("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
        // Optionnel : rediriger automatiquement après un délai
        setTimeout(() => navigate('/login'), 2000);
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
          <CardTitle className="text-2xl text-center">Inscription</CardTitle>
          <p className="text-center text-sm text-gray-500">
            Rejoignez l'association
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input 
                        id="firstName" 
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input 
                        id="lastName" 
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nom@exemple.com" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input 
                id="password" 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer mot de passe</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>
            
            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 rounded-md bg-green-50 text-green-600 text-sm font-medium">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              S'inscrire
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-500">
                Déjà un compte ? {' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                    Se connecter
                </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
