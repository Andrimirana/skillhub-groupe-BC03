#!/bin/sh

# Script de démarrage du service Inscription
echo "=== Démarrage du service Inscription ==="

# Installation des dépendances
export COMPOSER_PROCESS_TIMEOUT=600
composer install --no-interaction

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Générer la clé d'application si elle est vide
if ! grep -q "^APP_KEY=base64" .env; then
    php artisan key:generate --force
fi

# Attendre que la base de données soit prête puis lancer les migrations
until php artisan migrate --force; do
    echo "Base de données indisponible, nouvel essai dans 3 secondes..."
    sleep 3
done

# Nettoyer le cache de configuration
php artisan config:clear

# Tuer les anciens processus artisan serve s'ils existent
killall -9 php 2>/dev/null || true

# Attendre un peu
sleep 1

# Démarrer le serveur Laravel
echo "Démarrage du serveur Laravel sur 0.0.0.0:8000"
exec php artisan serve --host=0.0.0.0 --port=8000
