SET FOREIGN_KEY_CHECKS=0;
DELETE FROM visits;
DELETE FROM family_needs;
DELETE FROM families;
DELETE FROM items;
DELETE FROM users;
SET FOREIGN_KEY_CHECKS=1;
-- Users and visits are seeded by DataInitializer with BCrypt-hashed passwords.

INSERT INTO families (id, head_name, address, urgency_index, latitude, longitude, active, created_at, updated_at) VALUES
  (1, 'Famille Ben Salah', 'Sousse, Khzema', 4, 35.8256, 10.6084, 1, NOW(), NOW()),
  (2, 'Famille Ayadi', 'Sfax, Menzel Chaker', 8, 34.7406, 10.7603, 1, NOW(), NOW()),
  (3, 'Famille Belghith', 'Tunis, Mrezga', 7, 36.8065, 10.1815, 1, NOW(), NOW());

INSERT INTO family_needs (family_id, need) VALUES
  (1, 'Alimentaire'),
  (1, 'Medical'),
  (2, 'Medical'),
  (2, 'Alimentaire'),
  (3, 'Medical'),
  (3, 'Scolaire');

INSERT INTO items (id, name, category, quantity, unit, min_threshold, created_at, updated_at) VALUES
  (1, 'Lait infantile', 'Alimentaire', 5, 'boites', 10, NOW(), NOW()),
  (2, 'Doliprane 1000', 'Medical', 45, 'boites', 20, NOW(), NOW()),
  (3, 'Couvertures', 'Autre', 2, 'pieces', 5, NOW(), NOW()),
  (4, 'Cahiers scolaires', 'Scolaire', 120, 'pieces', 50, NOW(), NOW()),
  (5, 'Pates', 'Alimentaire', 25, 'kg', 30, NOW(), NOW());

