# Utiliser l'image officielle PHP avec FPM
FROM php:8.4-cli

# Installer les dépendances système (incluant celles requises pour compiler l'extension mongodb)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libssl-dev \
    pkg-config \
    autoconf \
    gcc \
    make \
    zip \
    unzip

# Nettoyer le cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Installer les extensions PHP nécessaires pour Laravel
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Installer l'extension MongoDB via PECL
RUN pecl install mongodb && docker-php-ext-enable mongodb

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Définir le dossier de travail
WORKDIR /var/www

# Copier le code existant dans le conteneur
COPY . /var/www

# Installer les dépendances composer (notamment mongodb/mongodb)
RUN composer install --no-interaction --no-dev --optimize-autoloader || true

# Donner les droits d'écriture sur les dossiers de Laravel
RUN mkdir -p /var/www/storage /var/www/bootstrap/cache && chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
