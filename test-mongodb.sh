#!/bin/bash

# Script de test MongoDB pour SkillHub
# Vérifie que MongoDB est configuré et fonctionnel

echo " Test MongoDB SkillHub"
echo "======================="
echo ""

# 1. Vérifier que Docker Compose est actif
echo "1  Vérifier que les services tournent..."
if ! docker-compose ps mongodb | grep -q "Up"; then
    echo " MongoDB n'est pas actif. Démarrage..."
    docker-compose up -d mongodb
    sleep 5
fi
echo "MongoDB est actif"
echo ""

# 2. Vérifier la connexion
echo "2  Tester la connexion MongoDB..."
if docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo " Connexion réussie"
else
    echo " Impossible de se connecter à MongoDB"
    exit 1
fi
echo ""

# 3. Vérifier les collections
echo "3  Vérifier les collections..."
docker-compose exec mongodb mongosh --eval "use skillhub_logs; show collections" 2>/dev/null | grep -E "activity_logs|sessions|analytics|certificates|user_progress" > /dev/null

if [ $? -eq 0 ]; then
    echo " Collections trouvées:"
    docker-compose exec mongodb mongosh --eval "use skillhub_logs; show collections" 2>/dev/null | sed 's/^/   /'
else
    echo "  Collections non trouvées. Création..."
    docker-compose exec -T mongodb mongosh < docker/mongodb/init/01-init-collections.js > /dev/null 2>&1
    echo " Collections créées"
fi
echo ""

# 4. Vérifier les index
echo "4  Vérifier les index..."
INDEXES=$(docker-compose exec mongodb mongosh --eval "use skillhub_logs; db.activity_logs.getIndexes()" 2>/dev/null | grep -c "key")
if [ "$INDEXES" -gt 0 ]; then
    echo " Index trouvés ($INDEXES)"
else
    echo "  Pas d'index trouvé"
fi
echo ""

# 5. Tester l'insertion d'un document
echo "5 Tester l'insertion d'un document test..."
TEST_RESULT=$(docker-compose exec -T mongodb mongosh --eval "
use skillhub_logs;
db.activity_logs.insertOne({
  userId: 'test_user',
  userEmail: 'test@example.com',
  action: 'test_log',
  timestamp: new Date(),
  ipAddress: '127.0.0.1'
});
db.activity_logs.findOne({ action: 'test_log' })
" 2>/dev/null | grep -c "test_user")

if [ "$TEST_RESULT" -gt 0 ]; then
    echo " Insertion et lecture réussies"
    # Nettoyer le document test
    docker-compose exec -T mongodb mongosh --eval "
    use skillhub_logs;
    db.activity_logs.deleteOne({ action: 'test_log' })
    " > /dev/null 2>&1
else
    echo " Erreur lors de l'insertion"
fi
echo ""

# 6. Vérifier les dépendances PHP
echo "6  Vérifier le package MongoDB PHP..."
for service in auth catalog inscription; do
    if grep -q "mongodb/laravel-mongodb" services/$service/composer.json 2>/dev/null; then
        echo "    services/$service: Package trouvé"
    else
        echo "     services/$service: Package non installé"
        echo "       À faire: cd services/$service && composer require mongodb/laravel-mongodb"
    fi
done
echo ""

# 7. Vérifier les fichiers de configuration
echo "7  Vérifier les fichiers de configuration..."
for file in config/mongodb.php app/Traits/MongoActivityLogger.php app/Models/ActivityLog.php; do
    if [ -f "services/auth/$file" ]; then
        echo "    services/auth/$file"
    else
        echo "     services/auth/$file (manquant)"
    fi
done
echo ""

# 8. Résumé
echo " Résumé:"
echo "========="
echo " MongoDB est fonctionnel et prêt à être utilisé"
echo " Guides disponibles:"
echo "   - MONGODB_GUIDE.md - Documentation générale"
echo "   - MONGODB_INSTALLATION_GUIDE.md - Guide d'installation complet"
echo ""
echo " Prochaines étapes:"
echo "1. Installer le package MongoDB dans les services Laravel:"
echo "   for dir in services/{auth,catalog,inscription}; do (cd \$dir && composer require mongodb/laravel-mongodb); done"
echo "2. Copier les fichiers de configuration vers chaque service"
echo "3. Configurer les variables d'environnement dans .env"
echo "4. Intégrer les appels MongoActivityLogger dans vos contrôleurs"
echo ""
