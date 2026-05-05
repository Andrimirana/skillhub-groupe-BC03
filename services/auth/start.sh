#!/bin/sh

# Script de démarrage du service Auth
echo "=== Démarrage du service Auth ==="

# Installation des dépendances
export COMPOSER_PROCESS_TIMEOUT=600
composer install --no-interaction

# Migration de la base de données
php artisan migrate --force

# Nettoyer le cache de configuration
php artisan config:clear

# Tuer les anciens processus artisan serve s'ils existent
killall -9 php 2>/dev/null || true

# Attendre un peu
sleep 1

# Démarrer le serveur Laravel
echo "Démarrage du serveur Laravel sur 0.0.0.0:8000"
exec php artisan serve --host=0.0.0.0 --port=8000
