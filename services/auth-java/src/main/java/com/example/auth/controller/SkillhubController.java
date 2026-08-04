package com.example.auth.controller;

import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.LoginResponse;
import com.example.auth.dto.SkillhubAuthResponse;
import com.example.auth.dto.SkillhubRegisterRequest;
import com.example.auth.dto.UtilisateurInfo;
import com.example.auth.entity.AccessToken;
import com.example.auth.entity.User;
import com.example.auth.repository.UserRepository;
import com.example.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Contr�leur REST exposant les endpoints compatibles avec le frontend Skillhub.
 *
 * <p>Ces endpoints coexistent avec les endpoints originaux d'Auth_TP1 ({@code /api/auth/*}).
 * Le protocole de connexion HMAC-SHA256 d'Auth_TP1 est conserv� int�gralement.</p>
 *
 * <p>Endpoints expos�s :</p>
 * <ul>
 *   <li>{@code POST /api/register}        � Inscription avec nom et r�le, retourne un token</li>
 *   <li>{@code POST /api/login}           � Connexion HMAC-SHA256, retourne un token</li>
 *   <li>{@code GET  /api/profil}          � Profil de l'utilisateur connect�</li>
 *   <li>{@code POST /api/logout}          � D�connexion (invalidation du token en base)</li>
 *   <li>{@code PUT  /api/change-password} � Changement de mot de passe</li>
 *   <li>{@code POST /api/validate-token}  � Validation interne pour catalog et inscription</li>
 *   <li>{@code GET  /api/health}          � Endpoint de sant� du service</li>
 * </ul>
 *
 * @author  �quipe SkillHub BC04
 * @version 1.0
 */
// @RestController : marque la classe comme contr�leur REST (r�ponses s�rialis�es en JSON).
@RestController
// @RequestMapping : pr�fixe d'URL commun � tous les endpoints de la classe.
@RequestMapping("/api")
public class SkillhubController {

    private final AuthService authService;
    private final UserRepository userRepository;

    /**
     * Constructeur � injection de d�pendance par Spring (constructor injection).
     *
     * @param authService    service m�tier d'authentification
     * @param userRepository acc�s JPA aux utilisateurs (utilis� par /api/users)
     */
    public SkillhubController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    // --------------------------------------------------------------------
    //  INSCRIPTION
    // --------------------------------------------------------------------

    /**
     * Inscrit un utilisateur et retourne un JWT Bearer valide.
     * Accepte {nom, email, password, passwordConfirm, role}.
     *
     * @param req corps JSON contenant {nom, email, password, passwordConfirm, role}
     * @return HTTP 201 Created avec {token, tokenType, expiresAt, utilisateur}
     * @throws com.example.auth.exception.InvalidInputException     si l'email ou le mot de passe est invalide
     * @throws com.example.auth.exception.ResourceConflictException si l'email existe d�j�
     */
    // @PostMapping : POST /api/register � cr�ation d'une nouvelle ressource utilisateur.
    @PostMapping("/register")
    public ResponseEntity<SkillhubAuthResponse> register(
            @RequestBody SkillhubRegisterRequest req) {
        // On cr�e le nouvel utilisateur avec son nom et son r�le.
        AccessToken token = authService.registerSkillhubUser(
                req.email(), req.password(), req.passwordConfirm(),
                req.nom(), req.role());
        // On g�n�re un JWT sign� pour le client.
        String jwt = authService.generateJwt(token.getUser());
        // On convertit la date d'expiration en timestamp Unix.
        long expiresAt = token.getExpiresAt().toEpochSecond(ZoneOffset.UTC);
        // On renvoie un 201 Created avec le token et les infos utilisateur.
        return ResponseEntity.status(201).body(
            new SkillhubAuthResponse(jwt, "Bearer", expiresAt, toUtilisateurInfo(token.getUser()))
        );
    }

    // --------------------------------------------------------------------
    //  CONNEXION � protocole HMAC-SHA256 d'Auth_TP1
    // --------------------------------------------------------------------

