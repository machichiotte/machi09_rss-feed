#!/bin/bash

# Script de pre-commit pour vérifier la complexité cyclomatique
# Installation: cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

echo "🔍 Vérification de la complexité cyclomatique..."

# Backend
echo "📦 Backend..."
cd backend
if ! yarn lint:complexity; then
    echo "❌ Backend: Complexité cyclomatique trop élevée ou erreurs de lint détectées"
    echo "💡 Astuce: Refactorisez les fonctions complexes en fonctions plus petites"
    exit 1
fi
cd ..

# Frontend
echo "🎨 Frontend..."
cd frontend
if ! yarn lint:complexity; then
    echo "❌ Frontend: Complexité cyclomatique trop élevée ou erreurs de lint détectées"
    echo "💡 Astuce: Refactorisez les fonctions complexes en fonctions plus petites"
    exit 1
fi
cd ..

echo "✅ Tous les checks de complexité sont passés!"
exit 0
