package com.example.auth;

import com.example.auth.service.MasterKeyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Vérifie que les mots de passe chiffrés par l'ancien service auth Laravel
 * (format iv:ciphertext:tag) restent lisibles.
 */
class MasterKeyLegacyTest {

    private MasterKeyService service;

    @BeforeEach
    void setUp() {
        service = new MasterKeyService();
        ReflectionTestUtils.setField(service, "cleMaitreBrute", "UneCleSuperSecreteDe32Caracteres!");
        service.init();
    }

    @Test
    @DisplayName("Déchiffre un mot de passe au format Laravel iv:ciphertext:tag")
    void dechiffreAncienFormatLaravel() {
        // Valeur produite par openssl_encrypt(..., 'aes-256-gcm', ...) côté PHP
        String ancien = "UqLMSeiEvS9he1Rk:3HPTa2F2iQ743bQMAdpae8UY:CqVdcLDe/4UNP9SpL4a3CA==";
        assertThat(service.decrypt(ancien)).isEqualTo("Ancien1!motdepasse");
    }

    @Test
    @DisplayName("Le format actuel v1 fonctionne toujours")
    void chiffreEtDechiffreFormatActuel() {
        String chiffre = service.encrypt("Nouveau1!motdepasse");
        assertThat(chiffre).startsWith("v1:");
        assertThat(service.decrypt(chiffre)).isEqualTo("Nouveau1!motdepasse");
    }

    @Test
    @DisplayName("Un ancien format altéré est refusé")
    void ancienFormatAltereRefuse() {
        String altere = "UqLMSeiEvS9he1Rk:3HPTa2F2iQ743bQMAdpae8UY:AAAAAAAAAAAAAAAAAAAAAA==";
        assertThatThrownBy(() -> service.decrypt(altere)).isInstanceOf(IllegalStateException.class);
    }
}
