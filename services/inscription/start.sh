#!/bin/sh
set -e

# Script de démarrage du service Inscription
echo "=== Démarrage du service Inscription ==="

# Installer les dépendances
export COMPOSER_PROCESS_TIMEOUT=600
mkdir -p /var/www/storage /var/www/bootstrap/cache /var/www/vendor
rm -rf /var/www/vendor/* /var/www/vendor/.??* 2>/dev/null || true
composer install --no-interaction --prefer-dist --optimize-autoloader

# Générer la clé d'application si nécessaire
if [ ! -f /var/www/.env ]; then
    cp /var/www/.env.example /var/www/.env
fi

php artisan key:generate --force

# Forcer la connexion MySQL depuis les variables d'environnement Docker
sed -i "s|^DB_CONNECTION=.*|DB_CONNECTION=${DB_CONNECTION:-mysql}|" /var/www/.env
sed -i "s|^#\? *DB_HOST=.*|DB_HOST=${DB_HOST:-db}|" /var/www/.env
sed -i "s|^#\? *DB_PORT=.*|DB_PORT=${DB_PORT:-3306}|" /var/www/.env
sed -i "s|^#\? *DB_DATABASE=.*|DB_DATABASE=${DB_DATABASE:-skillhub_enrollment}|" /var/www/.env
sed -i "s|^#\? *DB_USERNAME=.*|DB_USERNAME=${DB_USERNAME:-skillhub_user}|" /var/www/.env
sed -i "s|^#\? *DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD:-skillhub_pass}|" /var/www/.env
sed -i "s|^SESSION_DRIVER=.*|SESSION_DRIVER=${SESSION_DRIVER:-file}|" /var/www/.env

# Configurer les URL inter-services dans .env : PHP-FPM/CLI n'expose pas
# toujours les variables Docker dans $_ENV selon sa configuration.
if grep -q '^AUTH_SERVICE_URL=' /var/www/.env; then
    sed -i "s|^AUTH_SERVICE_URL=.*|AUTH_SERVICE_URL=${AUTH_SERVICE_URL:-http://auth-api:8080}|" /var/www/.env
else
    echo "AUTH_SERVICE_URL=${AUTH_SERVICE_URL:-http://auth-api:8080}" >> /var/www/.env
fi
if grep -q '^CATALOG_SERVICE_URL=' /var/www/.env; then
    sed -i "s|^CATALOG_SERVICE_URL=.*|CATALOG_SERVICE_URL=${CATALOG_SERVICE_URL:-http://catalog_api:8000}|" /var/www/.env
else
    echo "CATALOG_SERVICE_URL=${CATALOG_SERVICE_URL:-http://catalog_api:8000}" >> /var/www/.env
fi

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