    /**
     * Authentifie via HMAC-SHA256 et retourne un JWT Bearer valide.
     * Le frontend envoie {email, nonce, timestamp, hmac} o�
     * hmac = HMAC_SHA256(cl�=mot_de_passe, data="email:nonce:timestamp") en Base64.
     *
     * @param req corps JSON contenant {email, nonce, timestamp, hmac}
     * @return HTTP 200 avec {token JWT, tokenType, expiresAt, utilisateur}
     * @throws com.example.auth.exception.AuthenticationFailedException si HMAC, nonce, timestamp ou compte invalides
     * @throws com.example.auth.exception.InvalidInputException         si l'email est vide
     */
    // @PostMapping : POST /api/login (POST = ne pas exposer les credentials dans l'URL).
    @PostMapping("/login")
    public ResponseEntity<SkillhubAuthResponse> login(
            @RequestBody LoginRequest req) {
        // Le service Auth v�rifie le HMAC et �met un token UUID + un JWT.
        LoginResponse loginResponse = authService.login(req);
        // On retrouve l'utilisateur pour enrichir la r�ponse.
        User user = authService.getUserByToken(loginResponse.accessToken());
        // On formate la date d'expiration en epoch Unix.
        long expiresAt = loginResponse.expiresAt().toEpochSecond(ZoneOffset.UTC);
        // On renvoie le JWT et les infos utilisateur au format Skillhub.
        return ResponseEntity.ok(new SkillhubAuthResponse(
            loginResponse.jwt(), "Bearer", expiresAt, toUtilisateurInfo(user)
        ));
    }

    // --------------------------------------------------------------------
    //  PROFIL
    // --------------------------------------------------------------------

    /**
     * Retourne les informations de l'utilisateur authentifi�.
     * Accepte un JWT (frontend Skillhub) ou un UUID (endpoints legacy /api/auth/*).
     *
     * @param authHeader header HTTP {@code Authorization: Bearer <token>}
     * @return HTTP 200 avec les claims utilisateur, ou HTTP 401 si token invalide
     */
    // @GetMapping : GET /api/profil � lecture du profil sans modification d'�tat.
    @GetMapping({"/profil", "/profile"})
    public ResponseEntity<Map<String, Object>> profil(
            @RequestHeader("Authorization") String authHeader) {
        // On lit le token Bearer envoy� par le client.
        try {
            return ResponseEntity.ok(toUserMap(authenticatedUser(authHeader)));
        } catch (Exception e) {
            // Token invalide ou expiré : on retourne 401.
            return ResponseEntity.status(401).body(Map.of("message", "Non autorisé."));
        }
    }

