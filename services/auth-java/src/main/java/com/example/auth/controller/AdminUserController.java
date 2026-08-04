package com.example.auth.controller;

import com.example.auth.entity.User;
import com.example.auth.repository.UserRepository;
import com.example.auth.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private static final Logger journal = LoggerFactory.getLogger(AdminUserController.class);
    private static final Set<String> ROLES = Set.of("administrateur", "admin", "formateur", "apprenant");
    private static final Set<String> STATUTS = Set.of("actif", "desactive", "en_attente", "suspendu", "supprime");

    private final AuthService authService;
    private final UserRepository userRepository;

    public AdminUserController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listUsers(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "tous") String role,
            @RequestParam(defaultValue = "tous") String status,
            @RequestParam(defaultValue = "toutes") String period,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        requireAdmin(authHeader);

        List<User> filtered = userRepository.findAll().stream()
                .filter(user -> matchesSearch(user, search))
                .filter(user -> matchesValue(role, user.getRole()))
                .filter(user -> matchesValue(status, normalizedStatus(user)))
                .filter(user -> matchesPeriod(user, period))
                .sorted(comparator(sort, direction))
                .toList();

        int safeSize = Math.max(5, Math.min(size, 50));
        int safePage = Math.max(page, 0);
        int from = Math.min(safePage * safeSize, filtered.size());
        int to = Math.min(from + safeSize, filtered.size());

        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("page", safePage);
        pagination.put("size", safeSize);
        pagination.put("total", filtered.size());
        pagination.put("pages", (int) Math.ceil(filtered.size() / (double) safeSize));

        return ok("Utilisateurs chargés.", Map.of(
                "utilisateurs", filtered.subList(from, to).stream().map(this::toUserSummary).toList(),
                "pagination", pagination
        ));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats(@RequestHeader("Authorization") String authHeader) {
        requireAdmin(authHeader);
        List<User> users = userRepository.findAll();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", users.size());
        stats.put("apprenants", countRole(users, "apprenant"));
        stats.put("formateurs", countRole(users, "formateur"));
        stats.put("desactives", users.stream().filter(user -> !"actif".equals(normalizedStatus(user))).count());
        stats.put("nouveauxMois", users.stream().filter(this::createdThisMonth).count());
        return ok("Statistiques chargées.", stats);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> detail(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        requireAdmin(authHeader);
        User user = findUser(id);
        Map<String, Object> detail = new LinkedHashMap<>(toUserDetail(user));
        detail.put("activite", activityFor(user));
        detail.put("formations", List.of());
        return ok("Utilisateur chargé.", detail);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User admin = requireAdmin(authHeader);
        User user = findUser(id);

        updateName(user, body.get("nom"));
        updateEmail(user, body.get("email"));
        updateOptional(user::setAvatarUrl, body.get("avatarUrl"));
        updateOptional(user::setBio, body.get("bio"));
        updateOptional(user::setExpertise, body.get("expertise"));
        updateRole(admin, user, body.get("role"));
        updateStatus(user, body.get("status"), body.get("reason"));

        User saved = userRepository.save(user);
        audit(admin, saved, "modification", "Compte modifié");
        return ok("Utilisateur mis à jour avec succès.", toUserDetail(saved));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<Map<String, Object>> changeRole(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User admin = requireAdmin(authHeader);
        User user = findUser(id);
        updateRole(admin, user, body.get("role"));
        User saved = userRepository.save(user);
        audit(admin, saved, "changement_role", "Rôle changé vers " + saved.getRole());
        return ok("Rôle modifié.", toUserDetail(saved));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> changeStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User admin = requireAdmin(authHeader);
        User user = findUser(id);
        updateStatus(user, body.get("status"), body.get("reason"));
        User saved = userRepository.save(user);
        audit(admin, saved, "changement_statut", "Statut changé vers " + saved.getStatus());
        return ok("Statut modifié.", toUserDetail(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> archiveUser(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        User admin = requireAdmin(authHeader);
        User user = findUser(id);
        if (admin.getId().equals(user.getId())) {
            return forbidden("Un administrateur ne peut pas supprimer son propre compte.");
        }
        user.setStatus("supprime");
        user.setDisabledAt(LocalDateTime.now());
        user.setDisabledReason("Archivage administrateur");
        User saved = userRepository.save(user);
        audit(admin, saved, "archivage", "Compte archivé logiquement");
        return ok("Utilisateur archivé.", toUserDetail(saved));
    }

    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> bulkAction(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> body) {
        User admin = requireAdmin(authHeader);
        String action = String.valueOf(body.getOrDefault("action", ""));
        String value = String.valueOf(body.getOrDefault("value", ""));
        List<Long> ids = readIds(body.get("ids"));
        List<User> users = userRepository.findAllById(ids).stream()
                .filter(user -> !admin.getId().equals(user.getId()))
                .collect(Collectors.toList());

        for (User user : users) {
            if ("status".equals(action)) {
                updateStatus(user, value, "Action groupée");
            } else if ("role".equals(action)) {
                updateRole(admin, user, value);
            } else if ("delete".equals(action)) {
                user.setStatus("supprime");
                user.setDisabledAt(LocalDateTime.now());
                user.setDisabledReason("Archivage groupé");
            }
        }

        userRepository.saveAll(users);
        audit(admin, null, "action_groupee", action + " sur " + users.size() + " comptes");
        return ok(users.size() + " utilisateurs mis à jour.", Map.of("updated", users.size()));
    }

    @GetMapping("/{id}/activity")
    public ResponseEntity<Map<String, Object>> activity(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        requireAdmin(authHeader);
        return ok("Activité chargée.", activityFor(findUser(id)));
    }

    private User requireAdmin(String authHeader) {
        User user = authenticatedUser(authHeader);
        String role = safe(user.getRole()).toLowerCase(Locale.ROOT);
        if (!role.equals("administrateur") && !role.equals("admin")) {
            throw new AdminAccessDeniedException("Accès réservé aux administrateurs.");
        }
        return user;
    }

    private User authenticatedUser(String authHeader) {
        String token = extractToken(authHeader);
        if (token != null && token.startsWith("eyJ")) {
            Map<String, Object> claims = authService.validateJwtClaims(token);
            String email = String.valueOf(claims.get("email"));
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new AdminAccessDeniedException("Utilisateur introuvable."));
        }
        return authService.getUserByToken(token);
    }

    private String extractToken(String authHeader) {
        return authHeader != null && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AdminNotFoundException("Utilisateur introuvable."));
    }

    private boolean matchesSearch(User user, String search) {
        String term = safe(search).toLowerCase(Locale.ROOT);
        if (term.isBlank()) return true;
        return safe(user.getName()).toLowerCase(Locale.ROOT).contains(term)
                || safe(user.getEmail()).toLowerCase(Locale.ROOT).contains(term)
                || String.valueOf(user.getId()).contains(term);
    }

    private boolean matchesValue(String filter, String value) {
        String normalized = safe(filter).toLowerCase(Locale.ROOT);
        return normalized.isBlank() || normalized.equals("tous") || normalized.equals(safe(value).toLowerCase(Locale.ROOT));
    }

    private boolean matchesPeriod(User user, String period) {
        if (user.getCreatedAt() == null || "toutes".equalsIgnoreCase(period)) return true;
        LocalDate created = user.getCreatedAt().toLocalDate();
        LocalDate today = LocalDate.now();
        return switch (safe(period)) {
            case "aujourdhui" -> created.equals(today);
            case "semaine" -> !created.isBefore(today.minusDays(7));
            case "mois" -> created.getMonth().equals(today.getMonth()) && created.getYear() == today.getYear();
            default -> true;
        };
    }

    private Comparator<User> comparator(String sort, String direction) {
        Comparator<User> comparator = switch (safe(sort)) {
            case "nom" -> Comparator.comparing(user -> safe(user.getName()), String.CASE_INSENSITIVE_ORDER);
            case "email" -> Comparator.comparing(user -> safe(user.getEmail()), String.CASE_INSENSITIVE_ORDER);
            case "role" -> Comparator.comparing(user -> safe(user.getRole()), String.CASE_INSENSITIVE_ORDER);
            case "status" -> Comparator.comparing(this::normalizedStatus, String.CASE_INSENSITIVE_ORDER);
            case "lastLoginAt" -> Comparator.comparing(User::getLastLoginAt, Comparator.nullsLast(Comparator.naturalOrder()));
            default -> Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()));
        };
        return "asc".equalsIgnoreCase(direction) ? comparator : comparator.reversed();
    }

    private long countRole(List<User> users, String role) {
        return users.stream().filter(user -> role.equalsIgnoreCase(safe(user.getRole()))).count();
    }

    private boolean createdThisMonth(User user) {
        if (user.getCreatedAt() == null) return false;
        LocalDate now = LocalDate.now();
        LocalDate created = user.getCreatedAt().toLocalDate();
        return created.getMonth().equals(now.getMonth()) && created.getYear() == now.getYear();
    }

    private Map<String, Object> toUserSummary(User user) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", user.getId());
        data.put("nom", displayName(user));
        data.put("email", user.getEmail());
        data.put("role", normalizedRole(user));
        data.put("status", normalizedStatus(user));
        data.put("avatarUrl", user.getAvatarUrl());
        data.put("createdAt", date(user.getCreatedAt()));
        data.put("lastLoginAt", date(user.getLastLoginAt()));
        data.put("formationsCount", 0);
        data.put("emailVerified", true);
        return data;
    }

    private Map<String, Object> toUserDetail(User user) {
        Map<String, Object> data = new LinkedHashMap<>(toUserSummary(user));
        data.put("bio", user.getBio());
        data.put("expertise", user.getExpertise());
        data.put("disabledAt", date(user.getDisabledAt()));
        data.put("disabledReason", user.getDisabledReason());
        data.put("profil", profileStats(user));
        return data;
    }

    private Map<String, Object> profileStats(User user) {
        String role = normalizedRole(user);
        Map<String, Object> data = new LinkedHashMap<>();
        if ("formateur".equals(role)) {
            data.put("formationsCreees", 0);
            data.put("formationsPubliees", 0);
            data.put("brouillons", 0);
            data.put("apprenants", 0);
        } else if ("administrateur".equals(role) || "admin".equals(role)) {
            data.put("creation", date(user.getCreatedAt()));
            data.put("derniereActiviteAdministrative", date(user.getLastLoginAt()));
        } else {
            data.put("formationsInscrites", 0);
            data.put("formationsTerminees", 0);
            data.put("progressionMoyenne", 0);
            data.put("quizPasses", 0);
        }
        return data;
    }

    private List<Map<String, Object>> activityFor(User user) {
        List<Map<String, Object>> activity = new ArrayList<>();
        activity.add(activity("Création du compte", user.getCreatedAt(), "Compte créé dans SkillHub."));
        if (user.getLastLoginAt() != null) {
            activity.add(activity("Connexion", user.getLastLoginAt(), "Dernière connexion réussie."));
        }
        if (user.getDisabledAt() != null) {
            activity.add(activity("Changement de statut", user.getDisabledAt(), safe(user.getDisabledReason())));
        }
        return activity;
    }

    private Map<String, Object> activity(String title, LocalDateTime date, String description) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("titre", title);
        item.put("date", date(date));
        item.put("description", description);
        return item;
    }

    private void updateName(User user, String name) {
        String value = safe(name);
        if (!value.isBlank()) user.setName(value);
    }

    private void updateEmail(User user, String email) {
        String value = safe(email).toLowerCase(Locale.ROOT);
        if (value.isBlank()) return;
        if (!value.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new AdminValidationException("Email invalide.");
        }
        User other = userRepository.findByEmail(value).orElse(null);
        if (other != null && !other.getId().equals(user.getId())) {
            throw new AdminValidationException("Cet email est déjà utilisé.");
        }
        user.setEmail(value);
    }

    private void updateOptional(java.util.function.Consumer<String> setter, String value) {
        if (value != null) setter.accept(value.isBlank() ? null : value.trim());
    }

    private void updateRole(User admin, User user, String role) {
        String value = safe(role).toLowerCase(Locale.ROOT);
        if (value.isBlank()) return;
        if (!ROLES.contains(value)) throw new AdminValidationException("Rôle invalide.");
        if (admin.getId().equals(user.getId()) && !value.equals("administrateur") && !value.equals("admin")) {
            throw new AdminValidationException("Vous ne pouvez pas retirer votre propre rôle administrateur.");
        }
        user.setRole("admin".equals(value) ? "administrateur" : value);
    }

    private void updateStatus(User user, String status, String reason) {
        String value = safe(status).toLowerCase(Locale.ROOT);
        if (value.isBlank()) return;
        if (!STATUTS.contains(value)) throw new AdminValidationException("Statut invalide.");
        user.setStatus(value);
        if (!"actif".equals(value)) {
            user.setDisabledAt(LocalDateTime.now());
            user.setDisabledReason(safe(reason));
        } else {
            user.setDisabledAt(null);
            user.setDisabledReason(null);
        }
    }

    private List<Long> readIds(Object rawIds) {
        if (!(rawIds instanceof List<?> values)) return List.of();
        return values.stream()
                .map(value -> Long.valueOf(String.valueOf(value)))
                .toList();
    }

    private String normalizedRole(User user) {
        String role = safe(user.getRole()).toLowerCase(Locale.ROOT);
        return role.isBlank() ? "apprenant" : role;
    }

    private String normalizedStatus(User user) {
        String status = safe(user.getStatus()).toLowerCase(Locale.ROOT);
        return status.isBlank() ? "actif" : status;
    }

    private String displayName(User user) {
        return safe(user.getName()).isBlank() ? user.getEmail() : user.getName();
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private String date(LocalDateTime value) {
        return value == null ? null : value.toString();
    }

    private void audit(User admin, User target, String action, String result) {
        journal.info("ADMIN_ACTION admin={} target={} action={} result={}",
                admin.getEmail(), target != null ? target.getEmail() : "-", action, result);
    }

    private ResponseEntity<Map<String, Object>> ok(String message, Object data) {
        return ResponseEntity.ok(Map.of("success", true, "message", message, "data", data));
    }

    private ResponseEntity<Map<String, Object>> forbidden(String message) {
        return ResponseEntity.status(403).body(Map.of("success", false, "message", message, "errors", Map.of()));
    }

    @ExceptionHandler(AdminAccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> accessDenied(AdminAccessDeniedException exception) {
        return ResponseEntity.status(403).body(Map.of("success", false, "message", exception.getMessage(), "errors", Map.of()));
    }

    @ExceptionHandler(AdminNotFoundException.class)
    public ResponseEntity<Map<String, Object>> notFound(AdminNotFoundException exception) {
        return ResponseEntity.status(404).body(Map.of("success", false, "message", exception.getMessage(), "errors", Map.of()));
    }

    @ExceptionHandler(AdminValidationException.class)
    public ResponseEntity<Map<String, Object>> validation(AdminValidationException exception) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", exception.getMessage(), "errors", Map.of()));
    }

    private static class AdminAccessDeniedException extends RuntimeException {
        AdminAccessDeniedException(String message) {
            super(message);
        }
    }

    private static class AdminNotFoundException extends RuntimeException {
        AdminNotFoundException(String message) {
            super(message);
        }
    }

    private static class AdminValidationException extends RuntimeException {
        AdminValidationException(String message) {
            super(message);
        }
    }
}