    /**
     * Met à jour le profil de l'utilisateur connecté dans la base Auth.
     * Le rôle n'est volontairement pas modifiable depuis le profil.
     */
    @PutMapping({"/profil", "/profile"})
    public ResponseEntity<?> updateProfil(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        try {
            User user = authenticatedUser(authHeader);

            String nouveauNom = body.getOrDefault("nom", "").trim();
            String nouvelEmail = body.getOrDefault("email", "").trim();
            String avatarUrl = body.getOrDefault("avatarUrl", body.getOrDefault("avatar_url", "")).trim();

            if (nouveauNom.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Le nom est obligatoire."));
            }

            if (nouvelEmail.isBlank() || !nouvelEmail.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email invalide."));
            }

            User utilisateurEmail = userRepository.findByEmail(nouvelEmail).orElse(null);
            if (utilisateurEmail != null && !utilisateurEmail.getId().equals(user.getId())) {
                return ResponseEntity.status(409).body(Map.of("message", "Cet email est déjà utilisé."));
            }

            user.setName(nouveauNom);
            user.setEmail(nouvelEmail);
            user.setAvatarUrl(avatarUrl.isBlank() ? null : avatarUrl);
            User utilisateurMisAJour = userRepository.save(user);
            String jwt = authService.generateJwt(utilisateurMisAJour);

            return ResponseEntity.ok(Map.of(
                    "token", jwt,
                    "tokenType", "Bearer",
                    "utilisateur", toUtilisateurInfo(utilisateurMisAJour)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Non autorisé."));
        }
    }

    // --------------------------------------------------------------------
    //  D�CONNEXION
    // --------------------------------------------------------------------

    /**
     * D�connecte l'utilisateur. Pour les UUID : suppression en base.
     * Pour les JWT (stateless) : retourne 200 � le token expire automatiquement.
     *
     * @param authHeader header HTTP {@code Authorization: Bearer <token>}
     * @return HTTP 200 avec un message de confirmation
     */
    // @PostMapping : POST /api/logout � action qui modifie l'�tat serveur (suppression du token).
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader("Authorization") String authHeader) {
        // On supprime le token de la base (cas UUID) ou on laisse expirer (cas JWT).
        authService.logout(extractToken(authHeader));
        return ResponseEntity.ok(Map.of("message", "Déconnexion effectuée."));
    }

    // --------------------------------------------------------------------
    //  CHANGEMENT DE MOT DE PASSE
    // --------------------------------------------------------------------

    /**
     * Alias de PUT /api/auth/change-password accessible depuis le frontend Skillhub.
     *
     * <p>V�rifie le token, contr�le l'ancien mot de passe (d�chiffrement AES-GCM),
     * applique la politique de s�curit�, puis chiffre et persiste le nouveau mot de passe.</p>
     *
     * @param authHeader header HTTP {@code Authorization: Bearer <token>}
     * @param req        corps JSON contenant {oldPassword, newPassword, confirmPassword}
     * @return HTTP 200 avec un message de confirmation
     * @throws com.example.auth.exception.AuthenticationFailedException si le token ou l'ancien mot de passe est invalide
     * @throws com.example.auth.exception.InvalidInputException         si le nouveau mot de passe ne respecte pas la politique
     */
    // @PutMapping : PUT /api/change-password � mise � jour idempotente d'une ressource.
    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody com.example.auth.dto.ChangePasswordRequest req) {
        authService.changePassword(extractToken(authHeader), req);
        return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès."));
    }

    // --------------------------------------------------------------------
    //  VALIDATION INTERNE (appel�e par catalog et inscription)
    // --------------------------------------------------------------------

    /**
     * Valide un token Bearer et retourne les informations de l'utilisateur.
     * Accepte un JWT sign� HS256 (stateless) ou un UUID opaque (lookup DB).
     * Format de r�ponse attendu par les middlewares PHP de Skillhub :
     * {@code {"valid": true, "user": {"id": 1, "nom": "...", "email": "...", "role": "..."}}}
     *
     * @param authHeader header HTTP {@code Authorization: Bearer <token>} (optionnel)
     * @return HTTP 200 avec {@code {valid: true, user: {...}}}, ou HTTP 401 si invalide
     */
    // @PostMapping : POST /api/validate-token � endpoint inter-services appel� par catalog/inscription.
    @PostMapping("/validate-token")
    public ResponseEntity<Map<String, Object>> validateToken(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401)
                    .body(Map.of("valid", false, "message", "Jeton manquant."));
        }

        String token = extractToken(authHeader);
        try {
            if (token != null && token.startsWith("eyJ")) {
                // JWT : validation par signature (stateless � pas de requ�te DB)
                Map<String, Object> userClaims = authService.validateJwtClaims(token);
                return ResponseEntity.ok(Map.of("valid", true, "user", userClaims));
            }
            // UUID : lookup en base de donn�es (endpoints legacy /api/auth/*)
            User user = authService.getUserByToken(token);
            return ResponseEntity.ok(Map.of("valid", true, "user", toUserMap(user)));
        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(Map.of("valid", false, "message", "Jeton invalide ou expiré."));
        }
    }

    // --------------------------------------------------------------------
    //  LISTE DES UTILISATEURS (pour le service audio)
    // --------------------------------------------------------------------

    /**
     * Retourne la liste de tous les utilisateurs (id, nom, email).
     * Utilis� par le service audio pour la s�lection de destinataires.
     * N�cessite un token valide.
     *
     * @param authHeader header HTTP {@code Authorization: Bearer <token>}
     * @return HTTP 200 avec {@code {utilisateurs: [...]}}, ou HTTP 401 si non autoris�
     */
    // @GetMapping : GET /api/users � lecture seule de la liste des utilisateurs.
    @GetMapping("/users")
    public ResponseEntity<?> listUsers(
            @RequestHeader("Authorization") String authHeader) {
        String token = extractToken(authHeader);
        try {
            if (token != null && token.startsWith("eyJ")) {
                authService.validateJwtClaims(token);
            } else {
                authService.getUserByToken(token);
            }
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Non autorisé."));
        }

        List<Map<String, Object>> utilisateurs = userRepository.findAll().stream()
                .map(u -> Map.<String, Object>of(
                        "id",    u.getId(),
                        "nom",   u.getName() != null ? u.getName() : u.getEmail(),
                        "email", u.getEmail()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("utilisateurs", utilisateurs));
    }

    // --------------------------------------------------------------------
    //  HEALTH CHECK
    // --------------------------------------------------------------------

    /**
     * Endpoint de sant� du service.
     *
     * @return HTTP 200 avec {@code {"status": "UP"}}
     */
    // @GetMapping : GET /api/health � sond� par les load balancers / monitoring.
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        // Endpoint simple qui r�pond UP si le service r�pond.
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    // --------------------------------------------------------------------
    //  M�THODES PRIV�ES
    // --------------------------------------------------------------------

    /**
     * Extrait la valeur du jeton depuis le header Authorization.
     *
     * @param authHeader valeur brute du header (ex : {@code "Bearer abc123"})
     * @return le jeton seul, ou la valeur telle quelle si le pr�fixe est absent
     */
    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return authHeader;
    }

    private User authenticatedUser(String authHeader) {
        String token = extractToken(authHeader);
        if (token != null && token.startsWith("eyJ")) {
            Map<String, Object> claims = authService.validateJwtClaims(token);
            String email = (String) claims.get("email");
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));
        }

        return authService.getUserByToken(token);
    }

    /**
     * Construit le DTO public {@link UtilisateurInfo} � partir d'une entit� User.
     *
     * @param user l'entit� utilisateur en base
     * @return DTO contenant {id, nom, email, role}
     */
    private UtilisateurInfo toUtilisateurInfo(User user) {
        // On construit le DTO public � partir de l'entit� User.
        // Si le nom est vide, on utilise l'email � la place.
        // Si le r�le est vide, on met "apprenant" par d�faut.
        return new UtilisateurInfo(
                user.getId(),
                user.getName() != null ? user.getName() : user.getEmail(),
                user.getEmail(),
                user.getRole() != null ? user.getRole() : "apprenant",
                user.getAvatarUrl()
        );
    }

    /**
     * Variante de {@link #toUtilisateurInfo} retournant une {@code Map} (format
     * attendu par les middlewares Laravel de catalog/inscription).
     *
     * @param user l'entit� utilisateur en base
     * @return une Map contenant {id, nom, email, role}
     */
    private Map<String, Object> toUserMap(User user) {
        // M�me logique que toUtilisateurInfo mais sous forme de Map.
        Map<String, Object> donnees = new HashMap<>();
        donnees.put("id", user.getId());
        donnees.put("nom", user.getName() != null ? user.getName() : user.getEmail());
        donnees.put("email", user.getEmail());
        donnees.put("role", user.getRole() != null ? user.getRole() : "apprenant");
        donnees.put("avatarUrl", user.getAvatarUrl());
        donnees.put("avatar_url", user.getAvatarUrl());
        return donnees;
    }
}
